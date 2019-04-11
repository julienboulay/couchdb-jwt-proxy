const crypto = require('crypto');

function createToken(username, secret) {
  const token = crypto.createHmac('sha1', secret).update(username).digest('hex');
  return token;
}

function setHeaders(proxyReq, username, token) {
  proxyReq.setHeader('X-Auth-Couchdb-Username', username);
  proxyReq.setHeader('X-Auth-Couchdb-Token', token);
}

module.exports = {
  createToken: createToken,
  setHeaders: setHeaders
}