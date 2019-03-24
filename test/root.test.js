let dbus = require('dbus-next');
let Variant = dbus.Variant;
let Player = require('../dist');

const ROOT_IFACE = 'org.mpris.MediaPlayer2';
const PLAYER_IFACE = 'org.mpris.MediaPlayer2.Player';

let lcFirst = (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

var player = Player({
  name: 'roottest',
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

test('calling methods should raise a signal on the player', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.roottest', '/org/mpris/MediaPlayer2');
  let root = obj.getInterface(ROOT_IFACE);

  let cb = jest.fn();
  player.once('quit', cb);
  await root.Quit();
  expect(cb).toHaveBeenCalledWith();

  cb = jest.fn();
  player.once('raise', cb);
  await root.Raise();
  expect(cb).toHaveBeenCalledWith();
});

test('setting properties on the player should show up on dbus and raise a signal', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.roottest', '/org/mpris/MediaPlayer2');
  let root = obj.getInterface(ROOT_IFACE);
  let props = obj.getInterface('org.freedesktop.DBus.Properties');
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');

  let ping = async () => {
    return dbusObj.getInterface('org.freedesktop.DBus').ListNames();
  };

  let cb = jest.fn();
  props.on('PropertiesChanged', cb);

  // string array props
  let stringArrayProps = [ 'SupportedMimeTypes', 'SupportedUriSchemes' ];
  for (let name of stringArrayProps) {
    let playerName = lcFirst(name);
    let gotten = await props.Get(ROOT_IFACE, name);
    expect(gotten).toEqual(new Variant('as', player[playerName]));
    let newValue = ['foo', 'bar'];
    player[playerName] = newValue;
    await ping();
    let changed = {};
    changed[name] = new Variant('as', newValue);
    expect(cb).toHaveBeenLastCalledWith(ROOT_IFACE, changed, []);
  }

  // readonly bools
  let booleanProps = [ 'CanQuit', 'CanRaise', 'CanSetFullscreen', 'HasTrackList' ];
  for (let name of booleanProps) {
    let playerName = lcFirst(name);
    let newValue = !player[playerName];
    player[playerName] = newValue;
    await ping();
    changed = {};
    changed[name] = new Variant('b', newValue);
    expect(cb).toHaveBeenCalledWith(ROOT_IFACE, changed, []);
    let gotten = await props.Get(ROOT_IFACE, name);
    expect(gotten).toEqual(new Variant('b', newValue));
  }

  // strings
  let stringProps = [ 'Identity', 'DesktopEntry' ];
  for (let name of stringProps) {
    let playerName = lcFirst(name);
    let newValue = 'foo';
    player[playerName] = newValue;
    await ping();
    changed = {};
    changed[name] = new Variant('s', newValue);
    expect(cb).toHaveBeenCalledWith(ROOT_IFACE, changed, []);
    let gotten = await props.Get(ROOT_IFACE, name);
    expect(gotten).toEqual(new Variant('s', newValue));
  }

  // fullscreen
  let gotten = await props.Get(ROOT_IFACE, 'Fullscreen');
  expect(gotten).toEqual(new Variant('b', player.fullscreen));
  let newValue = !player.fullscreen;
  player.fullscreen = newValue;
  await ping();
  changed = {
    Fullscreen: new Variant('b', newValue)
  };
  expect(cb).toHaveBeenLastCalledWith(ROOT_IFACE, changed, []);
});
