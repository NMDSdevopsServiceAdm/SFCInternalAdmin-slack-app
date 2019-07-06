const config = require('../config/config');

const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');

const isVerified = (req) => { 
console.log("WA DEBUG - slack secret: ", config.get('slack.secret'))

  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const hmac = crypto.createHmac('sha256', config.get('slack.secret'));
  const [version, hash] = signature.split('=');

  // Check if the timestamp is too old
  const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) return false;

  console.log("WA DEBUG - got this far")

  hmac.update(`${version}:${timestamp}:${req.rawBody}`);

  // check that the request signature matches expected value
  const hashCheck = timingSafeCompare(hmac.digest('hex'), hash);
  console.log("WA DEBUG - hash check: ", hashCheck)
  return hashCheck;
}; 
  
module.exports = { isVerified };