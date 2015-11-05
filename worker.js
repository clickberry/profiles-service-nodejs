var debug = require('debug')('clickberry:profiles:worker');
var Profile = require('./lib/profile');
var Bus = require('./lib/bus');
var bus = new Bus();

bus.on('registration', function (msg) {
  var account = JSON.parse(msg.body);
  debug('Account registration: ' + JSON.stringify(account));

  var profile = new Profile({
    id: account.id,
    email: account.email
  });

  if (account.membership) {
    if (account.membership.email) {
      profile.email = account.membership.email;
    }
    if (account.membership.name) {
      profile.name = account.membership.name;
    }
  }

  profile.save(function (err) {
    if (err) {
      debug('Could not create profile: ' + err.message);
      return msg.requeue();
    }

    debug('Profile created successfully for account ' + account.id + ': ' + JSON.stringify(profile));
    msg.finish();
  });
});

bus.on('delete', function (msg) {
  var account = JSON.parse(msg.body);
  debug('Account deletion: ' + JSON.stringify(account));

  Profile.del(account.id, function (err) {
    if (err) {
      debug('Could not delete profile: ' + err.message);
      return msg.requeue();
    }

    debug('Profile deleted successfully for account ' + account.id);
    msg.finish();
  });
});

debug('Listening for messages...');