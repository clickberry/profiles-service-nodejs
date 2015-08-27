var redis = require('redis');
var db = redis.createClient(parseInt(process.env.REDIS_PORT, 10) || 6379, process.env.REDIS_ADDRESS);

function Profile(obj) {
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      this[key] = obj[key];
    }
  }
}

function setProfileData(id, profile, fn) {
  db.hmset('profile:' + id, profile, function (err) {
    fn(err);
  });
}

Profile.prototype.save = function (fn) {
  var profile = this;
  var id = profile.id;

  if (!id) {
    return fn(new Error('Profile id required!'));
  }

  Profile.get(id, function (err, original) {
    if (err) { return fn(err); }
    if (original) {
      // existing profile
      return profile.update(fn);
    }

    // register new profile
    if (profile.email) {
      // check if email not occupied
      Profile.getId(profile.email, function (err, email_id) {
        if (err) { return fn(err); }
        if (email_id) {
          err = new Error('Email already occupied');
          err.type = 'conflict';
          fn(err);
        }
      });

      // index profile id by email
      db.set('profile:id:' + profile.email, id, function (err) {
        if (err) { return fn(err); }
        setProfileData(id, profile, fn);
      });
    } else {
      setProfileData(id, profile, fn);
    }
  });
};

Profile.prototype.update = function (fn) {
  var profile = this;
  var id = profile.id;

  Profile.get(id, function (err, original) {
    if (err) { return fn(err); }
    if (!original) {
      return fn(new Error('Profile with id ' + id + ' does not exist. Use #save() method instead.'));
    }

    // check if email not occupied
    Profile.getId(profile.email, function (err, email_id) {
      if (err) { return fn(err); }
      if (email_id !== id) {
        err = new Error('Email already occupied');
        err.type = 'conflict';
        fn(err);
      }
    });

    if (original.email) {
      // remove old profile email index
      db.del('profile:id:' + original.email, id, function (err) {
        if (err) { return fn(err); }
      });
    }

    // index profile id by email
    db.set('profile:id:' + profile.email, id, function (err) {
      if (err) { return fn(err); }
      setProfileData(id, profile, fn);
    });
  });
};

Profile.del = function (id, fn) {
  Profile.get(id, function (err, profile) {
    if (err) { return fn(err); }

    // delete profile data
    db.del('profile:' + id, function (err) {
      if (err) { return fn(err); }

      // delete index
      db.del('profile:id:' + profile.email, id, function (err) {
        if (err) { return fn(err); }
        fn(null, profile);
      });
    });
  });
};

Profile.getByEmail = function (email, fn) {
  Profile.getId(email, function (err, id) {
    if (err) { return fn(err); }
    Profile.get(id, fn);
  });
};

Profile.getId = function (email, fn) {
  db.get('profile:id:' + email, fn);
};

Profile.get = function (id, fn) {
  db.hgetall('profile:' + id, function (err, profile) {
    if (err) { return fn(err); }
    if (!profile) { return fn(); }
    fn(null, new Profile(profile));
  });
};

Profile.prototype.toJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email
  };
};

module.exports = Profile;