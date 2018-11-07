const dbus = require('dbus-next');
const MprisInterface = require('./mpris-interface');
const Variant = dbus.Variant;
const Long = require('long');

let {
  property, method, signal, MethodError,
  ACCESS_READ, ACCESS_WRITE, ACCESS_READWRITE
} = dbus.interface;

class PlayerInterface extends MprisInterface {
  constructor(player) {
    super('org.mpris.MediaPlayer2.Player', player);
  }

  _CanControl = true;
  _CanPause = true;
  _CanPlay = true;
  _CanSeek = true;
  _CanGoNext = true;
  _CanGoPrevious = true;
  _Metadata = {};
  _MaximumRate = 1;
  _MinimumRate = 1;
  _Rate = 1;
  _Shuffle = false;
  _Volume = 0;
  _Position = 0;
  _LoopStatus = 'None';
  _PlaybackStatus = 'Stopped';

  @property({signature: 'b', access: ACCESS_READ})
  get CanControl() {
    return this._CanControl;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanPause() {
    return this._CanPause;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanPlay() {
    return this._CanPlay;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanSeek() {
    return this._CanSeek;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanGoNext() {
    return this._CanGoNext;
  }

  @property({signature: 'b', access: ACCESS_READ})
  get CanGoPrevious() {
    return this._CanGoPrevious;
  }

  @property({signature: 'a{sv}', access: ACCESS_READ})
  get Metadata() {
    return this._Metadata;
  }

  @property({signature: 'd'})
  get MaximumRate() {
    return this._MaximumRate;
  }
  set MaximumRate(value) {
    this._setPropertyInternal('MaximumRate', value);
  }

  @property({signature: 'd'})
  get MinimumRate() {
    return this._MinimumRate;
  }
  set MinimumRate(value) {
    this._setPropertyInternal('MinimumRate', value);
  }

  @property({signature: 'd'})
  get Rate() {
    return this._Rate;
  }
  set Rate(value) {
    this._setPropertyInternal('Rate', value);
  }

  @property({signature: 'b'})
  get Shuffle() {
    return this._Shuffle;
  }
  set Shuffle(value) {
    this._setPropertyInternal('Shuffle', value);
  }

  @property({signature: 'd'})
  get Volume() {
    return this._Volume;
  }
  set Volume(value) {
    this._setPropertyInternal('Volume', value);
  }

  @property({signature: 'x', access: ACCESS_READ})
  get Position() {
    return this._Position;
  }

  @property({signature: 's'})
  get LoopStatus() {
    return this._LoopStatus;
  }
  set LoopStatus(value) {
    this._setPropertyInternal('LoopStatus', value);
  }

  @property({signature: 's', access: ACCESS_READ})
  get PlaybackStatus() {
    return this._PlaybackStatus;
  }

  @method({})
  Next() {
    this.player.emit('next');
  }

  @method({})
  Previous() {
    this.player.emit('previous');
  }

  @method({})
  Pause() {
    this.player.emit('pause');
  }

  @method({})
  PlayPause() {
    this.player.emit('playpause');
  }

  @method({})
  Stop() {
    this.player.emit('stop');
  }

  @method({})
  Play() {
    this.player.emit('play');
  }

  @method({inSignature: 'x'})
  Seek(offset) {
    console.log(offset);
    let e = {
      delta: offset,
      position: (this.player.position || 0) + offset
    };
    this.player.emit('seek', e);
  }

  @method({inSignature: 'ox'})
  SetPosition(trackId, position) {
    let e = {
      trackId: trackId,
      position: position
    };
    this.player.emit('position', e);
  }

  @method({inSignature: 's'})
  OpenUri(uri) {
    let e = { uri };
    this.player.emit('open', e);
  }

  @signal({signature: 'x'})
  Seeked(position) {
    return Long.fromInt(position);
  }
}

module.exports = PlayerInterface;
