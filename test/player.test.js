let dbus = require('dbus-next');
let Variant = dbus.Variant;
let Player = require('../dist');
let JSBI = require('jsbi');

const ROOT_IFACE = 'org.mpris.MediaPlayer2';
const PLAYER_IFACE = 'org.mpris.MediaPlayer2.Player';

let lcFirst = (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

var player = Player({
  name: 'playertest',
  identity: 'Node.js media player',
  supportedUriSchemes: ['file'],
  supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
  supportedInterfaces: ['player']
});

let bus = dbus.sessionBus();

afterAll(() => {
  player._bus.connection.stream.end();
  bus.connection.stream.end();
});

test('creating a player exports the root and player interfaces on the bus', async () => {
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  let dbusIface = dbusObj.getInterface('org.freedesktop.DBus');
  let names = await dbusIface.ListNames();
  expect(names).toEqual(expect.arrayContaining(['org.mpris.MediaPlayer2.playertest']));

  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playertest', '/org/mpris/MediaPlayer2');
  let expectedInterfaces = [
    'org.freedesktop.DBus.Introspectable',
    'org.freedesktop.DBus.Properties',
    ROOT_IFACE,
    PLAYER_IFACE
  ];
  for (let expected of expectedInterfaces) {
    expect(obj.getInterface(expected)).toBeDefined();
  }
});

test('calling the player methods on the bus emits the signals on the object', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playertest', '/org/mpris/MediaPlayer2');
  let playerIface = obj.getInterface(PLAYER_IFACE);

  // simple commands called with no event
  let commands = [ 'Play', 'Pause', 'PlayPause', 'Stop', 'Next', 'Previous' ];
  for (let cmd of commands) {
    let cb = jest.fn();
    player.once(cmd.toLowerCase(), cb);
    await playerIface[cmd]();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith();
  }

  // OpenUri
  let cb = jest.fn();
  player.once('open', cb);
  await playerIface.OpenUri('file://somefile');
  expect(cb).toHaveBeenCalledTimes(1);
  expect(cb).toHaveBeenCalledWith({ uri: 'file://somefile' });
});

