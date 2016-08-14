const dbus = require('dbus-native');

const Player = require('../index');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2.Player';

const events = {
  next: {
    method: 'Next',
    args: []
  },
  previous: {
    method: 'Previous',
    args: []
  },
  play: {
    method: 'Play',
    args: []
  },
  pause: {
    method: 'Pause',
    args: []
  },
  playpause: {
    method: 'PlayPause',
    args: []
  },
  stop: {
    method: 'Stop',
    agrs: []
  },
  open: {
    method: 'OpenUri',
    args: ['/home/foo']
  },
  seek: {
    method: 'Seek',
    args: [3.14 * 10e6]
  },
  // TODO: figure out how to pass first arg
  // position: {
  //   method: 'SetPosition',
  //   args: ['playlist/0', 3.14 * 10e6]
  // }
};

describe('player interface', () => {
  it('should emit events that correspond to method calls', (done) => {
    const name = helpers.playername();
    const player = new Player({ name });

    const service = dbus.sessionBus().getService(helpers.servicename(name));
    service.getInterface(objectpath, namespace, (err, player) => {
      if (err) {
        fail(err);
      }

      let promise = Promise.resolve();
      Object.keys(events).forEach((name) => {
        const call = events[name];

        promise.then(() => {
          const wait = helpers.waitForEvent(player, name);

          player[call.method].apply(player, call.args);

          return wait;
        });
      });

      promise.then(done, fail);
    });
  });
});
