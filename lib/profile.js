// env
if (!process.env.REDIS_ADDRESS) {
    console.log("REDIS_ADDRESS environment variable required.");
    process.exit(1);
}

var redis = require('redis');
var db = redis.createClient(parseInt(process.env.REDIS_PORT, 10) || 6379, process.env.REDIS_ADDRESS);

function Profile(obj) {
  "use strict";
  var i = 0, keys;
  for (keys = Object.keys(obj); i < keys.length; i += 1) {
    this[keys[i]] = obj[keys[i]];
  }
}

function setProfileData(id, profile, fn) {
  "use strict";
  db.hmset('profile:' + id, profile, function (err) {
    fn(err);
  });
}

function unindexProfileByEmail(id, email, fn) {
  "use strict";
  db.del('profile:id:' + email, id, function (err) {
    fn(err);
  });
}

function indexProfileByEmail(id, email, fn) {
  "use strict";
  db.set('profile:id:' + email, id, function (err) {
    fn(err);
  });
}

Profile.prototype.save = function (fn) {
    "use strict";
    var profile = this;
    var id = profile.id;

    if (!id) {
        return fn(new Error('Profile id required!'));
    }

    Profile.get(id, function (err, original) {
        if (err) {
            return fn(err);
        }
        if (original) {
            // existing profile
            return profile.update(fn);
        }

        // register new profile
        if (profile.email) {
            // check if email not occupied
            Profile.getId(profile.email, function (err, email_id) {
                if (err) {
                    return fn(err);
                }
                if (email_id) {
                    err = new Error('Email already occupied');
                    err.type = 'conflict';
                    return fn(err);
                }

                // index profile id by email
                indexProfileByEmail(id, profile.email, function (err) {
                    if (err) {
                        return fn(err);
                    }
                    setProfileData(id, profile, fn);
                });
            });
        } else {
            setProfileData(id, profile, fn);
        }
    });
};

Profile.prototype.update = function (fn) {
    "use strict";
    var profile = this;
    var id = profile.id;

    Profile.get(id, function (err, original) {
        if (err) {
            return fn(err);
        }
        if (!original) {
            err = new Error('Profile with id ' + id + ' does not exist.');
            err.type = 'notFound';
            return fn(err);
        }

        // check if email not occupied
        Profile.getId(profile.email, function (err, email_id) {
            if (err) {
                return fn(err);
            }
            if (email_id && email_id !== id) {
                err = new Error('Email already occupied.');
                err.type = 'conflict';
                return fn(err);
            }

            if (original.email) {
                // remove old profile email index
                unindexProfileByEmail(id, original.email, function (err) {
                    if (err) {
                        return fn(err);
                    }
                    // index profile id by email
                    indexProfileByEmail(id, profile.email, function (err) {
                        if (err) {
                            return fn(err);
                        }
                        setProfileData(id, profile, fn);
                    });
                });
            } else {
                // index profile id by email
                indexProfileByEmail(id, profile.email, function (err) {
                    if (err) {
                        return fn(err);
                    }
                    setProfileData(id, profile, fn);
                });
            }
        });
    });
};

Profile.del = function (id, fn) {
    "use strict";
    Profile.get(id, function (err, profile) {
        if (err) {
            return fn(err);
        }
        if (!profile) {
            // profile does not exist
            return fn();
        }

        // delete profile data
        db.del('profile:' + id, function (err) {
            if (err) {
                return fn(err);
            }

            
            if (profile.email) {
                // delete index
                unindexProfileByEmail(id, profile.email, function (err) {
                    if (err) {
                        return fn(err);
                    }
                    fn(null, profile);
                });  
            } else {
                fn(null, profile);
            }
        });
    });
};

Profile.getId = function (email, fn) {
    "use strict";
    db.get('profile:id:' + email, fn);
};

Profile.get = function (id, fn) {
    "use strict";
    db.hgetall('profile:' + id, function (err, profile) {
        if (err) {
            return fn(err);
        }
        if (!profile) {
            return fn();
        }
        fn(null, new Profile(profile));
    });
};

Profile.prototype.toJSON = function () {
    "use strict";
    return {
        id: this.id,
        name: this.name,
        email: this.email
    };
};

module.exports = Profile;