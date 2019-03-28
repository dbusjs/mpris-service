jest.setTimeout(1e4);
let dbus = require('dbus-next');
let Variant = dbus.Variant;
let Player = require('../dist');
let JSBI = require('jsbi');

const ROOT_IFACE = 'org.mpris.MediaPlayer2';
const PLAYER_IFACE = 'org.mpris.MediaPlayer2.Player';
const PLAYLISTS_IFACE = 'org.mpris.MediaPlayer2.Playlists';

let lcFirst = (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

var player = Player({
  name: 'playliststest',
  identity: 'Node.js media player',
  supportedUriSchemes: ['file'],
  supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
  supportedInterfaces: ['player', 'playlists']
});

player.on('error', (err) => {
  console.log(`got unexpected error:\n${err.stack}`);
});

let bus = dbus.sessionBus();

afterAll(() => {
  player._bus.connection.stream.end();
  bus.connection.stream.end();
});

test('creating a player exports the playlists interfaces on the bus', async () => {
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  let dbusIface = dbusObj.getInterface('org.freedesktop.DBus');
  let names = await dbusIface.ListNames();
  expect(names).toEqual(expect.arrayContaining(['org.mpris.MediaPlayer2.playliststest']));

  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playliststest', '/org/mpris/MediaPlayer2');
  let expectedInterfaces = [
    'org.freedesktop.DBus.Introspectable',
    'org.freedesktop.DBus.Properties',
    ROOT_IFACE,
    PLAYLISTS_IFACE,
    PLAYER_IFACE
  ];
  for (let expected of expectedInterfaces) {
    expect(obj.getInterface(expected)).toBeDefined();
  }
});

test('default state of the playlists interface', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playliststest', '/org/mpris/MediaPlayer2');
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  let playlistsIface = obj.getInterface(PLAYLISTS_IFACE);
  let props = obj.getInterface('org.freedesktop.DBus.Properties');

  let playlistCount = await props.Get(PLAYLISTS_IFACE, 'PlaylistCount');
  expect(playlistCount).toEqual(new Variant('u', 0));

  let orderings = await props.Get(PLAYLISTS_IFACE, 'Orderings');
  expect(orderings).toEqual(new Variant('as', ['Alphabetical', 'UserDefined']));

  let activePlaylist = await props.Get(PLAYLISTS_IFACE, 'ActivePlaylist');
  expect(activePlaylist).toEqual(new Variant('(b(oss))', [ false, [ '/', '', '' ] ]));

  let playlists = await playlistsIface.GetPlaylists(0, 1, 'Alphabetical', false);
  expect(playlists).toEqual([]);
});

test('setting a playlist on the player works', async () => {
  let obj = await bus.getProxyObject('org.mpris.MediaPlayer2.playliststest', '/org/mpris/MediaPlayer2');
  let playlistsIface = obj.getInterface(PLAYLISTS_IFACE);
  let props = obj.getInterface('org.freedesktop.DBus.Properties');
  let peer = obj.getInterface('org.freedesktop.DBus.Peer');

  let propsCb = jest.fn();
  props.on('PropertiesChanged', propsCb);

  let playlistChangedCb = jest.fn();
  playlistsIface.on('PlaylistChanged', playlistChangedCb);

  player.setPlaylists([
    {
      Id: player.objectPath('playlist/0'),
      Name: 'The best playlist',
      Icon: ''
    },
    {
      Id: player.objectPath('playlist/1'),
      Name: 'The wonderful playlist',
      Icon: ''
    },
    {
      Id: player.objectPath('playlist/2'),
      Name: 'The sexyiest playlist',
      Icon: ''
    },
    {
      Id: player.objectPath('playlist/3'),
      Name: 'The coolest playlist',
      Icon: ''
    }
  ]);

  await peer.Ping();

  expect(propsCb).toHaveBeenCalledWith(PLAYLISTS_IFACE, {
    PlaylistCount: new Variant('u', 4)
  }, []);

  for (playlist of player.playlists) {
    expect(playlistChangedCb).toHaveBeenCalledWith([
      playlist.Id,
      playlist.Name,
      playlist.Icon
    ]);
  }

  player.setActivePlaylist(player.playlists[1].Id);

  await peer.Ping();

  let expectedActivePlaylist = new Variant('(b(oss))',
    [
      true,
      [
        player.playlists[1].Id,
        player.playlists[1].Name,
        player.playlists[1].Icon
      ]
    ]
  );

  expect(propsCb).toHaveBeenLastCalledWith(PLAYLISTS_IFACE, {
    ActivePlaylist: expectedActivePlaylist
  }, []);

  let activePlaylist = await props.Get(PLAYLISTS_IFACE, 'ActivePlaylist');
  expect(activePlaylist).toEqual(expectedActivePlaylist);

  function playlistToDbus(p) {
    return [ p.Id, p.Name, p.Icon ];
  }
  // all userdefined
  let dbusPlaylists = await playlistsIface.GetPlaylists(0, 99, 'UserDefined', false);
  expect(player.playlists.map(playlistToDbus)).toEqual(dbusPlaylists);

  // all userdefined reverse
  dbusPlaylists = await playlistsIface.GetPlaylists(0, 99, 'UserDefined', true);
  dbusPlaylists.reverse();
  expect(player.playlists.map(playlistToDbus)).toEqual(dbusPlaylists);

  // userdefined slice and max
  dbusPlaylists = await playlistsIface.GetPlaylists(1, 2, 'UserDefined', false);
  expect(player.playlists.slice(1, 3).map(playlistToDbus)).toEqual(dbusPlaylists);

  // userdefined slice and max reverse
  dbusPlaylists = await playlistsIface.GetPlaylists(1, 2, 'UserDefined', true);
  dbusPlaylists.reverse();
  expect(player.playlists.slice(1, 3).map(playlistToDbus)).toEqual(dbusPlaylists);

  // all alphabetical
  dbusPlaylists = await playlistsIface.GetPlaylists(0, 99, 'Alphabetical', false);
  let expected = player.playlists.sort((a, b) => a < b).map(playlistToDbus);
  expect(expected).toEqual(dbusPlaylists);

  // all alphabetical reverse
  dbusPlaylists = await playlistsIface.GetPlaylists(0, 99, 'Alphabetical', true);
  dbusPlaylists.reverse();
  expected = player.playlists.sort((a, b) => a < b).map(playlistToDbus);
  expect(expected).toEqual(dbusPlaylists);

  // alphabetical slice and max
  dbusPlaylists = await playlistsIface.GetPlaylists(1, 2, 'Alphabetical', false);
  expected = player.playlists.sort((a, b) => a < b).slice(1, 3).map(playlistToDbus);
  expect(expected).toEqual(dbusPlaylists);

  // alphabetical slice and max reverse
  dbusPlaylists = await playlistsIface.GetPlaylists(1, 2, 'Alphabetical', true);
  dbusPlaylists.reverse();
  expected = player.playlists.sort((a, b) => a < b).slice(1, 3).map(playlistToDbus);
  expect(expected).toEqual(dbusPlaylists);
});
