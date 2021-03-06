const request = require('request');
const config = require('../config/config');

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
  establishmentName: getEstablishmentData,
  name: getUserData,
  username: getUserData
}

const requestTypes = {
  postcode: establishmentURL+'?_limit='+searchLimit+'&Postcode_contains=',
  nmds: establishmentURL+'?NMDSID_eq=',
  locationid: establishmentURL+'?LocationID_eq=',
  establishmentName: establishmentURL+'?Name_contains=',
  name:establishmentURL+'?UID_eq=',
  username:establishmentURL+'?UID_eq='
}

const requestUserTypes = {
  name:userURL+'?_limit='+searchLimit+'&Name_contains=',
  username:userURL+'?_limit='+searchLimit+'&Username_contains='
}

const establishmentMap=function(res) {return {establishmentName: res.Name, nmdsid: res.NMDSID, postcode: res.Postcode, uid: res.UID, URL:res.URL}}
const userMap=function(res) {return {name: res.Name, username: res.Username, establishmentUID: res.EstablishmentUID, URL:res.URL}}

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
          console.error('getEstablishmentData searchtype error:', err);
          res.status(200).json({ error: `Failed - No results found`});
        }
      });
  })
  .catch((err) => {
    console.log(err);
    if(!msgBuilder.async) {
      console.error('getEstablishmentData login error:', err);
      res.status(200).json({ error: `Authentication failed`});
    }
  });
}

function getUserData(command, searchKey, searchValues, res, msgBuilder) {

  getToken()
  .then((token) => {
    searchType(token,requestUserTypes[searchKey],searchKey,searchValues,userMap)
      .then((users) => {
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
                console.error('getUserData searchtype establishments error:', err);
                res.status(200).json({ error: `Failed - No results found`});
              }
            });
          } else {
            return msgBuilder.fn(res, command, searchKey, searchValues, users, msgBuilder);
          }
      })
      .catch((err) => {
        console.log(err);
        if(!msgBuilder.async) {
          console.error('getUserData searchtype error:', err);
          res.status(200).json({ error: `Failed - No results found`});
        }
      });
  })
  .catch((err) => {
    console.error('getUserData login error:', err);
    res.status(200).json({ error: `Authentication failed`});
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
  const x=
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
    console.log('strapi login url: ', loginURL);
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
                  }
    );
  });
}

function searchType(token, queryURL, searchKey, value, responseMap) {
  //console.log("searchType "+queryURL+" "+value);

  return new Promise((resolve, reject) => {
    var searchURL=queryURL+value;
    console.log("strapi search URL: ", searchURL);
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

function messageAsync(res, command, searchKey, searchValues, results, msgBuilder) {
  const resultMsgJSON=JSON.stringify(responseFormat(command, searchKey, searchValues, results));

  sendResults(msgBuilder.responseURL, resultMsgJSON)
      .catch((err) => { console.error("sendResults "+err)});
}

function sendResults(responseURL, resultMsgJSON) {
  return new Promise((resolve, reject) => {
    console.log('sendResults responseUrl: ', responseURL);

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
                  }
    );
	});
}

// returms true if dispatcher for the given search key found - otherwise false
const isDispatcher = (searchKey) => {
  return dispatchers[searchKey] === undefined ? true : false;
};

// perform search on a single search key
const singleSearch = (command, searchKey, searchValues, res) => {
  const msgBuilder={fn: responseSender, async: false };
  return dispatchers[searchKey](command, searchKey, searchValues, res, msgBuilder);
};

// perform a search on a single search key, but as part of a multi-step search
const stepSearch = (fieldName, fieldValue, resolve, res) => {
  const msgBuilder={fn: responseResolver, async: false, resolve: resolve};
  console.log("Fire "+fieldName+" Promise");
  return dispatchers[fieldName](fieldName, fieldName, fieldValue, res, msgBuilder);
};


const findSearch = (payload, res) => {
  const msgBuilder={fn: messageAsync, async: true, responseURL: payload.response_url};
  dispatchers[payload.submission.command](payload.submission.command, 
                                          payload.submission.command,
                                          payload.submission.value,
                                          res,
                                          msgBuilder);

  res.status(200).json();
};

module.exports.singleSearch = singleSearch;
module.exports.isDispatcher = isDispatcher;
module.exports.interactiveFind = findSearch;
module.exports.stepSearch = stepSearch;