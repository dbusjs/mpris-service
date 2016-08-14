'use strict';

module.exports = {
  playername: () => {
    return 'test' + (Math.random() * 1000 | 0).toString();
  },
  servicename: (player) => {
    return 'org.mpris.MediaPlayer2.' + player;
  },
  waitForEvent: (player, event) => {
    return new Promise((resolve) => {
      player.on(event, resolve);
    });
  }
};
