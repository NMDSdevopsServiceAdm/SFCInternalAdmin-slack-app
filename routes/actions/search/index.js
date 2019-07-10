const express = require('express');
const router = express.Router();
const config = require('../../../config/config');
const request = require('request');

const isVerified = require('../../../utils/verifySignature').isVerified;

// Needs moving to config
const baseURL = 'http://ec2-34-255-118-188.eu-west-1.compute.amazonaws.com:1337';
const argv = {username: "brianenduser", password:"password"};

// Local constants
const loginURL = baseURL+'/auth/local';
const establishmentURL = baseURL+'/establishments';
const userURL = baseURL+'/appusers';

const requestTypes = {
  postcode: establishmentURL+'?Postcode_contains=',
  nmds: establishmentURL+'?NMDSID_eq=',
  location: establishmentURL+'?PK_eq=',
  name:establishmentURL+'?PK_eq=',
  username:establishmentURL+'?PK_eq='
}

const requestUserTypes = {
  name:userURL+'?FullNameValue_contains=',
  username:userURL+'?Username_contains='
}

const establishmentMap=function(res) {return {establishmentName: res.Name, nmdsid: res.NMDSID, postcode: res.Postcode, uid: res.UID}}
const userMap=function(res) {return {name: res.FullNameValue, username: res.Username, establishmentId: res.EstablishmentID}}

router.route('/').post((req, res) => {
  // TODO - verifying 
  // if (!isVerified(req)) return res.status(401).send();

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

  if(!searchKey || requestTypes[searchKey]==undefined) {
    return res.status(200).json({
      text: `${command} - unexpected search key ${Object.keys(requestTypes)} - received ${tokens[0]}`,
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
      // Fallthrough
    case 'nmds':
      // Fallthrough
    case 'location':
      return getEstablishmentData(command, searchKey, searchValues, res);
      break;
  case 'name':
      // Fallthrough
  case 'username':
      return getUserData(command, searchKey, searchValues, res);
      break;
  }
});

function getEstablishmentData(command, searchKey, searchValues, res) {

  getToken()
  .then((token) => {
    searchType(token,requestTypes[searchKey],searchKey,searchValues,establishmentMap)
      .then((results) => {
        return responseBuilder(res, command, searchKey, searchValues, results);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: `Strapi GetData ${err}`});
      });
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ error: `Strapi Login ${err}`});
  });
}

function getUserData(command, searchKey, searchValues, res) {

  getToken()
  .then((token) => {
    searchType(token,requestUserTypes[searchKey],searchKey,searchValues,userMap)
      .then((users) => {

        var results=[];

        if(users.length!=0) {
          var promises=[];

          for(i=0;i<users.length;i++) {
            promises.push(
              searchType(token,requestTypes[searchKey],searchKey,users[i].establishmentId,establishmentMap)
            );
          }

          Promise.all(promises)
            .then((establishmentArrys) => {
              establishments=[].concat.apply([],establishmentArrys);
              var results=[];

              for(i=0;i<users.length;i++) {
                results.push({...users[i],...establishments[i]});
              }
              return responseBuilder(res, command, searchKey, searchValues, results);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: `Strapi GetUserData - establishment ${err}`});
            });
          } else {
            return responseBuilder(res, command, searchKey, searchValues, users);
          }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: `Strapi GetUserData - user ${err}`});
      });
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ error: `Strapi GetUserData Login ${err}`});
  });
}

function responseBuilder(res, command, searchKey, searchValues, results)
{
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
}

function getToken() {
	return new Promise((resolve, reject) => {

		request.post(loginURL,
	               {json: true, body: {identifier: argv.username, password: argv.password} },
				   function(err,res, body) {

					if (err) reject(err);
    		        if (res.statusCode != 200) {
            		    reject('Invalid status code <' + res.statusCode + '>');
            		}
          resolve(body.jwt);
	  });
	});
}

function searchType(token, queryURL, searchKey, value, responseMap) {
//  console.log("searchType "+queryURL+" "+value);

  return new Promise((resolve, reject) => {
    var searchURL=queryURL+value;
    request.get(searchURL, {json: true, auth: { bearer: token } }, function(err,res, body) {
      if (err) {
          console.log('err POSTed '+searchURL);
          reject(err);
      }
    
      if (res.statusCode != 200) {
        console.log('!200 POSTed '+searchURL);
        reject('Invalid status code <' + res.statusCode + '>');
      }

      var resArry=Array.from(body);

      var resp=
        resArry.map(res => responseMap(res)
      );

      if(resp==undefined) { resp=[] };

      resolve(resp);
    });
  });
}

module.exports = router;
