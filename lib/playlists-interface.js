var Type = require('./type');

module.exports = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2.Playlists',
		      iface = this.obj.createInterface(ifaceName);

	that.playlists = [];

	// Methods

	iface.addMethod('ActivatePlaylist', { in: [ Type('o', 'PlaylistId') ] }, function (playlistId, callback) {
		that.emit('activatePlaylist', playlistId);
		callback();
	});

	iface.addMethod('GetPlaylists', {
		in: [ Type('u', 'Index'), Type('u', 'MaxCount'), Type('s', 'Order'), Type('b', 'ReverseOrder') ],
		out: Type('a(oss)', 'Playlists')
	}, function (index, maxCount, order, reverseOrder, callback) {
		var playlists = that.playlists.slice(index, maxCount).sort(function (a, b) {
			var ret = 1;

			switch (order) {
				case 'Alphabetical':
					ret = (a.Name > b.Name) ? 1 : -1;
					break;
				//case 'CreationDate':
				//case 'ModifiedDate':
				//case 'LastPlayDate':
				case 'UserDefined':
					break;
			}

			if (reverseOrder) ret = -ret;
			return ret;
		});

		callback(playlists);
	});

	// Signals

	iface.addSignal('PlaylistChanged', {
		types: [Type('(oss)', 'Playlist')]
	});

	// Properties

	this._addEventedPropertiesList(ifaceName, ['PlaylistCount', 'ActivePlaylist']);

	iface.addProperty('PlaylistCount', {
		type: Type('u'),
		getter: function(callback) {
			callback(that.playlistCount || 0);
		}
	});

	iface.addProperty('Orderings', {
		type: Type('as'),
		getter: function(callback) {
			callback(['Alphabetical', 'UserDefined']);
		}
	});

	iface.addProperty('ActivePlaylist', {
		type: Type('(b(oss))'),
		getter: function(callback) {
			callback(that.activePlaylist || { Valid: false });
		}
	});

	iface.update();
	this.interfaces.playlists = iface;
};
