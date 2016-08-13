var Player = require('..');

var player = Player({
	name: 'nodejs',
	identity: 'Node.js media player',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
	supportedInterfaces: ['player']
});

// Events
var events = ['raise', 'quit', 'next', 'previous', 'pause', 'playpause', 'stop', 'play', 'seek', 'position', 'open', 'volume'];
events.forEach(function (eventName) {
	player.on(eventName, function () {
		console.log('Event:', eventName, arguments);
	});
});

player.on('quit', function () {
	process.exit();
});

setTimeout(function () {
	// @see http://www.freedesktop.org/wiki/Specifications/mpris-spec/metadata/
	player.metadata = {
		'mpris:trackid': player.objectPath('track/0'),
		'mpris:length': 60 * 1000 * 1000, // In microseconds
		'mpris:artUrl': 'http://cdn.beggars.com.s3-eu-west-1.amazonaws.com/adele/wp-content/uploads/2015/10/01091631/adele-25-packshot.jpg',
		'xesam:title': 'Lolol',
		'xesam:album': '21',
		'xesam:artist': 'Adele'
	};

	player.playbackStatus = 'Playing';

	console.log('Now playing: Lolol - Adele - 21');
}, 3000);
