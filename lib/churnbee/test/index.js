
var test = require('segmentio-integration-tester');
var integration = require('segmentio-integration');
var ValidationError = integration.errors.Validation;
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Identify = facade.Identify;
var ChurnBee = require('..');
var Track = facade.Track;

describe('ChurnBee', function(){
  var churnbee;
  var settings;

  beforeEach(function(){
    churnbee = new ChurnBee;
    settings = { apiKey: '2XALttZneOtPcKXslITLgMVaTJUOX7h0epxvKMClu84' };
  });

  it('should have the correct settings', function(){
    test(churnbee)
      .name('ChurnBee')
      .endpoint('http://api.churnbee.com/v1')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be enabled for server messages', function(){
      test(churnbee).enabled({
        userId: 'user-id',
        channel: 'server'
      });
    });

    it('should be enabled for mobile messages', function(){
      test(churnbee).enabled({
        userId: 'user-id',
        channel: 'mobile'
      });
    });

    it('should disabled for client messages', function(){
      test(churnbee).disabled({
        userId: 'user-id',
        channel: 'client'
      });
    });

    it('should disabled if .userId() is not given', function(){
      test(churnbee).disabled({
        channel: 'server'
      });
    });

    it('should disabled if .event() does not exist', function(){
      test(churnbee).disabled({
        channel: 'server',
        userId: 'user-id',
        type: 'identify'
      });
    });
  })

  describe('.validate()', function(){
    it('should be invalid apiKey is missing', function(){
      test(churnbee).invalid({ event: 'my-event' }, {});
    });

    it('should be invalid if the event is not supported', function(){
      test(churnbee).invalid({ event: 'baz' }, {});
    });

    it('should be valid if event is supported', function(){
      test(churnbee).valid({ event: 'register' }, settings);
    });

    it('should be valid if event is in .events{} map', function(){
      settings.events = { baz: 'register' };
      test(churnbee).valid({ event: 'baz' }, settings);
    });
  });

  describe('.track()', function(){
    it('should track register correctly', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      var props = stringify(track.properties());
      settings.events = { Baz: 'register' };
      test(churnbee)
        .track(track)
        .set(settings)
        .query({ accessToken: settings.apiKey })
        .query({ amount: track.revenue().toString() })
        .query({ dateTime: track.timestamp().toISOString() })
        .query({ custom: props })
        .end(done);
    });

    it('should track register again', function(done){
      var track = helpers.track({ event: 'register', userId: 'sio' });
      churnbee.track(track, settings, done);
    });

    it('should track login', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      settings.events = { baz: 'login' };
      churnbee.track(track, settings, function(err, res){
        if (err) return done(err);
        res.status.should.eql(200);
        done();
      });
    });

    it('should error on incorrect settings', function(done){
      var track = helpers.track({ event: 'baz' });
      settings.apiKey = 'x';
      settings.events = { baz: 'login' };
      churnbee.track(track, settings, function(err){
        should.exist(err);
        done();
      });
    });

    it('should accept array of events', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      settings.events = [{ key: 'baz', value: 'login' }];
      churnbee.track(track, settings, function(err, res){
        if (err) return done(err);
        done();
      });
    });
  });
});

/**
 * Stringify `obj`
 */

function stringify(obj){
  return Object.keys(obj).reduce(function(ret, key){
    var value = obj[key];
    var type = ({}).toString.call(value).slice(8, -1);
    if ('Date' == type || 'Number' == type) value = value.toString();
    ret[key] = value;
    return ret;
  }, {});
}
