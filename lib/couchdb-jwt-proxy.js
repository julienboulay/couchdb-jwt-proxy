const ProxyServer = require('./couchdb-jwt-proxy/index.js').Server;

function createProxy(options) {
  return new ProxyServer(options);
}

ProxyServer.createProxy = createProxy;

module.exports = ProxyServer;