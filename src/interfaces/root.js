let MprisInterface = require('./mpris-interface');
let dbus = require('dbus-next');
let Variant = dbus.Variant;

let {
  property, method, signal, DBusError,
  ACCESS_READ, ACCESS_WRITE, ACCESS_READWRITE
} = dbus.interface;

class RootInterface extends MprisInterface {
  constructor(player, opts={}) {
    super('org.mpris.MediaPlayer2', player);

    if (opts.hasOwnProperty('identity')) {
      this._Identity = opts.identity;
    }
    if (opts.hasOwnProperty('supportedUriSchemes')) {
      this._SupportedUriSchemes = opts.supportedUriSchemes;
    }
    if (opts.hasOwnProperty('supportedMimeTypes')) {
      this._SupportedMimeTypes = opts.supportedMimeTypes;
    }
    if (opts.hasOwnProperty('desktopEntry')) {
      this._DesktopEntry = opts.desktopEntry;
    }
  }

  _CanQuit = true;
  _Fullscreen = false;
  _CanSetFullscreen = false;
  _CanRaise = true;
  _HasTrackList = false;
  _Identity = '';
  // TODO optional properties
  _DesktopEntry = '';
  _SupportedUriSchemes = [];
  _SupportedMimeTypes = [];

  @property({signature: 'b', access: ACCESS_READ})
  get CanQuit() {
    return this._CanQuit;
  }

  @property({signature: 'b'})
  get Fullscreen() {
    return this._Fullscreen;
  }
  set Fullscreen(value) {
    this._setPropertyInternal('Fullscreen', value);
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanSetFullscreen() {
    return this._CanSetFullscreen;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanRaise() {
    return this._CanRaise;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get HasTrackList() {
    return this._HasTrackList;
  }

  @property({signature: 's', access: ACCESS_READ})
  get Identity() {
    return this._Identity;
  }

  @property({signature: 's', access: ACCESS_READ})
  get DesktopEntry() {
    return this._DesktopEntry;
  }

  @property({signature: 'as', access: ACCESS_READ})
  get SupportedUriSchemes() {
    return this._SupportedUriSchemes;
  }

  @property({signature: 'as', access: ACCESS_READ})
  get SupportedMimeTypes() {
    return this._SupportedMimeTypes;
  }

  @method({})
  Raise() {
    this.player.emit('raise');
  }

  @method({})
  Quit() {
    this.player.emit('quit');
  }
}

module.exports = RootInterface;
