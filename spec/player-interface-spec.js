'use strict';

const dbus = require('dbus-native');

const Player = require('../index');

const helpers = require('./helpers/helpers');

const objectpath = '/org/mpris/MediaPlayer2/one';
const namespace = 'org.mpris.MediaPlayer2.Player';

const events = {
  next: {
    method: 'Next',
    args: []
  },
  previous: {
    method: 'Previous',
    args: []
  },
  play: {
    method: 'Play',
    args: []
  },
  pause: {
    method: 'Pause',
    args: []
  },
  playpause: {
    method: 'PlayPause',
    args: []
  },
  stop: {
    method: 'Stop',
    agrs: []
  },
  open: {
    method: 'OpenUri',
    args: ['/home/foo']
  },
  seek: {
    method: 'Seek',
    args: [3.14 * 10e6]
  },
  // TODO: figure out how to pass first arg
  // position: {
  //   method: 'SetPosition',
  //   args: ['playlist/0', 3.14 * 10e6]
  // }
};

describe('player interface', () => {
  let bus, name, player, service, object, servicename;

  beforeAll((done) => {
    bus = dbus.sessionBus();
    name = helpers.playername();
    player = new Player({ name });
    servicename = helpers.servicename(name);
    service = bus.getService(servicename);

    service.getInterface(objectpath, namespace, (err, obj) => {
      if (err) {
        fail(err);
      }

      object = obj;
      done();
    });
  });

  afterAll(() => {
    bus.connection.end();
  });

  it('should emit events that correspond to method calls', (done) => {
    let promise = Promise.resolve();

    Object.keys(events).forEach((name) => {
      const call = events[name];

      promise = promise.then(() => {
        const wait = helpers.waitForEvent(player, name);

        object[call.method].apply(object, call.args);

        return wait;
      });
    });

    promise.then(done, fail);
  });
});
