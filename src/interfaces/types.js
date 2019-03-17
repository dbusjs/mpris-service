let Variant = require('dbus-next').Variant;
let logging = require('../logging');

function guessMetadataSignature(key, value) {
  if (key === 'mpris:trackid') {
    return 'o';
  } else if (key === 'mpris:length') {
    return 'x';
  } else if (typeof value === 'string') {
    return 's';
  } else if (typeof value === 'boolean') {
    return 'b';
  } else if (typeof value === 'number') {
    return 'd';
  } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return 'as';
  } else {
    // type not supported yet
    logging.warn(`could not determine metadata type for ${key}: ${value}`);
    return null;
  }
}

function metadataToPlain(metadataVariant) {
  let metadataPlain = {};
  for (let k of Object.keys(metadataVariant)) {
    let value = metadataVariant[k];
    if (value === undefined || value === null) {
      logging.warn(`ignoring a null metadata value for key ${k}`);
      continue;
    }
    if (value.constructor === Variant) {
      metadataPlain[k] = value.value;
    } else {
      metadataPlain[k] = value;
    }
  }
  return metadataPlain;
}

function metadataToDbus(metadataPlain) {
  let metadataVariant = {};
  for (let k of Object.keys(metadataPlain)) {
    let value = metadataPlain[k];
    let signature = guessMetadataSignature(k, value);
    if (signature) {
      metadataVariant[k] = new Variant(signature, value);
    }
  }
  return metadataVariant;
}

let emptyPlaylist = ['/', '', ''];

function playlistToDbus(playlist) {
  if (!playlist) {
    return emptyPlaylist;
  }

  let { Id, Name, Icon } = playlist;
  return [ Id, Name, Icon ];
}

function playlistToPlain(wire) {
  let [ Id, Name, Icon ] = wire;
  return { Id, Name, Icon };
}

module.exports = {
  metadataToPlain,
  metadataToDbus,
  playlistToPlain,
  playlistToDbus,
  emptyPlaylist
};
