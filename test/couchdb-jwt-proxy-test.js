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
    url: 'http://127.0.0.1:5051',
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
  let server, couchdbMockServer;

  before(() => {
    const proxy = ProxyServer.createProxy(proxyOptions);

    server = http.createServer(function (req, res) {
      proxy.proxify(req, res);
    });

    server.listen(5050);
    console.log("proxy server listening on port 5050")

    /** Mock couchdb server */
    couchdbMockServer = http.createServer(function (req, res) {
      const username = req.headers['x-auth-couchdb-username'];
      const token = req.headers['x-auth-couchdb-token'];
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify({
        username,
        token
      }));
      res.end();
    })

    couchdbMockServer.listen(5051);
    console.log("couchdb mock server listening on port 5051")
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
      .should.eventually.equal('{"username":"john.doe","token":"9672635bac89e25197ebbee63d84237914c54f88"}');
  })


  //couchdb behaviour, _session endpoint will always answer as 'authenticated', even if the user is unknown, but no access is granted to the dbs
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
      .should.eventually.equal('{"username":"unknown user","token":"73832a51f7da8e23a217e7d992be734c85d71802"}');
  })

  after(() => {
    server.close();
    couchdbMockServer.close();
  })
})