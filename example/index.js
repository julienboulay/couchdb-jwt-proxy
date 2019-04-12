const http = require('http');
const ProxyServer = require('../lib/couchdb-jwt-proxy');

const proxyOptions = {
  jwt: {
    secret: '01ec08b5-c86c-417a-a493-394a45cc1f15',
  },
  couchdb: {
    url: 'http://127.0.0.1:5984',
    secret: 'couchdbSecret'
  }
}

const proxy = ProxyServer.createProxy(proxyOptions);

server = http.createServer(function (req, res) {
  proxy.proxify(req, res);
});

server.listen(5050);
console.log("proxy listening on port 5050")