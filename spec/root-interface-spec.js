'use strict';
const dbus = require('dbus-native');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2';

const events = {
  quit: {
    method: 'Quit',
    args: []
  },
  raise: {
    method: 'Raise',
    args: []
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
    let promise = Promise.resolve();

    Object.keys(events).forEach((name) => {
      const call = events[name];

      promise = promise.then(() => {
        const wait = helpers.waitForEvent(player, name);
        object[call.method].apply(object, call.args);

        return wait;
      });
    });

    promise.then(done, fail);
  });
});