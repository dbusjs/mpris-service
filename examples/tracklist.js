var Player = require('../dist');

var player = Player({
	name: 'nodejs',
	identity: 'Node.js media player',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
	supportedInterfaces: ['trackList']
});

// Events
var events = ['addTrack', 'removeTrack', 'goTo'];
events.forEach(function (eventName) {
	player.on(eventName, function () {
		console.log('Event:', eventName, arguments);
	});
});

player.tracks = [
  {
    'mpris:trackid': player.objectPath('track/0'),
    'mpris:length': 60 * 1000 * 1000,
    'mpris:artUrl': 'http://www.adele.tv/images/facebook/adele.jpg',
    'xesam:title': 'Lolol',
    'xesam:album': '21',
    'xesam:artist': 'Adele'
  },
  {
    'mpris:trackid': player.objectPath('track/1'),
    'mpris:length': 60 * 1000 * 1000,
    'mpris:artUrl': 'file:///home/emersion/anime/waifu.jpg',
    'xesam:title': 'Shake It Off',
    'xesam:album': '21',
    'xesam:artist': 'Taylor Swift'
  }
];
