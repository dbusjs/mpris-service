var DBus = require('dbus');
var events = require('events');
var util = require('util');

var dbus = new DBus();

function Type(signature, name) {
	return { type: signature, name: name };
}
function lcfirst(str) {
	return str[0].toLowerCase()+str.substr(1);
}

function Player(opts) {
	if (!(this instanceof Player)) return new Player(opts);
	events.EventEmitter.call(this);

	var that = this;

	this.name = opts.name;
	this.identity = opts.identity;
	this.supportedUriSchemes = opts.supportedUriSchemes;
	this.supportedMimeTypes = opts.supportedMimeTypes;

	this._properties = {};

	this.init();
}
util.inherits(Player, events.EventEmitter);

Player.prototype.init = function () {
	// Create a new service, object and interface
	this.serviceName = 'org.mpris.MediaPlayer2.'+this.name;
	this.service = dbus.registerService('session', this.serviceName);
	this.obj = this.service.createObject('/org/mpris/MediaPlayer2');

	// TODO: must be defined in dbus module (pull request pending)
	this.obj.propertyInterface.addSignal('PropertiesChanged', {
		types: [Type('s', 'interface_name'), Type('a{sv}', 'changed_properties'), Type('as', 'invalidated_properties')]
	});
	this.obj.propertyInterface.update();

	this.interfaces = {};
	this._createRootInterface();
	this._createPlayerInterface();
};

Player.prototype._addEventedProperty = function (iface, name) {
	var that = this;

	var localName = lcfirst(name);
	var currentValue = this[localName];

	Object.defineProperty(this, localName, {
		get: function () {
			return that._properties[name];
		},
		set: function (newValue) {
			that._properties[name] = newValue;

			var changed = {};
			changed[name] = newValue;
			that.obj.propertyInterface.emitSignal('PropertiesChanged', iface, changed, []);
		},
		enumerable: true,
		configurable: true
	});

	if (currentValue) {
		this[localName] = currentValue;
	}
};

Player.prototype._addEventedPropertiesList = function (iface, props) {
	for (var i = 0; i < props.length; i++) {
		this._addEventedProperty(iface, props[i]);
	}
};

/**
 * @see http://specifications.freedesktop.org/mpris-spec/latest/Media_Player.html
 */
Player.prototype._createRootInterface = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2',
		iface = this.obj.createInterface(ifaceName);
	
	// Methods
	iface.addMethod('Raise', {}, function () {
		that.emit('raise');
	});
	iface.addMethod('Quit', {}, function () {
		that.emit('quit');
	});

	// Properties
	this._addEventedPropertiesList(ifaceName, ['Identity', 'SupportedUriSchemes', 'SupportedMimeTypes']);

	iface.addProperty('CanQuit', {
		type: Type('b'),
		getter: function(callback) {
			callback(true);
		}
	});
	iface.addProperty('CanRaise', {
		type: Type('b'),
		getter: function(callback) {
			callback(true);
		}
	});
	iface.addProperty('HasTrackList', {
		type: Type('b'),
		getter: function(callback) {
			callback(false);
		}
	});
	iface.addProperty('Identity', {
		type: Type('s'),
		getter: function(callback) {
			callback(that.identity || '');
		}
	});
	/*iface.addProperty('DesktopEntry', {
		type: Type('s'),
		getter: function(callback) {
			callback('lol');
		}
	});*/
	iface.addProperty('SupportedUriSchemes', {
		type: Type('as'),
		getter: function(callback) {
			callback(that.supportedUriSchemes || []);
		}
	});
	iface.addProperty('SupportedMimeTypes', {
		type: Type('as'),
		getter: function(callback) {
			callback(that.supportedMimeTypes || []);
		}
	});

	iface.update();
	this.interfaces.root = iface;
};

/**
 * @see http://specifications.freedesktop.org/mpris-spec/latest/Player_Interface.html
 */
Player.prototype._createPlayerInterface = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2.Player',
		iface = this.obj.createInterface(ifaceName);

	// Methods
	var eventMethods = ['Next', 'Previous', 'Pause', 'PlayPause', 'Stop', 'Play'];
	var addEventMethod = function (method) {
		iface.addMethod(method, {}, function () {
			that.emit(lcfirst(method));
		});
	};
	for (var i = 0; i < eventMethods.length; i++) {
		addEventMethod(eventMethods[i]);
	}

	iface.addMethod('Seek', { in: [ Type('x') ] }, function (delta) {
		console.log('Seek', delta);
		that.emit('seek', { delta: delta, position: that.position + delta });
	});
	iface.addMethod('SetPosition', { in: [ Type('o'), Type('x') ] }, function (trackId, pos) {
		console.log('SetPosition', trackId, pos);
		that.emit('position', { trackId: trackId, position: pos });
	});
	iface.addMethod('OpenUri', { in: [ Type('s') ] }, function (uri) {
		console.log('OpenUri', uri);
		that.emit('open', { uri: uri });
	});

	// Properties
	this.position = 0;

	var propertiesList = ['PlaybackStatus', 'LoopStatus', 'Volume', 'Metadata'];
	this._addEventedPropertiesList(ifaceName, propertiesList);

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
		}
	});
	iface.addProperty('Position', {
		type: Type('x'),
		getter: function(callback) {
			callback(that.position || 0);
		}
	});

	iface.addProperty('CanPlay', {
		type: DBus.Define(Boolean),
		getter: function(callback) {
			callback(true);
		}
	});
	iface.addProperty('CanPause', {
		type: DBus.Define(Boolean),
		getter: function(callback) {
			callback(true);
		}
	});
	iface.addProperty('CanSeek', {
		type: DBus.Define(Boolean),
		getter: function(callback) {
			callback(true);
		}
	});
	iface.addProperty('CanControl', {
		type: DBus.Define(Boolean),
		getter: function(callback) {
			callback(true);
		}
	});

	// Signals
	iface.addSignal('Seeked', {
		types: [Type('x')]
	});

	iface.update();
	this.interfaces.player = iface;
};

Player.prototype.seeked = function (delta) {
	this.position += delta || 0;
	this.interfaces.player.emitSignal('Seeked', this.position);
};

module.exports = Player;