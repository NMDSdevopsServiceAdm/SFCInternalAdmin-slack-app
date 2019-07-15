const express = require('express');
const router = express.Router();
const config = require('../../../config/config');
const isVerified = require('../../../utils/verifySignature').isVerified;
const SearchUtil = require('../../../utils/search');


router.route('/').post((req, res) => {
  //console.log("[POST] actions/search - body: ", req.body);

  const VALID_COMMAND = '/asc-search';

  // extract input
  const command = req.body.command;
  const text = req.body.text;
    
  if (!command || VALID_COMMAND !== command) return res.status(400).send('Invalid command');
  if (!text) return res.status(400).send('Invalid search parameters');

  const tokens = text.split(' ');
 
  const searchKey = tokens && Array.isArray(tokens) && tokens.length > 0 ? tokens[0].toLowerCase() : null;
  tokens && Array.isArray(tokens) && tokens.length > 0 ? tokens.shift() : true;
  const searchValues = tokens && Array.isArray(tokens) && tokens.length > 0 ? tokens.join(' ') : null;

  if(!searchKey || SearchUtil.isDispatcher(searchKey)) {
    return res.status(200).json({
      text: `${command} - unexpected search key - received ${tokens[0]}`,
      username: 'markdownbot',
      markdwn: true,
    });
  }

  if (!searchValues) {
    return res.status(200).json({
      text: `${command} - missing search value`,
      username: 'markdownbot',
      markdwn: true,
    });
  }

  return SearchUtil.singleSearch(command, searchKey, searchValues, res);
});

/*
router.route('/combined').post((req, res) => {

  if(config.get('app.search.verifyJWT')) {
    if (!isVerified(req)) return res.status(401).send();
  } else {
    console.log("WARNING - search/combined - VerifyJWT disabled");
  }

  //console.log("POST search/combined " + req.body);

  var promises=[];

  addSearchPromise(promises,"postcode", req.body.postcode, res);
  addSearchPromise(promises,"locationid", req.body.locationid, res);
  addSearchPromise(promises,"name", req.body.name, res);

  Promise.all(promises)
    .then((resultArrys) => {
      results=[].concat.apply([],resultArrys);

      console.log("All Promises done");
      res.status(200).json(results);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: `search/combined ${err}`});
  });
});

function addSearchPromise(promises, fieldName, fieldValue, res) {

  if(fieldValue!=undefined && fieldValue!=null) {
    promises.push(new Promise((resolve, reject) => {

      var msgBuilder={fn: responseResolver, async: false, resolve: resolve};

      console.log("Fire "+fieldName+" Promise");
      return dispatchers[fieldName](fieldName, fieldName, fieldValue, res, msgBuilder);
    }));
  }
}
*/

module.exports = router;
