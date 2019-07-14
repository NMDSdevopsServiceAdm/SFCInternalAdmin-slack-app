const express = require('express');
const router = express.Router();
const config = require('../../../config/config');
const request = require('request');

const isVerified = require('../../../utils/verifySignature').isVerified;

// Local constants
const baseURL=config.get('app.search.strapiBaseURL');
const loginURL = baseURL+'/auth/local';
const establishmentURL = baseURL+'/establishments';
const userURL = baseURL+'/appusers';
const searchLimit = config.get('app.search.limit');

const dispatchers = {
  postcode: getEstablishmentData,
  nmds: getEstablishmentData,
  locationid: getEstablishmentData,
  name: getUserData,
  username: getUserData
}

const requestTypes = {
  postcode: establishmentURL+'?_limit='+searchLimit+'&Postcode_contains=',
  nmds: establishmentURL+'?NMDSID_eq=',
  locationid: establishmentURL+'?LocationID_eq=',
  name:establishmentURL+'?UID_eq=',
  username:establishmentURL+'?UID_eq='
}

const requestUserTypes = {
  name:userURL+'?_limit='+searchLimit+'&Name_contains=',
  username:userURL+'?_limit='+searchLimit+'&Username_contains='
}

const establishmentMap=function(res) {return {establishmentName: res.Name, nmdsid: res.NMDSID, postcode: res.Postcode, uid: res.UID, URL:res.URL}}
const userMap=function(res) {return {name: res.Name, username: res.Username, establishmentUID: res.EstablishmentUID, URL:res.URL}}

router.route('/').post((req, res) => {

  if(config.get('app.search.verifySignature')) {
    if (!isVerified(req)) return res.status(401).send();
  } else {
    console.log("WARNING - search - VerifySignature disabled");
  }

//  console.log("[POST] actions/search - body: ", req.body);

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

  if(!searchKey || dispatchers[searchKey]==undefined) {
    return res.status(200).json({
      text: `${command} - unexpected search key ${Object.keys(dispatchers)} - received ${tokens[0]}`,
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

  let results = [];
  const regex = new RegExp(searchValues, 'i');

  var msgBuilder={fn: responseSender, async: false };

  return dispatchers[searchKey](command, searchKey, searchValues, res, msgBuilder);
});

function getEstablishmentData(command, searchKey, searchValues, res, msgBuilder) {

  getToken()
  .then((token) => {
    searchType(token,requestTypes[searchKey],searchKey,searchValues,establishmentMap)
      .then((results) => {
        return msgBuilder.fn(res, command, searchKey, searchValues, results, msgBuilder);
      })
      .catch((err) => {
        console.log(err);
        if(!msgBuilder.async) {
          res.status(500).json({ error: `Strapi GetData ${err}`});
        }
      });
  })
  .catch((err) => {
    console.log(err);
    if(!msgBuilder.async) {
      res.status(500).json({ error: `Strapi Login ${err}`});
    }
  });
}

function getUserData(command, searchKey, searchValues, res, msgBuilder) {

  getToken()
  .then((token) => {
    searchType(token,requestUserTypes[searchKey],searchKey,searchValues,userMap)
      .then((users) => {

        var results=[];

        if(users.length!=0) {
          var promises=[];

          for(i=0;i<users.length;i++) {
            promises.push(
              searchType(token,requestTypes[searchKey],searchKey,users[i].establishmentUID,establishmentMap)
            );
          }

          Promise.all(promises)
            .then((establishmentArrys) => {
              establishments=[].concat.apply([],establishmentArrys);
              var results=[];

              for(i=0;i<users.length;i++) {
                results.push({...users[i],...establishments[i]});
              }
              return msgBuilder.fn(res, command, searchKey, searchValues, results, msgBuilder);
            })
            .catch((err) => {
              console.log(err);
              if(!msgBuilder.async) {
                res.status(500).json({ error: `Strapi GetUserData - establishment ${err}`});
              }
            });
          } else {
            return msgBuilder.fn(res, command, searchKey, searchValues, users, msgBuilder);
          }
      })
      .catch((err) => {
        console.log(err);
        if(!msgBuilder.async) {
            res.status(500).json({ error: `Strapi GetUserData - user ${err}`});
        }
      });
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ error: `Strapi GetUserData Login ${err}`});
  });
}

function responseSender(res, command, searchKey, searchValues, results)
{
  return res.status(200).json(responseFormat(command, searchKey, searchValues, results));
}

function responseResolver(res, command, searchKey, searchValues, results,msgBuilder)
{
  console.log("responseResolver "+command);
  msgBuilder.resolve(responseFormat(command, searchKey, searchValues, results));
}

function responseFormat(command, searchKey, searchValues, results) {
  var x=
    {
      text: `${command} - ${searchKey} on ${searchValues} - Results (#${results.length})`,
      username: 'markdownbot',
      markdwn: true,
      pretext: 'is this a match',
      attachments: results.map(thisResult => {
        return {
          //color: 'good',
          title: `${thisResult.name? thisResult.name + ' - ' + thisResult.username + ' -' : ''}${thisResult.establishmentName}: ${thisResult.nmdsid} - ${thisResult.postcode}`,
          text: `${thisResult.URL}`,
        }
      }),
    };
    return x;
}

function getToken() {
  return new Promise((resolve, reject) => {

		request.post(loginURL,
                 {json: true, body:
                  {identifier: config.get('app.search.strapiUsername'),
                  password: config.get('app.search.strapiPassword')} },
				   function(err,res, body) {

          if (err!=undefined) {
            console.log('err login '+loginURL);
            reject(err);
             return;
          };
          if (res.statusCode != 200) {
            console.log('!200 login '+loginURL);
            reject('Login Invalid status code <' + res.statusCode + '>');
              return;
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
          return;
        }
    
      if (res.statusCode != 200) {
        console.log('!200 POSTed '+searchURL);
        reject('Invalid status code <' + res.statusCode + '>');
        return;
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

function messageAsync(res, command, searchKey, searchValues, results, msgBuilder)
{
  var resultMsgJSON=JSON.stringify(responseFormat(command, searchKey, searchValues, results));

  sendResults(msgBuilder.responseURL, resultMsgJSON)
      .catch((err) => { console.log("sendResults "+err)});
}

function sendResults(responseURL, resultMsgJSON) {
  return new Promise((resolve, reject) => {

//    var postTo=config.get("app.find.slackURL");

    console.log(responseURL);

    request.post({uri:responseURL,
                  body: resultMsgJSON,
                  headers: {'Content-Type':'application/json; charset=\"utf-8\"'} },
				   function(err,res, body) {

					if (err) reject(err);
          if (res.statusCode != 200) {
              reject('sendResults Invalid status code <' + res.statusCode + '>');
          }

          if(body!='{\"ok\":true}') {
            reject(body);
          } 

          resolve(body);
	  });
	});
}

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

router.route('/callback').post((req, res) => {

  if(config.get('app.search.verifySignature')) {
    if (!isVerified(req)) return res.status(401).send();
  } else {
    console.log("WARNING - search/callback - VerifySignature disabled");
  }

  //console.log("POST search/callback " + req.body.payload);
  req.body=JSON.parse(req.body.payload);
  console.log(req.body);
  console.log(req.body.submission);

  var msgBuilder={fn: messageAsync, async: true, responseURL: req.body.response_url};

  dispatchers[req.body.submission.command](req.body.submission.command, 
                                           req.body.submission.command,
                                           req.body.submission.value,
                                           res, msgBuilder);

  res.status(200).json();
});

module.exports = router;
