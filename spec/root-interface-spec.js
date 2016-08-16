'use strict';
const dbus = require('dbus-native');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2';

const events = {
  quit: {
    method: 'Quit',
    args: () => { return []; }
  },
  raise: {
    method: 'Raise',
    args: () => { return []; }
  }
};

describe('root interface', () => {
  let bus, name, player, service, object, servicename;

  beforeAll((done) => {
    bus = dbus.sessionBus();
    name = helpers.playername();
    player = helpers.getPlayer(name);
    name = player.name;
    servicename = helpers.servicename(name);
    service = bus.getService(servicename);

    service.getInterface(objectpath, namespace, (err, obj) => {
      if (err) {
        fail(err);
      }

      object = obj;
      done();
    });
  });

  it('should emit events that correspond to method calls', (done) => {

    Object.keys(events).reduce((promise, name) => {
      const call = events[name];

      return promise.then(() => {
        const wait = helpers.waitForEvent(player, name);
        object[call.method].apply(object, call.args(player));

        return wait;
      });
    }, Promise.resolve()).then(done).catch(fail);

  });

  it('should emit PropertiesChanged event on property changes', (done) => {

    service.getInterface(objectpath, 'org.freedesktop.DBus.Properties', (err, obj) => {

      obj.on('PropertiesChanged', function(ns, props) {
        done();
      });

      player.PlaybackStatus = 'Playing';
    });

  });
});
