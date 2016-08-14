const dbus = require('dbus-native');

const Player = require('../index');

const playername = () => {
  return 'test' + (Math.random() * 1000 | 0).toString();
};

const servicename = (player) => {
  return 'org.mpris.MediaPlayer2.' + player;
};

const objectpath = '/org/mpris/MediaPlayer2';
const namespace = 'org.mpris.MediaPlayer2.Player';

describe('player interface', () => {
  it('should emit "next" event on .Next() method call', (done) => {
    const name = playername();
    const player = new Player({
      name
    });

    player.on('next', done);

    const service = dbus.sessionBus().getService(servicename(name));
    service.getInterface(objectpath, namespace, (err, player) => {
      if (err) {
        fail(err);
      }
      player.Next();
    });
  });
});
