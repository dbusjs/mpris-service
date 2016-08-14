'use strict';

const dbus = require('dbus-native');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2.Player';

const events = {
  next: {
    method: 'Next',
    args: () => { return []; }
  },
  previous: {
    method: 'Previous',
    args: () => { return []; }
  },
  play: {
    method: 'Play',
    args: () => { return []; }
  },
  pause: {
    method: 'Pause',
    args: () => { return []; }
  },
  playpause: {
    method: 'PlayPause',
    args: () => { return []; }
  },
  stop: {
    method: 'Stop',
    args: () => { return []; }
  },
  open: {
    method: 'OpenUri',
    args: () => { return ['/home/foo']; }
  },
  seek: {
    method: 'Seek',
    args: () => { return [3.14 * 10e6]; }
  },
  position: {
    method: 'SetPosition',
    args: (player) => { return [player.objectPath('playlist/0'), 3.14 * 10e6]; }
  }
};

describe('player interface', () => {
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

        object[call.method].apply(object, call.args(player));

        return wait;
      });
    });

    promise.then(done).catch(fail);
  });
});
