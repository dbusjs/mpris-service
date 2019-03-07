const constants = {
  PLAYBACK_STATUS_PLAYING: 'Playing',
  PLAYBACK_STATUS_PAUSED: 'Paused',
  PLAYBACK_STATUS_STOPPED: 'Stopped',

  LOOP_STATUS_NONE: 'None',
  LOOP_STATUS_TRACK: 'Track',
  LOOP_STATUS_PLAYLIST: 'Playlist'
};

const playbackStatuses = [
  constants.PLAYBACK_STATUS_PLAYING,
  constants.PLAYBACK_STATUS_PAUSED,
  constants.PLAYBACK_STATUS_STOPPED
];

const loopStatuses = [
  constants.LOOP_STATUS_NONE,
  constants.LOOP_STATUS_PLAYLIST,
  constants.LOOP_STATUS_TRACK
];

constants.isLoopStatusValid = function(value) {
  return loopStatuses.includes(value);
};

constants.isPlaybackStatusValid = function(value) {
  return playbackStatuses.includes(value);
};

module.exports = constants;
