const express = require('express');
const router = express.Router();
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

module.exports = router;
