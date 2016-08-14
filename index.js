var DBus = require('dbus');
var events = require('events');
var util = require('util');

var Type = require('./lib/type');

var createRootInterface = require('./lib/root-interface');
var createPlayerInterface = require('./lib/player-interface');
var createTracklistInterface = require('./lib/tracklist-interface');
var createPlaylistsInterface = require('./lib/playlists-interface');

function lcfirst(str) {
	return str[0].toLowerCase()+str.substr(1);
}

function Player(opts) {
	if (!(this instanceof Player)) return new Player(opts);
	events.EventEmitter.call(this);

	var that = this;

	this.name = opts.name;
	this.identity = opts.identity;
	this.supportedUriSchemes = opts.supportedUriSchemes;
	this.supportedMimeTypes = opts.supportedMimeTypes;
	this.desktopEntry = opts.desktopEntry;

	this.supportedInterfaces = opts.supportedInterfaces || ['player'];

	this._properties = {};

	this.init();
}
util.inherits(Player, events.EventEmitter);

Player.prototype.init = function () {
	var dbus = new DBus();

	// Create a new service, object and interface
	this.serviceName = 'org.mpris.MediaPlayer2.'+this.name;
	this.service = dbus.registerService('session', this.serviceName);
	this.obj = this.service.createObject('/org/mpris/MediaPlayer2');

	// TODO: must be defined in dbus module
	this.obj.propertyInterface.addSignal('PropertiesChanged', {
		types: [Type('s', 'interface_name'), Type('a{sv}', 'changed_properties'), Type('as', 'invalidated_properties')]
	});
	this.obj.propertyInterface.update();

	// Init interfaces
	this.interfaces = {};
	this._createRootInterface();
	if (this.supportedInterfaces.indexOf('player') >= 0) {
		this._createPlayerInterface();
	}
	if (this.supportedInterfaces.indexOf('trackList') >= 0) {
		this._createTrackListInterface();
	}
	if (this.supportedInterfaces.indexOf('playlists') >= 0) {
		this._createPlaylistsInterface();
	}
};

/**
* @see http://specifications.freedesktop.org/mpris-spec/latest/Media_Player.html
*/
Player.prototype._createRootInterface = createRootInterface;

/**
* @see http://specifications.freedesktop.org/mpris-spec/latest/Player_Interface.html
*/
Player.prototype._createPlayerInterface = createPlayerInterface;

/**
 * @see http://specifications.freedesktop.org/mpris-spec/latest/Track_List_Interface.html
 */
Player.prototype._createTrackListInterface = createTracklistInterface;

/**
 * @see http://specifications.freedesktop.org/mpris-spec/latest/Playlists_Interface.html
 */
Player.prototype._createPlaylistsInterface = createPlaylistsInterface;

Player.prototype.seeked = function (delta) {
	this.position += delta || 0;
	this.interfaces.player.emitSignal('Seeked', this.position);
};

Player.prototype.objectPath = function (subpath) {
	return '/org/node/mediaplayer/'+this.name+'/'+(subpath || '');
};

Player.prototype._addEventedProperty = function (iface, name) {
	var that = this;

	var localName = lcfirst(name);
	var currentValue = this[localName];

	Object.defineProperty(this, localName, {
		get: function () {
			return that._properties[name];
		},
		set: function (newValue) {
			that._properties[name] = newValue;

			var changed = {};
			changed[name] = newValue;
			that.obj.propertyInterface.emitSignal('PropertiesChanged', iface, changed, []);

		},
		enumerable: true,
		configurable: true
	});

	if (currentValue) {
		this[localName] = currentValue;
	}
};

Player.prototype._addEventedPropertiesList = function (iface, props) {
	for (var i = 0; i < props.length; i++) {
		this._addEventedProperty(iface, props[i]);
	}
};

Player.prototype.getTrackIndex = function (trackId) {
	for (var i = 0; i < this.tracks.length; i++) {
		var track = this.tracks[i];

		if (track['mpris:trackid'] == trackId) {
			return i;
		}
	}

	return -1;
};

Player.prototype.getTrack = function (trackId) {
	return this.tracks[this.getTrackIndex(trackId)];
};

Player.prototype.addTrack = function (track) {
	this.tracks.push(track);

	var afterTrack = '/org/mpris/MediaPlayer2/TrackList/NoTrack';
	if (this.tracks.length > 2) {
		afterTrack = this.tracks[this.tracks.length - 2]['mpris:trackid'];
	}
	that.interfaces.playlists.emitSignal('TrackAdded', afterTrack);
};

Player.prototype.removeTrack = function (trackId) {
	var i = this.getTrackIndex(trackId);
	this.tracks.splice(i, 1);

	that.interfaces.playlists.emitSignal('TrackRemoved', trackId);
};

Player.prototype.getPlaylistIndex = function (playlistId) {
	for (var i = 0; i < this.playlists.length; i++) {
		var playlist = this.playlists[i];

		if (playlist.Id === playlistId) {
			return i;
		}
	}

	return -1;
};

Player.prototype.setPlaylists = function (playlists) {
	this.playlists = playlists;
	this.playlistCount = playlists.length;

	var that = this;
	this.playlists.forEach(function (playlist) {
		that.interfaces.playlists.emitSignal('PlaylistChanged', playlist);
	});
};

Player.prototype.setActivePlaylist = function (playlistId) {
	var i = this.getPlaylistIndex(playlistId);

	this.activePlaylist = {
		Valid: (i >= 0) ? true : false,
		Playlist: this.playlists[i]
	};
};

module.exports = Player;
