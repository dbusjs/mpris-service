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

const signals = [
  {
    method: 'setActivePlaylist',
    signal: 'PlaylistChanged',
    args: (player) => { return ['playlist/0'] }
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

    player.playlists = [
      {
        Id: 'playlist/0',
        Valid: true
      }
    ];
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

  it('should emit signals on the bus that correspond to method calls', (done) => {

    helpers.getInterfaceAsync(service, objectpath, namespace).then(obj => {

      return signals.reduce((promise, signal) => {
        return promise.then(() => {

            const wait = helpers.waitForEvent(obj, signal.signal).then(function() {
              // args have vastly different formats, need to somehow make them comparable
              // const args = Array.prototype.slice.call(arguments);
              // expect(args).toEqual(signal.args(player));
            });
            player[signal.method].apply(player, signal.args(player));

            return wait;
        });
      }, Promise.resolve());

    }).then(done).catch(fail);

  });
});
