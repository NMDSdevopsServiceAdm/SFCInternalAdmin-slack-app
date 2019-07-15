const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../../../config/config');

const isVerified = require('../../../utils/verifySignature').isVerified;

router.route('/').post((req, res) => {
  //console.log("[POST] actions/find: ", req.body);

  sendDialog(req.body.trigger_id)
    .then(() => {
      return res.status(200).json({ message:'Launching ASC Finder'});
    })
    .catch((err) => {
      console.log('actions/find error:', err);
      res.status(200).json({ error: `Failed to launch ASC Finder`});
    });

});

function sendDialog(trigger_id) {
  return new Promise((resolve, reject) => {

    var dialogDataJSON=JSON.stringify({
      "trigger_id": trigger_id,
      "dialog": {
        "callback_id": "find-callbackid",
        "title":"ASC Search",
        "elements": [
          {
            "label": "Search Type",
            "type": "select",
            "name": "command",
            "options": [
              {"label":"Establishment postcode contains","value":"postcode"},
              {"label":"Establishment location (PK) Identifier","value":"locationid"},
              {"label":"Establishment NMDS Identifier","value":"nmds"},
              {"label":"User fullname contains","value":"name"},
              {"label":"Username contains","value":"username"}
            ]
          },
          {
            "type": "text",
            "label": "Value",
            "name": "value"
          }],
        }
    });

    //console.dir(JSON.parse(dialogDataJSON));

    var token=config.get("app.find.slackToken");
    var postTo=config.get("app.find.slackURL");

    request.post({uri:postTo,
                  auth: {bearer:token},
                  body: dialogDataJSON,
                  headers: {'Content-Type':'application/json; charset=\"utf-8\"'} },
				   function(err,res, body) {

					if (err) reject(err);
          if (res.statusCode != 200) {
              reject('Login Invalid status code <' + res.statusCode + '>');
          }

          if(body!='{\"ok\":true}') {
            reject(body);
          } 

          resolve(body);
	  });
	});
}

module.exports = router;
