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

/**
 * Construct a new Player and export it on the DBus session bus.
 *
 * For more information about the properties of this class, see [the MPRIS DBus Interface Specification](https://specifications.freedesktop.org/mpris-spec/latest/).
 *
 * Method Call Events
 * ------------------
 *
 * The Player is an `EventEmitter` that emits events when the corresponding
 * methods are called on the DBus interface over the wire.
 *
 * The Player emits events whenever the corresponding methods on the DBus
 * interface are called.
 *
 * * `raise` - Brings the media player's user interface to the front using any appropriate mechanism available.
 * * `quit` - Causes the media player to stop running.
 * * `next` - Skips to the next track in the tracklist.
 * * `previous` - Skips to the previous track in the tracklist.
 * * `pause` - Pauses playback.
 * * `playPause` - Pauses playback.  If playback is already paused, resumes playback. If playback is stopped, starts playback.
 * * `stop` - Stops playback.
 * * `play` - Starts or resumes playback.
 * * `seek` - Seeks forward in the current track by the specified number of microseconds. With event data `{ delta, position }`.
 * * `position` - Sets the current track position in microseconds. With event data `{ trackId, position }`.
 * * `open` - Opens the Uri given as an argument. With event data `{ uri }`.
 * * `activatePlaylist` -  Starts playing the given playlist. With event data `playlistId`.
 *
 *
 * @class Player
 * @param {Object} options - Options for the player
 * @param {String} options.name - Name on the bus to export to as `org.mpris.MediaPlayer2.{name}`.
 * @param {String} options.identity - Identity for the player to display on the root media player interface.
 * @param {Array} options.supportedMimeTypes - Mime types this player can open with the `org.mpris.MediaPlayer2.Open` method.
 * @param {Array} options.supportedInterfaces - The interfaces this player supports. Can include `'player'`, `'playlists'`, and `'trackList'`.
 * @property {String} identity - A friendly name to identify the media player to users.
 * @property {Boolean} fullscreen - Whether the media player is occupying the fullscreen.
 * @property {Array} supportedUriSchemes - The URI schemes supported by the media player.
 * @property {Array} supportedMimeTypes - The mime-types supported by the media player.
 * @property {Boolean} canQuit - Whether the player can quit.
 * @property {Boolean} canRaise - Whether the player can raise.
 * @property {Boolean} canSetFullscreen - Whether the player can be set to fullscreen.
 * @property {Boolean} hasTrackList - Indicates whether the /org/mpris/MediaPlayer2 object implements the org.mpris.MediaPlayer2.TrackList interface.
 * @property {String} desktopEntry - The basename of an installed .desktop file which complies with the Desktop entry specification, with the ".desktop" extension stripped.
 * @property {String} playbackStatus - The current playback status. May be "Playing", "Paused" or "Stopped".
 * @property {String} loopStatus - The current loop/repeat status. May be "None", "Track", or "Playlist".
 * @property {Boolean} shuffle - Whether the player is shuffling.
 * @property {Object} metadata - The metadata of the current element. If there is a current track, this must have a "mpris:trackid" entry (of D-Bus type "o") at the very least, which contains a D-Bus path that uniquely identifies this track.
 * @property {Double} volume - The volume level.
 * @property {Boolean} canControl - Whether the media player may be controlled over this interface.
 * @property {Boolean} canPause - Whether playback can be paused using Pause or PlayPause.
 * @property {Boolean} canPlay - Whether playback can be started using Play or PlayPause.
 * @property {Boolean} canSeek - Whether the client can control the playback position using Seek and SetPosition.
 * @property {Boolean} canGoNext - Whether the client can call the Next method on this interface and expect the current track to change.
 * @property {Boolean} canGoPrevious - Whether the client can call the Previous method on this interface and expect the current track to change.
 * @property {Double} rate - The current playback rate.
 * @property {Double} minimumRate - The minimum value which the Rate property can take.
 * @property {Double} maximumRate - The maximum value which the Rate property can take.
 * @property {Array} playlists - The current playlists set by Player#setPlaylists. (Not a DBus property).
 * @property {Integer} activePlaylist - The currently-active playlist.
 */
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
  dbus.validators.assertInterfaceNameValid(this.serviceName);

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
    'CanGoNext', 'CanGoPrevious', 'MinimumRate', 'MaximumRate'];
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

/**
 * Get a valid object path with the `subpath` as the basename which is suitable
 * for use as an id.
 *
 * @name Player#objectPath
 * @function
 * @param {String} subpath - The basename of this path
 * @returns {String} - A valid object path that can be used as an id.
 */
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

/**
 * Sets the position of the player to `position + delta` and emits the `Seeked`
 * DBus signal to listening clients.
 *
 * @name Player#seeked
 * @function
 * @param {Integer} delta - The change in position in microseconds.
 */
Player.prototype.seeked = function(delta) {
  this.position += delta || 0;
  this.interfaces.player.Seeked(this.position);
};

Player.prototype.getTrackIndex = function(trackId) {
  for (let i = 0; i < this.tracks.length; i++) {
    let track = this.tracks[i];

    if (track['mpris:trackid'] === trackId) {
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

/**
 * Get the index of a playlist entry in the list of Player#playlists from the
 * given id.
 *
 * @name Player#getPlaylistIndex
 * @function
 * @param {String} playlistId - The id for the playlist entry.
 */
Player.prototype.getPlaylistIndex = function(playlistId) {
  for (let i = 0; i < this.playlists.length; i++) {
    let playlist = this.playlists[i];

    if (playlist.Id === playlistId) {
      return i;
    }
  }

  return -1;
};

/**
 * Set the list of playlists advertised to listeners on the bus. Each playlist
 * must have string members `Id`, `Name`, and `Icon`.
 *
 * @name Player#setPlaylists
 * @function
 * @param {Array} playlists - A list of playlists.
 */
Player.prototype.setPlaylists = function(playlists) {
  this.playlists = playlists;
  this.playlistCount = playlists.length;

  let that = this;
  this.playlists.forEach(function(playlist) {
    that.interfaces.playlists.PlaylistChanged(playlist);
  });
};

/**
 * Set the playlist identified by `playlistId` to be the currently active
 * playlist.
 *
 * @name Player#setActivePlaylist
 * @function
 * @param {String} playlistId - The id of the playlist to activate.
 */
Player.prototype.setActivePlaylist = function(playlistId) {
  this.interfaces.playlists.setActivePlaylistId(playlistId);
};

module.exports = Player;
