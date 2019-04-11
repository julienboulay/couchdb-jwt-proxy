const chai = require('chai').use(require('chai-as-promised'));
const should = chai.should();
const expect = chai.expect;
const _ = require('lodash');

const request = require('request-promise-native');

const http = require('http');
const ProxyServer = require('../lib/couchdb-jwt-proxy');

const proxyOptions = {
  jwt: {
    secret: 'jwtSecret',
    username_claim: 'username'
  },
  couchdb: {
    url: 'http://127.0.0.1:5984',
    secret: 'couchdbSecret'
  }
}

describe('Creating couchdb-jwt-proxy', () => {
  it('should fail without jwt options', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.jwt;
    expect(() => {
      ProxyServer.createProxy(opts);
    }).to.throw('Must provide options for jwt verification (secret, username_claim)')
  });

  it('should fail without jwt.secret option', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.jwt.secret;
    expect(() => {
      ProxyServer.createProxy(opts);
    }).to.throw('Must provide a proper jwt secret (jwt.secret option)')
  });

  it('should fail without couchdb options', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.couchdb;
    expect(() => {
      ProxyServer.createProxy(opts);
    }).to.throw('Must provide proper options for couchDB authentication (url, secret)')
  });

  it('should fail without couchdb.url option', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.couchdb.url;
    expect(() => {
      ProxyServer.createProxy(opts);
    }).to.throw('Must provide a proper couchDB URL (couchDB.url option)')
  });

  it('should fail without couchdb.secret option', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.couchdb.secret;
    expect(() => {
      ProxyServer.createProxy(opts);
    }).to.throw('Must provide a proper couchDB secret (couchDB.secret option)')
  });

  it('should set \'sub\' as default username_claim', () => {
    const opts = _.cloneDeep(proxyOptions);
    delete opts.jwt.username_claim;
    const proxy = ProxyServer.createProxy(opts);
    expect(proxy.options.jwt.username_claim).to.equal('sub');
  });
});

describe('Running couchdb-jwt-proxy', () => {
  let server;

  before(() => {
    const proxy = ProxyServer.createProxy(proxyOptions);

    server = http.createServer(function (req, res) {
      proxy.proxify(req, res);
    });

    server.listen(5050);
    console.log("proxy listening on port 5050")

  })

  it('should fail to authenticate without authorization', async () => {

    await request('http://localhost:5050/_session')
      .should.be.rejectedWith(Error, '401 - "{\\n  \\"status\\": 401,\\n  \\"error\\": \\"Unauthorized\\",\\n  \\"message\\": \\"Not Authenticated\\"\\n}"');
  })

  it('should fail to authenticate with wrong jwt', async () => {

    await request('http://localhost:5050/_session', {
        headers: {
          Authorization: 'Bearer invalidToken'
        }
      })
      .should.be.rejectedWith(Error, '401 - "{\\n  \\"status\\": 401,\\n  \\"error\\": \\"Unauthorized\\",\\n  \\"message\\": \\"Not Authenticated\\"\\n}"');
  })

  it('should pass proxy and provide X-Auth headers', async () => {

    // JWT payload
    // {
    //    "sub": "12345",
    //    "username": "john.doe",
    //    "iat": 1516239022
    // }
    await request('http://localhost:5050/_session', {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsInVzZXJuYW1lIjoiam9obi5kb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.ZLvZclMIA8uoyFJXQ9y0gWBTwPOUzYqDM8sU44HfZhQ'
        }
      })
      .should.eventually.equal('{"ok":true,"userCtx":{"name":"john.doe","roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["cookie","proxy","default"],"authenticated":"proxy"}}\n');
  })


  //Strange couchdb behaviour, but _session endpoint will always answer as 'authenticated', even if the user is unknown, but no access is granted to the dbs
  it('should fail to authenticate with the wrong username', async () => {

    // JWT payload
    // {
    //    "sub": "12345",
    //    "username": "John Doe",
    //    "iat": 1516239022
    // }
    await request('http://localhost:5050/_session', {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsInVzZXJuYW1lIjoidW5rbm93biB1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.VuSfFkzzci6FehPevd0IhtsbvmvZxjePt5M0m6CkyvM'
        }
      })
      .should.eventually.equal('{"ok":true,"userCtx":{"name":"unknown user","roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["cookie","proxy","default"],"authenticated":"proxy"}}\n');
  })

  after(() => {
    server.close();
  })
})