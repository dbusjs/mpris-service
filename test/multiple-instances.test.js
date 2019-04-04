jest.setTimeout(1e4);
const dbus = require('dbus-next');
const Player = require('../dist');

let initErrors = [];
let playerName = 'multiple_instances';

function errorHandler(err) {
  console.log(err.stack);
  initErrors.push(err);
}

let player1 = Player({
  name: playerName,
  identity: 'Node.js media player',
  supportedUriSchemes: ['file'],
  supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
  supportedInterfaces: ['player']
});

player1.on('error', errorHandler);

let player2 = Player({
  name: playerName,
  identity: 'Node.js media player',
  supportedUriSchemes: ['file'],
  supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
  supportedInterfaces: ['player']
});

player2.on('error', errorHandler);

let bus = dbus.sessionBus();

afterAll(() => {
  player1._bus.disconnect();
  player2._bus.disconnect();
  bus.disconnect();
});

test('creating two players with the same name on the same bus should create the second one as an instance', async () => {
  let dbusObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  let dbusIface = dbusObj.getInterface('org.freedesktop.DBus');
  let names = await dbusIface.ListNames();

  expect(initErrors).toHaveLength(0);

  let expectedIfaces = [
    `org.mpris.MediaPlayer2.${playerName}`,
    `org.mpris.MediaPlayer2.${playerName}.instance${process.pid}`,
  ];
  expect(names).toEqual(expect.arrayContaining(expectedIfaces));
});
