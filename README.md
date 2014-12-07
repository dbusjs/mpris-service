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

Interfaces: `org.mpris.MediaPlayer2`, `org.mpris.MediaPlayer2.Player`.

Events: `raise`, `quit`, `next`, `previous`, `pause`, `playpause`, `stop`, `play`, `seek`, `position`, `open`.

Properties: `identity`, `supportedUriSchemes`, `supportedMimeTypes`, `playbackStatus`, `loopStatus`, `volume`, `metadata`.

Methods: `seeked`.

Examples are available in `examples/`.