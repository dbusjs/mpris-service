require('source-map-support').install();

const events = require('events');
const util = require('util');

const dbus = require('dbus-next');
dbus.setBigIntCompat(true);
const PlayerInterface = require('./interfaces/player');
const RootInterface = require('./interfaces/root');
const PlaylistsInterface = require('./interfaces/playlists');
const TracklistInterface = require('./interfaces/tracklist');
const types = require('./interfaces/types');

const MPRIS_PATH = '/org/mpris/MediaPlayer2';

function lcfirst(str) {
  return str[0].toLowerCase()+str.substr(1);
}

function Player(opts) {
  if (!(this instanceof Player)) {
    return new Player(opts);
  }

  events.EventEmitter.call(this);
  this.name = opts.name;
  this.supportedInterfaces = opts.supportedInterfaces || ['player'];
  this._tracks = [];
  this.position = 0;
  this.init(opts);
}
util.inherits(Player, events.EventEmitter);

Player.prototype.init = function(opts) {
  this.serviceName = `org.mpris.MediaPlayer2.${this.name}`;
  this._bus = dbus.sessionBus();

  this.interfaces = {};

  this._addRootInterface(this._bus, opts);

  if (this.supportedInterfaces.indexOf('player') >= 0) {
    this._addPlayerInterface(this._bus);
  }
  if (this.supportedInterfaces.indexOf('trackList') >= 0) {
    this._addTracklistInterface(this._bus);
  }
  if (this.supportedInterfaces.indexOf('playlists') >= 0) {
    this._addPlaylistsInterface(this._bus);
  }
};

Player.prototype._addRootInterface = function(bus, opts) {
  this.interfaces.root = new RootInterface(this, opts);
  this._addEventedPropertiesList(this.interfaces.root,
    ['Identity', 'Fullscreen', 'SupportedUriSchemes', 'SupportedMimeTypes',
    'CanQuit', 'CanRaise', 'CanSetFullscreen', 'HasTrackList',
    'DesktopEntry']);
  bus.export(this.serviceName, MPRIS_PATH, this.interfaces.root);
};

Player.prototype._addPlayerInterface = function(bus) {
  this.interfaces.player = new PlayerInterface(this);
  let eventedProps = ['PlaybackStatus', 'LoopStatus', 'Rate', 'Shuffle',
    'Metadata', 'Volume', 'CanControl', 'CanPause', 'CanPlay', 'CanSeek',
    'CanGoNext', 'CanGoPrevious', 'MinimumRate', 'MaximumRate', 'Rate'];
  this._addEventedPropertiesList(this.interfaces.player, eventedProps);
  bus.export(this.serviceName, MPRIS_PATH, this.interfaces.player);
};

Player.prototype._addTracklistInterface = function(bus) {
  this.interfaces.tracklist = new TracklistInterface(this);
  this._addEventedPropertiesList(this.interfaces.tracklist, ['CanEditTracks']);

  Object.defineProperty(this, 'tracks', {
    get: function() {
      return this._tracks;
    },
    set: function(value) {
      this._tracks = value;
      this.interfaces.tracklist.TrackListReplaced(value);
    },
    enumerable: true,
    configurable: true
  });

  bus.export(this.serviceName, MPRIS_PATH, this.interfaces.tracklist);
};

Player.prototype._addPlaylistsInterface = function(bus) {
  this.interfaces.playlists = new PlaylistsInterface(this);
  this._addEventedPropertiesList(this.interfaces.playlists,
    ['PlaylistCount', 'ActivePlaylist']);
  bus.export(this.serviceName, MPRIS_PATH, this.interfaces.playlists);
}

Player.prototype.objectPath = function(subpath) {
  let path = `/org/node/mediaplayer/${this.name}`;
  if (subpath) {
    path += `/${subpath}`;
  }
  return path;
};

Player.prototype._addEventedProperty = function(iface, name) {
  let that = this;

  let localName = lcfirst(name);

  Object.defineProperty(this, localName, {
    get: function() {
      let value = iface[name];
      if (name === 'ActivePlaylist') {
        return types.playlistToPlain(value);
      } else if (name === 'Metadata') {
        return types.metadataToPlain(value);
      }
      return value;
    },
    set: function(value) {
      iface.setProperty(name, value);
    },
    enumerable: true,
    configurable: true
  });
};

Player.prototype._addEventedPropertiesList = function(iface, props) {
  for (let i = 0; i < props.length; i++) {
    this._addEventedProperty(iface, props[i]);
  }
};

Player.prototype.seeked = function(delta) {
  this.position += delta || 0;
  this.interfaces.player.Seeked(this.position);
};

Player.prototype.getTrackIndex = function(trackId) {
  for (let i = 0; i < this.tracks.length; i++) {
    let track = this.tracks[i];

    if (track['mpris:trackid'] == trackId) {
      return i;
    }
  }

  return -1;
};

Player.prototype.getTrack = function(trackId) {
  return this.tracks[this.getTrackIndex(trackId)];
};

Player.prototype.addTrack = function(track) {
  this.tracks.push(track);
  this.interfaces.tracklist.setTracks(this.tracks);

  let afterTrack = '/org/mpris/MediaPlayer2/TrackList/NoTrack';
  if (this.tracks.length > 2) {
    afterTrack = this.tracks[this.tracks.length - 2]['mpris:trackid'];
  }
  that.interfaces.tracklist.TrackAdded(afterTrack);
};

Player.prototype.removeTrack = function(trackId) {
  let i = this.getTrackIndex(trackId);
  this.tracks.splice(i, 1);
  this.interfaces.tracklist.setTracks(this.tracks);

  that.interfaces.tracklist.TrackRemoved(trackId);
};

Player.prototype.getPlaylistIndex = function(playlistId) {
  for (let i = 0; i < this.playlists.length; i++) {
    let playlist = this.playlists[i];

    if (playlist.Id === playlistId) {
      return i;
    }
  }

  return -1;
};

Player.prototype.setPlaylists = function(playlists) {
  this.playlists = playlists;
  this.playlistCount = playlists.length;

  let that = this;
  this.playlists.forEach(function(playlist) {
    that.interfaces.playlists.PlaylistChanged(playlist);
  });
};

Player.prototype.setActivePlaylist = function(playlistId) {
  this.interfaces.playlists.setActivePlaylistId(playlistId);
};

module.exports = Player;
