var Player = require('..');

var player = Player({
	name: 'nodejs',
	identity: 'Node.js media player',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg']
});

setTimeout(function () {
	// @see http://www.freedesktop.org/wiki/Specifications/mpris-spec/metadata/
	player.metadata = {
		'mpris:trackid': '0',
		'mpris:length': 60,
		//'mpris:artUrl': 'http://www.adele.tv/images/facebook/adele.jpg',
		'xesam:title': 'Lolol',
		'xesam:album': '21',
		'xesam:artist': 'Adele'
	};

	player.playbackStatus = 'Playing';
}, 3000);