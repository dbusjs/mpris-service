var Type = require('./type');

module.exports = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2.TrackList',
		      iface = this.obj.createInterface(ifaceName);

	this.tracks = [];

	// Methods

	iface.addMethod('GetTracksMetadata', {
		in: [ Type('ao', 'TrackIds') ],
		out: Type('aa{sv}', 'Metadata')
	}, function (trackIds) {
		callback(that.tracks.filter(function (track, callback) {
			return (trackIds.indexOf(track['mpris:trackid']) >= 0);
		}));
	});

	iface.addMethod('AddTrack', {
		in: [ Type('s', 'Uri'), Type('o', 'AfterTrack'), Type('b', 'SetAsCurrent') ]
	}, function (uri, afterTrack, setAsCurrent, callback) {
		that.emit('addTrack', {
			uri: uri,
			afterTrack: afterTrack,
			setAsCurrent: setAsCurrent
		});
		callback();
	});

	iface.addMethod('RemoveTrack', { in: [ Type('o', 'TrackId') ] }, function (trackId, callback) {
		that.emit('removeTrack', trackId);
		callback();
	});

	iface.addMethod('GoTo', { in: [ Type('o', 'TrackId') ] }, function (trackId, callback) {
		that.emit('goTo', trackId);
		callback();
	});

	// Signals

	iface.addSignal('TrackListReplaced', {
		types: [Type('ao', 'Tracks'), Type('o', 'CurrentTrack')]
	});

	iface.addSignal('TrackAdded', {
		types: [Type('a{sv}', 'Metadata'), Type('o', 'AfterTrack')]
	});

	iface.addSignal('TrackRemoved', {
		types: [Type('o', 'TrackId')]
	});

	iface.addSignal('TrackMetadataChanged', {
		types: [Type('o', 'TrackId'), Type('a{sv}', 'Metadata')]
	});

	// Properties

	iface.addProperty('Tracks', {
		type: Type('ao'),
		getter: function(callback) {
			callback(that.tracks);
		}
	});

	iface.addProperty('CanEditTracks', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canEditTracks != 'undefined') ? that.canEditTracks : false);
		}
	});

	iface.update();
	this.interfaces.trackList = iface;
};
