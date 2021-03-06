
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var fmt = require('util').format;
var assert = require('assert');
var should = require('should');
var Hubspot = require('..');
var uid = require('uid');

describe('HubSpot', function () {
  var settings;
  var payload;
  var hubspot;

  beforeEach(function(){
    hubspot = new Hubspot;
    payload = {};
    settings = {
      portalId: 62515,
      apiKey: 'demo'
    };
  });

  it('should have correct settings', function(){
    test(hubspot)
      .name('HubSpot')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test(hubspot).enabled({
        channel: 'server',
        userId: 'calvin@segment.io'
      });
    });

    it('should be disabled on other channels', function(){
      test(hubspot).disabled({
        channel: 'client',
        userId: 'calvin@segment.io'
      });
    });

    it('should be disabled if email is missing', function(){
      test(hubspot).disabled({
        channel: 'server'
      });
    });
  });


  describe('.validate()', function () {
    it('should be invalid without portalId', function(){
      delete settings.portalId;
      test(hubspot).invalid({}, settings);
    });

    it('should be invalid without apiKey', function(){
      delete settings.apiKey;
      test(hubspot).invalid({}, settings);
    });

    it('should be valid with apiKey and portalId', function(){
      test(hubspot).valid({}, settings);
    });
  });


  describe('.identify()', function () {
    it('should identify successfully', function (done) {
      var msg = helpers.identify();

      payload.properties = [
        { property: 'last_name', value: 'Doe' },
        { property: 'company', value: 'Segment.io' },
        { property: 'firstname', value: 'John' },
        { property: 'lastname', value: 'Doe' },
        { property: 'email', value: msg.email() },
        { property: 'phone', value: '5555555555' },
        { property: 'city', value: 'San Francisco' },
        { property: 'state', value: 'CA' }
      ];

      test(hubspot)
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(200)
        .end(done);
    });

    it('should identify a second time', function (done) {
      test(hubspot)
        .identify(helpers.identify())
        .set(settings)
        .expects(204)
        .end(done);
    });

    it('should identify with "date" objects', function (done) {
      // the hubspot demo key has this as the only "date" type
      var msg = helpers.identify({
        traits: {
          offerextractdate: new Date()
        }
      });

      payload.properties = [
        { property: 'last_name', value: 'Doe' },
        { property: 'company', value: 'Segment.io' },
        { property: 'firstname', value: 'John' },
        { property: 'lastname', value: 'Doe' },
        { property: 'email', value: msg.email() },
        { property: 'phone', value: '5555555555' },
        { property: 'city', value: 'San Francisco' },
        { property: 'state', value: 'CA' }
      ];

      test(hubspot)
        .identify(msg)
        .set(settings)
        .sends(payload)
        .expects(204)
        .end(done);
    });
  });

  describe('._create()', function () {
    var email = fmt('test-%s@segment.io', uid());
    var properties = [{ property: 'email', value: email }];

    it('should be able to ._create() once', function (done) {
      hubspot._create(properties, settings, done);
    });

    it('should be able to ._update() on the second call', function (done) {
      hubspot._create(properties, settings, done);
    });
  });


  describe('.track()', function () {
    it('should track successfully', function (done) {
      var msg = helpers.track();

      payload._a = settings.portalId;
      payload._n = msg.event();
      payload._m = msg.revenue();
      payload.address = JSON.stringify(msg.proxy('properties.address'));
      payload.email = msg.email();

      test(hubspot)
        .set(settings)
        .track(msg)
        .query(payload)
        .expects(200)
        .end(done);
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();

    it('should do nothing', function (done) {
      hubspot.alias(alias, settings, done);
    });
  });
});
