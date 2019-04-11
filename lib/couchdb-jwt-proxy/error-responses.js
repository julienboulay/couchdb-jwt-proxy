const unauthorized = {
  "status": 401,
  "error": "Unauthorized",
  "message": "Not Authenticated"
};

function notAuthorized(res) {
  res.writeHead(401, {
    'Content-Type': 'application/json'
  });
  res.write(JSON.stringify(unauthorized, true, 2));
  res.end();
}

module.exports.notAuthorized = notAuthorized;