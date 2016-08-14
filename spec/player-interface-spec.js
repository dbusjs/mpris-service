var dbus = require('dbus-native');

var Player = require('../index');

var playername = function() {
  return 'test' + (Math.random() * 1000 | 0).toString();
};

var servicename = function(player) {
  return 'org.mpris.MediaPlayer2.' + player;
};

var objectpath = '/org/mpris/MediaPlayer2';
var namespace = 'org.mpris.MediaPlayer2.Player';

describe('player interface', function() {
  it('should emit "next" event on .Next() method call', function(done) {
    var name = playername();
    var player = new Player({
      name: name
    });

    player.on('next', done);

    var service = dbus.sessionBus().getService(servicename(name));
    service.getInterface(objectpath, namespace, function(err, player) {
      player.Next();
    });
  });
});
