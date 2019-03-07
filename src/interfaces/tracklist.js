let MprisInterface = require('./mpris-interface');
let dbus = require('dbus-next');
let Variant = dbus.Variant;
let types = require('./types');

let {
  property, method, signal, DBusError,
  ACCESS_READ, ACCESS_WRITE, ACCESS_READWRITE
} = dbus.interface;

class TracklistInterface extends MprisInterface {
  constructor(player) {
    super('org.mpris.MediaPlayer2.TrackList', player);
  }

  _Tracks = [];
  _CanEditTracks = false;

  setTracks(tracksPlain) {
    this.setProperty('Tracks', tracksPlain);
  }

  @property({signature: 'ao', access: ACCESS_READ})
  get Tracks() {
    return this._Tracks;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanEditTracks() {
    return this._CanEditTracks;
  }

  @method({inSignature: 'ao', outSignature: 'aa{sv}'})
  GetTracksMetadata(trackIds) {
    return this.player.tracks.filter((t) => {
      return trackIds.some((id) => id === t['mpris:trackid']);
    }).map(types.metadataToDbus);
  }

  @method({inSignature: 'sob'})
  AddTrack(uri, afterTrack, setAsCurrent) {
    this.player.emit('addTrack', { uri, afterTrack, setAsCurrent });
  }

  @method({inSignature: 'o'})
  RemoveTrack(trackId) {
    this.player.emit('removeTrack', trackId);
  }

  @method({inSignature: 'o'})
  GoTo(trackId) {
    this.player.emit('goTo', trackId);
  }

  @signal({signature: 'aoo'})
  TrackListReplaced(replacedPlain) {
    this.setTracks(replacedPlain);
    // TODO what's the active track?
    return [
      this._Tracks,
      '/org/mpris/MediaPlayer2/TrackList/NoTrack'
    ];
  }

  @signal({signature: 'a{sv}'})
  TrackAdded(metadata) {
    return types.metadataToDbus(metadata);
  }

  @signal({signature: 'o'})
  TrackRemoved(path) {
    return path;
  }

  @signal({signature: 'oa{sv}'})
  TrackMetadataChanged(path, metadata){ 
    return [
      path,
      types.metadataToDbus(metadata)
    ];
  }
}

module.exports = TracklistInterface;
