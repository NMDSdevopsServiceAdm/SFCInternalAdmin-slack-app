const config = require('../../config/config');
const jwt = require('jsonwebtoken');
const Token_Secret = process.env.Token_Secret;

const THIS_ISS = config.get('jwt.iss');

// this generates the JWT that can be presented to the the ASC WDS Backend
exports.ASCWDS_JWT = (ttlSeconds, username) => {
  var claims = {
    sub: username,
    aud: config.get('jwt.aud.internalAdminApp'),
    iss: THIS_ISS
  };

  return jwt.sign(JSON.parse(JSON.stringify(claims)), Token_Secret, {expiresIn: `${ttlSeconds}s`});
};

// middleware for confirming ASC Internal Admin JWT 
exports.isAuthenticated = (req, res , next) => {
  const token = getToken(req.headers[AUTH_HEADER]);

  if (token) {
    jwt.verify(token, Token_Secret, function (err, claim) {
      if (err || claim.aud !== config.get('jwt.aud.internalAdminApp') || claim.iss !== THIS_ISS) {
        return res.status(403).send('Invalid Token');
      } else {
        if (claim.role !== 'Admin') {
          return res.status(403).send('You\'re not known to Internal Admin');
        } else {
          next();
        }
      }
    });
  } else {
    // not authenticated
    res.status(401).send('Requires authorisation');
  }
};