test('getting and setting properties on the player and on the interface should work', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playertest', '/org/mpris/MediaPlayer2');
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');

  let ping = async () => {
    let peer = dbusObj.getInterface('org.freedesktop.DBus.Peer');
    return peer.Ping();
  };

  let playerIface = obj.getInterface(PLAYER_IFACE);
  let props = obj.getInterface('org.freedesktop.DBus.Properties');

  let cb = jest.fn();
  props.on('PropertiesChanged', cb);

  // Metadata
  player.metadata = {
    'xesam:artist': ['Katy Perry'],
    'xesam:title': 'Rise'
  };
  await ping();
  let changed = {
    Metadata: new Variant('a{sv}', {
      'xesam:artist': new Variant('as', ['Katy Perry']),
      'xesam:title': new Variant('s', 'Rise')
    })
  }
  expect(cb).toHaveBeenCalledTimes(1);
  expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
  let gotten = await props.Get(PLAYER_IFACE, 'Metadata');
  expect(gotten).toEqual(changed.Metadata);

  // setting the metadata again to the same thing should only emit
  // PropertiesChanged once
  player.metadata = JSON.parse(JSON.stringify(player.metadata));
  await ping();
  expect(cb).toHaveBeenCalledTimes(1);

  // PlaybackStatus
  player.playbackStatus = 'Paused';
  await ping();
  changed = {
    PlaybackStatus: new Variant('s', 'Paused')
  };
  expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
  gotten = await props.Get(PLAYER_IFACE, 'PlaybackStatus');
  expect(gotten).toEqual(new Variant('s', 'Paused'));

  // LoopStatus
  player.loopStatus = 'Track';
  await ping();
  changed = {
    LoopStatus: new Variant('s', 'Track')
  };
  expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
  gotten = await props.Get(PLAYER_IFACE, 'LoopStatus');
  expect(gotten).toEqual(new Variant('s', 'Track'));
  let playerCb = jest.fn(val => {
    player.loopStatus = val;
  });
  player.once('loopStatus', playerCb);
  await props.Set(PLAYER_IFACE, 'LoopStatus', new Variant('s', 'Playlist'));
  expect(playerCb).toHaveBeenCalledWith('Playlist');
  changed = {
    LoopStatus: new Variant('s', 'Playlist')
  };
  expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
  expect(player.loopStatus).toEqual('Playlist');

  // The Double Properties
  let doubleProps = ['Rate', 'Volume', 'MinimumRate', 'MaximumRate'];
  for (let name of doubleProps) {
    let playerName = lcFirst(name);
    player[playerName] = 0.05;
    await ping();
    changed = {};
    changed[name] = new Variant('d', 0.05);
    expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
    gotten = await props.Get(PLAYER_IFACE, name);
    expect(gotten).toEqual(new Variant('d', player[playerName]));

    if (name in ['Rate', 'Volume']) {
      // these are settable by the client
      let playerCb = jest.fn(val => {
        player[playerName] = val;
      });
      player.once(playerName, playerCb);
      await props.Set(PLAYER_IFACE, name, new Variant('d', 0.15));
      expect(playerCb).toHaveBeenCalledWith(0.15);
      expect(player[playerName]).toEqual(0.15);
      changed[name] = new Variant('d', 0.15);
      expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
    }
  }

  // The Boolean properties
  let boolProps = ['CanControl', 'CanPause', 'CanPlay', 'CanSeek', 'CanGoNext',
    'CanGoPrevious', 'Shuffle'];
  for (let name of boolProps) {
    let playerName = lcFirst(name);
    let newValue = !player[playerName];
    player[playerName] = newValue;
    await ping();
    changed = {};
    changed[name] = new Variant('b', newValue);
    expect(cb).toHaveBeenLastCalledWith(PLAYER_IFACE, changed, []);
    gotten = await props.Get(PLAYER_IFACE, name);
    expect(gotten).toEqual(new Variant('b', player[playerName]));
    if (name === 'Shuffle') {
      let nextNewValue = !newValue;
      // only this property is writable
      let playerCb = jest.fn(val => {
        player.shuffle = val;
      });
      player.once('shuffle', playerCb);
      await props.Set(PLAYER_IFACE, name, new Variant('b', nextNewValue));
      expect(playerCb).toHaveBeenCalledWith(nextNewValue);
      expect(player[playerName]).toEqual(nextNewValue);
    }
  }
});

test('position specific properties, methods, and signals should work', async () => {
  // note: they are responsible for setting the position, not the methods directly
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playertest', '/org/mpris/MediaPlayer2');
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  let playerIface = obj.getInterface(PLAYER_IFACE);
  let props = obj.getInterface('org.freedesktop.DBus.Properties');

  let ping = async () => {
    let peer = dbusObj.getInterface('org.freedesktop.DBus.Peer');
    return peer.Ping();
  };

  // position defaults to always being 0
  let position = await props.Get(PLAYER_IFACE, 'Position');
  expect(position).toEqual(new Variant('x', JSBI.BigInt(0)));

  // when the getter is set, it should return what the getter returns
  player.getPosition = function() {
    return 99;
  }

  position = await props.Get(PLAYER_IFACE, 'Position');
  expect(position).toEqual(new Variant('x', JSBI.BigInt(99)));

  // Seek
  let cb = jest.fn();
  player.once('seek', cb);
  await playerIface.Seek(99);
  expect(cb).toHaveBeenCalledWith(99);

  // SetPosition
  cb = jest.fn();
  player.once('position', cb);
  await playerIface.SetPosition('/some/track', 100);
  expect(cb).toHaveBeenCalledWith({ trackId: '/some/track', position: 100 });

  cb = jest.fn();
  playerIface.once('Seeked', cb);
  player.seeked(200);
  await ping();
  expect(cb).toHaveBeenCalledWith(JSBI.BigInt(200));
});
