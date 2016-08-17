'use strict';

const Player = require('../../index');

let player;

module.exports = {
  getPlayer: (name) => {
    const supportedInterfaces = ['player', 'trackList', 'playlists'];
    player = player || new Player({ name, supportedInterfaces });
    return player;
  },

  playername: () => {
    return 'test' + (Math.random() * 1000 | 0).toString();
  },

  servicename: (player) => {
    return 'org.mpris.MediaPlayer2.' + player;
  },

  waitForEvent: (emitter, event) => {
    return new Promise((resolve) => {
      if (emitter.once) {
        emitter.once(event, resolve);
      } else {
        emitter.on(event, resolve);
      }
    });
  },

  getInterfaceAsync: (service, objectpath, interfaceString) => {
    return new Promise((resolve, reject) => {
      service.getInterface(objectpath, interfaceString, (err, obj) => {
        if (err) {
          return reject(err);
        }
        resolve(obj);
      });
    });
  }
};
