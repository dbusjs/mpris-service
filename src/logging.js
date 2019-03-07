let loggingEnabled = (process.env.MPRIS_SERVICE_DEBUG !== undefined && process.env.MPRIS_SERVICE_DEBUG !== '0');

module.exports.debug = function(message) {
  if (loggingEnabled) {
    console.log(message);
  }
};

module.exports.warn = function(message) {
  if (loggingEnabled) {
    console.warn(message);
  }
};
