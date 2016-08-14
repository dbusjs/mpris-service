'use strict';
const dbus = require('dbus-native');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2.TrackList';

const events = {
  addTrack: {
    method: 'AddTrack',
    args: (player) => { return ['/home/foo', player.objectPath('playlist/0'), false]; }
  },
  removeTrack: {
    method: 'RemoveTrack',
    args: (player) => { return [player.objectPath('playlist/0')]; }
  },
  goTo: {
    method: 'GoTo',
    args: (player) => { return [player.objectPath('playlist/0')]; }
  }
};

describe('playlists interface', () => {
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
