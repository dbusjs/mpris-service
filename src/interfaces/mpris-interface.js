const dbus = require('dbus-next');
const Variant = dbus.Variant;
const types = require('./types');
const deepEqual = require('deep-equal');
const constants = require('../constants');
const logging = require('../logging');

let {
  Interface, property, method, signal, DBusError,
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

      if (property == 'LoopStatus' && !constants.isLoopStatusValid(valuePlain)) {
        logging.warn(`setting player loop status to an invalid value: ${valuePlain}`);
      } else if (property == 'PlaybackStatus' && !constants.isPlaybackStatusValid(valuePlain)) {
        logging.warn(`setting player playback status to an invalid value: ${valuePlain}`);
      } else {
        let changedProperties = {};
        changedProperties[property] = valueDbus;
        Interface.emitPropertiesChanged(this, changedProperties);
      }
    }
  }
}

module.exports = MprisInterface;
