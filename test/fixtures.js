module.exports.ping = async function(bus) {
  let busObj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  return busObj.getInterface('org.freedesktop.DBus').ListNames();
}
