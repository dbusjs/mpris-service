'use strict';
const dbus = require('dbus-native');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2.Playlists';

const events = [
  {
    name: 'activatePlaylist',
    method: 'ActivatePlaylist',
    args: (player) => { return [player.objectPath('playlist/0')]; }
  }
];

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

    events.reduce((promise, event) => {

      return promise.then(() => {
        const wait = helpers.waitForEvent(player, event.name);
        object[event.method].apply(object, event.args(player));

        return wait;
      });
    }, Promise.resolve()).then(done).catch(fail);

  });
});
