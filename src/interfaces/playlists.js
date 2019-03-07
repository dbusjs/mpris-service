// TODO proper import
let MprisInterface = require('./mpris-interface');
let dbus = require('dbus-next');
let Variant = dbus.Variant;
let types = require('./types');

let {
  property, method, signal, DBusError,
  ACCESS_READ, ACCESS_WRITE, ACCESS_READWRITE
} = dbus.interface;

class PlaylistsInterface extends MprisInterface {
  constructor(player) {
    super('org.mpris.MediaPlayer2.Playlists', player);
  }

  _ActivePlaylist = [ false, types.emptyPlaylist ];
  _PlaylistCount = 0;

  @property({signature: 'u', access: ACCESS_READ})
  get PlaylistCount() {
    return this._PlaylistCount;
  }

  @property({signature: 'as', access: ACCESS_READ})
  get Orderings() {
    return ['Alphabetical', 'UserDefined'];
  }

  @property({signature: '(b(oss))', access: ACCESS_READ})
  get ActivePlaylist() {
    return this._ActivePlaylist;
  }

  setActivePlaylistId(playlistId) {
    let i = this.player.getPlaylistIndex(playlistId);

    this.setProperty('ActivePlaylist', this.player.playlists[i] || null);
  }

  @method({inSignature: 'o'})
  ActivatePlaylist(playlistId) {
    this.player.emit('activatePlaylist', playlistId);
  }

  @method({inSignature: 'uusb', outSignature: 'a(oss)'})
  GetPlaylists(index, maxCount, order, reverseOrder) {
    if (!this.player.playlists) {
      return [];
    }

    let result = this.player.playlists.sort(function(a, b) {
        let ret = 1;
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
        return ret;
      })
      .slice(index, maxCount + index)
      .map(types.playlistToDbus);

    if (reverseOrder) {
      result.reverse();
    }

    return result;
  }

  @signal({signature: '(oss)'})
  PlaylistChanged(playlist) {
    return types.playlistToDbus(playlist);
  }
}

module.exports = PlaylistsInterface;
