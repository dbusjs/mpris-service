var Type = require('./type');

module.exports = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2.Player',
		      iface = this.obj.createInterface(ifaceName);

	// Methods
	var eventMethods = ['Next', 'Previous', 'Pause', 'PlayPause', 'Stop', 'Play'];
	var addEventMethod = function (method) {
		iface.addMethod(method, {}, function (callback) {
			that.emit(method.toLowerCase());
			callback();
		});
	};
	for (var i = 0; i < eventMethods.length; i++) {
		addEventMethod(eventMethods[i]);
	}

	iface.addMethod('Seek', { in: [ Type('x', 'Offset') ] }, function (delta, callback) {
		that.emit('seek', { delta: delta, position: that.position + delta });
		callback();
	});
	iface.addMethod('SetPosition', { in: [ Type('o', 'TrackId'), Type('x', 'Position') ] }, function (trackId, pos, callback) {
		that.emit('position', { trackId: trackId, position: pos });
		callback();
	});
	iface.addMethod('OpenUri', { in: [ Type('s', 'Uri') ] }, function (uri, callback) {
		that.emit('open', { uri: uri });
		callback();
	});

	// Signals
	iface.addSignal('Seeked', {
		types: [Type('x', 'Position')]
	});

	// Properties
	this.position = 0;

	var eventedProps = ['PlaybackStatus', 'LoopStatus', 'Rate', 'Shuffle', 'Metadata', 'Volume'];
	this._addEventedPropertiesList(ifaceName, eventedProps);

	iface.addProperty('PlaybackStatus', {
		type: Type('s'),
		getter: function(callback) {
			callback(that.playbackStatus || 'Stopped');
		}
	});
	iface.addProperty('LoopStatus', {
		type: Type('s'),
		getter: function(callback) {
			callback(that.loopStatus || 'None');
		},
		setter: function (value, next) {
			that.loopStatus = value;
			that.emit('loopStatus', value);
			next();
		}
	});
	iface.addProperty('Rate', {
		type: Type('d'),
		getter: function(callback) {
			callback(that.rate || 1);
		},
		setter: function (value, next) {
			that.rate = value;
			that.emit('rate', value);
			next();
		}
	});
	iface.addProperty('Shuffle', {
		type: Type('b'),
		getter: function(callback) {
			callback(that.shuffle || false);
		},
		setter: function (value, next) {
			that.shuffle = value;
			that.emit('shuffle', value);
			next();
		}
	});
	iface.addProperty('Metadata', {
		type: Type('a{sv}'),
		getter: function(callback) {
			callback(that.metadata || {});
		}
	});
	iface.addProperty('Volume', {
		type: Type('d'),
		getter: function(callback) {
			callback(that.volume || 1);
		},
		setter: function (value, next) {
			that.volume = value;
			that.emit('volume', value);
			next();
		}
	});
	iface.addProperty('Position', {
		type: Type('x'),
		getter: function(callback) {
			callback(that.position || 0);
		}
	});
	iface.addProperty('MinimumRate', {
		type: Type('d'),
		getter: function(callback) {
			callback(that.minimumRate || 1);
		}
	});
	iface.addProperty('MaximumRate', {
		type: Type('d'),
		getter: function(callback) {
			callback(that.maximumRate || 1);
		}
	});
	iface.addProperty('CanGoNext', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canGoNext != 'undefined') ? that.canGoNext : true);
		}
	});
	iface.addProperty('CanGoPrevious', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canGoPrevious != 'undefined') ? that.canGoPrevious : true);
		}
	});
	iface.addProperty('CanPlay', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canPlay != 'undefined') ? that.canPlay : true);
		}
	});
	iface.addProperty('CanPause', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canPause != 'undefined') ? that.canPause : true);
		}
	});
	iface.addProperty('CanSeek', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canSeek != 'undefined') ? that.canSeek : true);
		}
	});
	iface.addProperty('CanControl', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canControl != 'undefined') ? that.canControl : true);
		}
	});

	iface.update();
	this.interfaces.player = iface;
};
