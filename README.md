mpris-service
=============

Node.js implementation for the MPRIS D-Bus Interface Specification to create a mediaplayer service.

Docs: http://specifications.freedesktop.org/mpris-spec/latest/

```js
var Player = require(`mpris-service`);

var player = Player({
	name: 'nodejs',
	identity: 'Node.js media player',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg']
});
```

* Implemented interfaces: [`org.mpris.MediaPlayer2`](http://specifications.freedesktop.org/mpris-spec/latest/Media_Player.html), [`org.mpris.MediaPlayer2.Player`](http://specifications.freedesktop.org/mpris-spec/latest/Player_Interface.html).
* Events: `raise`, `quit`, `next`, `previous`, `pause`, `playpause`, `stop`, `play`, `seek`, `position`, `open`, `volume`.
* Properties: `identity`, `supportedUriSchemes`, `supportedMimeTypes`, `playbackStatus`, `loopStatus`, `rate`, `shuffle`, `volume`, `metadata`, `minimumRate`, `maximumRate`, `canGoNext`, `canGoPrevious`, `canPlay`, `canPause`, `canSeek`, `canControl`.
* Methods: `seeked`.

Examples are available in [`examples/`](https://github.com/emersion/mpris-service/tree/master/examples).
