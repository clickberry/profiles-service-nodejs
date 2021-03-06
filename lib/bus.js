// env
if (!process.env.NSQLOOKUPD_ADDRESSES) {
  console.log("NSQLOOKUPD_ADDRESSES environment variable required.");
  process.exit(1);
}

var events = require('events');
var util = require('util');
var nsq = require('nsqjs');
var debug = require('debug')('clickberry:profiles:worker');

function Bus(options) {
  options = options || {};
  options.nsqlookupdAddresses = options.nsqlookupdAddresses || process.env.NSQLOOKUPD_ADDRESSES;

  var bus = this;
  events.EventEmitter.call(this);

  // register readers
  var lookupdHTTPAddresses = options.nsqlookupdAddresses.split(',');
  debug('lookupdHTTPAddresses: ' + JSON.stringify(lookupdHTTPAddresses));

  var registrations_reader = new nsq.Reader('registrations', 'create-profile', {
    lookupdHTTPAddresses: lookupdHTTPAddresses
  });
  registrations_reader.connect();
  registrations_reader.on('message', function (msg) {
    bus.emit('registration', msg);
  });

  var deletes_reader = new nsq.Reader('account-deletes', 'delete-profile', {
    lookupdHTTPAddresses: lookupdHTTPAddresses
  });
  deletes_reader.connect();
  deletes_reader.on('message', function (msg) {
    bus.emit('delete', msg);
  });
}

util.inherits(Bus, events.EventEmitter);

module.exports = Bus;
