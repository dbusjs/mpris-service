var Type = require('./type');

module.exports = function () {
	var that = this;
	var ifaceName = 'org.mpris.MediaPlayer2',
		      iface = this.obj.createInterface(ifaceName);

	// Methods

	iface.addMethod('Raise', {}, function (callback) {
		that.emit('raise');
		callback();
	});
	iface.addMethod('Quit', {}, function (callback) {
		that.emit('quit');
		callback();
	});

	// Properties

	var eventedProps = ['Identity', 'Fullscreen', 'SupportedUriSchemes', 'SupportedMimeTypes'];
	this._addEventedPropertiesList(ifaceName, eventedProps);

	iface.addProperty('CanQuit', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canQuit != 'undefined') ? that.canQuit : true);
		}
	});
	iface.addProperty('Fullscreen', {
		type: Type('b'),
		getter: function(callback) {
			callback(that.fulscreen || false);
		},
		setter: function (value, next) {
			if (!that.canSetFullscreen) return next();

			that.fullscreen = value;
			that.emit('fullscreen', value);
			next();
		}
	});
	iface.addProperty('CanRaise', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canRaise != 'undefined') ? that.canRaise : true);
		}
	});
	iface.addProperty('CanSetFullscreen', {
		type: Type('b'),
		getter: function(callback) {
			callback((typeof that.canSetFullscreen != 'undefined') ? that.canSetFullscreen : false);
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
	if (this.desktopEntry) {
		// This property is optional
		iface.addProperty('DesktopEntry', {
			type: Type('s'),
			getter: function(callback) {
				callback(that.desktopEntry || '');
			}
		});
	}
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
