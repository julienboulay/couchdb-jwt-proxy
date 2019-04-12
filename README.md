# couchdb-jwt-proxy [![Build Status](https://travis-ci.org/julienboulay/couchdb-jwt-proxy.svg?branch=master)](https://travis-ci.org/julienboulay/couchdb-jwt-proxy) [![codecov](https://codecov.io/gh/julienboulay/couchdb-jwt-proxy/branch/master/graph/badge.svg)](https://codecov.io/gh/julienboulay/couchdb-jwt-proxy)

`couchdb-jwt-proxy` is a JWT authentication proxy for Couchdb.    
It uses [CouchDB proxy authentication](http://docs.couchdb.org/en/latest/api/server/authn.html#proxy-authentication), extracting couchdb username from the JWT payload, and adding `x-auth-couchdb-username` and `x-auth-couchdb-token` headers before forwarding the request to upstream CouchDB server.

For security reasons, it should be installed locally, close to couchDB server/cluster.

### Installation

`npm install couchdb-jwt-proxy --save`

### Usage

```javascript
  const http = require('http');
  const ProxyServer = require('couchdb-jwt-proxy');

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

  const proxy = ProxyServer.createProxy(proxyOptions);

  server = http.createServer(function (req, res) {
    proxy.proxify(req, res);
  });

  server.listen(5050);
  console.log("proxy listening on port 5050")
```
### Options

`ProxyServer.createProxy` supports the following options:

*  **jwt.secret**: shared secret (HS256 Authentication)
*  **jwt.username_claim**: identify which claim provides CouchDB username (Default: `sub`) setting the header `x-auth-couchdb-username`
*  **couchdb.url**: url of the upstream CouchDB server
*  **couchdb.secret**: CouchDB secret to encrypt the token setting the header `x-auth-couchdb-token`

### Test

```
$ npm test
```

### Contributing and Issues

* Search on Google/Github
* If you can't find anything, open an issue
* If you feel comfortable about fixing the issue, fork the repo
* Commit to your local branch (which must be different from `master`)
* Submit your Pull Request (be sure to include tests and update documentation)

### License

>The MIT License (MIT)
>
>Copyright (c) 2010 - 2016 Charlie Robbins, Jarrett Cruger & the Contributors.
>
>Permission is hereby granted, free of charge, to any person obtaining a copy
>of this software and associated documentation files (the "Software"), to deal
>in the Software without restriction, including without limitation the rights
>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
>copies of the Software, and to permit persons to whom the Software is
>furnished to do so, subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in
>all copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
>THE SOFTWARE.