const express = require('express');
const router = express.Router();
const config = require('../../../config/config');

const userData = [
  {
    uid: '74e520c5-6fd7-417a-8472-7e3e46da76b8',
    username: 'aylingw',
    name: 'Warren Ayling',
    establishmentUid: '3f4b2ac9-4a90-4b84-827c-0c70c765a5ce',
  },
  {
    uid: 'c638a92f-829d-48d2-ac2e-eb3a6bfe959a',
    username: 'greenj',
    name: 'Jackie Green',
    establishmentUid: '4f5cae59-dac8-4c0a-aace-9eee9f5f0833',
  }
];

const establishmentData = [
  {
    uid: '3f4b2ac9-4a90-4b84-827c-0c70c765a5ce',
    nmdsid: 'A7838489',
    establishmentName: 'establishment 1',
    postcode: 'SE19 3NS'
  },
  {
    uid: '8b391f4c-4f36-4917-85bf-679ba35f3227',
    nmdsid: 'W7837478',
    establishmentName: 'establishment 100',
    postcode: 'SE19 3SS'
  },
  {
    uid: '4f5cae59-dac8-4c0a-aace-9eee9f5f0833',
    nmdsid: 'D204989',
    establishmentName: 'The only Establishment',
    postcode: 'LS1 1AA'
  }
];

router.route('/').post((req, res) => {
  // TODO - verifying 
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

  const ALLOWED_SEARCH_KEYS = ['postcode', 'nmds', 'name', 'username'];

  if (!searchKey || !ALLOWED_SEARCH_KEYS.includes(searchKey)) {
    return res.status(200).json({
      text: `${command} - unexpected search key ('postcode', 'nmds', 'name', 'username') - received ${tokens[0]}`,
      username: 'markdownbot',
      markdwn: true,
    });
  }

  if (!searchValues) {
    return res.status(200).json({
      text: `${command} - misisng search value`,
      username: 'markdownbot',
      markdwn: true,
    });
  }

  let results = [];
  const regex = new RegExp(searchValues, 'i');
  switch (searchKey) {
    case 'postcode':
      results = establishmentData.filter(val => {
        return regex.test(val.postcode);
      });
      break;
    case 'nmds':
      results = establishmentData.filter(val => {
        return regex.test(val.nmdsid);
      });
      break;
    case 'name':
      results = userData
                  .filter(val => {
                    return regex.test(val.name);
                  })
                  .map(val => {
                    const matchingEstablishment = establishmentData.find(estVal => estVal.uid === val.establishmentUid);
                    return {
                      ...val,
                      ...matchingEstablishment,
                    }
                  });
      break;
    case 'username':
      results = userData
        .filter(val => {
          return regex.test(val.username);
        })
        .map(val => {
          const matchingEstablishment = establishmentData.find(estVal => estVal.uid === val.establishmentUid);
          return {
            ...val,
            ...matchingEstablishment,
          }
        });
      break;
  }

  return res.status(200).json({
    text: `${command} - ${searchKey} on ${searchValues} - Results (#${results.length})`,
    username: 'markdownbot',
    markdwn: true,
    pretext: 'is this a match',
    attachments: results.map(thisResult => {
      return {
        //color: 'good',
        title: `${thisResult.name? thisResult.name + ' - ' + thisResult.username + ' -' : ''}${thisResult.establishmentName}: ${thisResult.nmdsid} - ${thisResult.postcode}`,
        text: `${config.get('app.url')}/workspace/${thisResult.uid}`,
      }
    }),
  });
});

module.exports = router;
