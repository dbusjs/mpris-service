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

  waitForEvent: (player, event) => {
    return new Promise((resolve) => {
      player.once(event, resolve);
    });
  }
};
