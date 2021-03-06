const config = require('../config/config');

const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');

const isVerified = (req) => { 
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const hmac = crypto.createHmac('sha256', config.get('slack.secret'));
  const [version, hash] = signature.split('=');

  // Check if the timestamp is too old
  const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) return false;

  hmac.update(`${version}:${timestamp}:${req.rawBody}`);

  // check that the request signature matches expected value
  const hashCheck = timingSafeCompare(hmac.digest('hex'), hash);
  return hashCheck;
}; 

// slack verification middleware
const slackAuthorised = (req, res, next) => {
  if(config.get('app.search.verifySignature')) {
    if (!isVerified(req)) {
      return res.status(401).send();
    } else {
      next();
    }
  } else {
    console.log("WARNING - search - VerifySignature disabled");
    next();
  }
};
  
module.exports = { isVerified, slackAuthorised };
