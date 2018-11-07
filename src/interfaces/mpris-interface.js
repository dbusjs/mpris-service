let dbus = require('dbus-next');
let Variant = dbus.Variant;
let types = require('./types');

let {
  Interface, property, method, signal, MethodError,
  ACCESS_READ, ACCESS_WRITE, ACCESS_READWRITE
} = dbus.interface;

class MprisInterface extends Interface {
  constructor(name, player) {
    super(name);
    this.player = player;
  }

  _setPropertyInternal(property, valueDbus) {
    this[`_${property}`] = valueDbus;
    let changedProperties = {};
    changedProperties[property] = valueDbus;
    this.PropertiesChanged(changedProperties);
    // nothing is currently settable internally that needs conversion to plain
    this.player.emit(property[0].toLowerCase() + property.substr(1), valueDbus);
  }

  setProperty(property, valuePlain) {
    let valueDbus = valuePlain;

    if (property === 'Metadata') {
      valueDbus = types.metadataToDbus(valuePlain);
    } else if (property === 'ActivePlaylist') {
      if (valuePlain) {
        valueDbus = [ true, types.playlistToDbus(valuePlain) ];
      } else {
        valueDbus = [ false, types.emptyPlaylist ];
      }
    } else if (property === 'Tracks') {
      valueDbus =
        valuePlain.filter((t) => t['mpris:trackid']).map((t) => t['mpris:trackid']);
    }

    this[`_${property}`] = valueDbus;
    let changedProperties = {};
    changedProperties[property] = valueDbus;
    this.PropertiesChanged(changedProperties);
  }
}

module.exports = MprisInterface;
