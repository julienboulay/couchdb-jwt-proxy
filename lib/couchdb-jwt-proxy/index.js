const httpProxy = require('http-proxy');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const couchdbAuth = require('./couchdb-auth');
const errors = require('./error-responses');

const couchJwtProxy = module.exports
couchJwtProxy.Server = ProxyServer

function ProxyServer(options) {

  const self = this;
  this.options = verify(options);

  this.proxy = httpProxy.createProxyServer({});

  this.proxy.on('proxyReq', function jwtToCouchDBMiddleware(proxyReq, req, res) {

    //Pass through for CORS preflight requests
    if (req.method !== 'OPTIONS') {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        errors.notAuthorized(res);
      } else {
        const bearer = authHeader.substring('Bearer '.length)
  
        try {
          const decoded = jwt.verify(bearer, self.options.jwt.secret);
          const username = decoded[self.options.jwt.username_claim];
  
          const token = couchdbAuth.createToken(username, self.options.couchdb.secret);
          couchdbAuth.setHeaders(proxyReq, username, token);
  
        } catch (err) {
          console.error(err);
          errors.notAuthorized(res);
        }
      }
    }
  });

}

function verify(opts) {

  const options = _.cloneDeep(opts);

  if (!options.jwt)
  {
    throw new Error('Must provide options for jwt verification (secret, username_claim)')
  }

  if (!options.jwt.secret) {
    throw new Error('Must provide a proper jwt secret (jwt.secret option)')
  }

  options.jwt.username_claim = options.jwt.username_claim || 'sub';

  if (!options.couchdb) {
    throw new Error('Must provide proper options for couchDB authentication (url, secret)');
  }
  
  if (!options.couchdb.url) {
    throw new Error('Must provide a proper couchDB URL (couchDB.url option)')
  }

  if (!options.couchdb.secret) {
    throw new Error('Must provide a proper couchDB secret (couchDB.secret option)')
  }
  return options;
}

ProxyServer.prototype.proxify = function (req, res) {
  this.proxy.web(req, res, {
    target: this.options.couchdb.url
  });
}
