let dbus = require('dbus-next');
let Variant = dbus.Variant;
let types = require('./types');
let deepEqual = require('deep-equal');

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
    // nothing is currently settable internally that needs conversion to plain
    this.player.emit(property[0].toLowerCase() + property.substr(1), valueDbus);
  }

  setProperty(property, valuePlain) {
    // convert the plain value to a dbus value (default to the plain value)
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

    if (!deepEqual(this[`_${property}`], valueDbus)) {
      this[`_${property}`] = valueDbus;
      let changedProperties = {};
      changedProperties[property] = valueDbus;
      Interface.emitPropertiesChanged(this, changedProperties);
    }
  }
}

module.exports = MprisInterface;
