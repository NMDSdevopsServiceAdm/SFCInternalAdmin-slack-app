const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../../../config/config');

router.route('/').post((req, res) => {
  console.log("[POST] actions/find: ", req.body);

  console.log(req.body.trigger_id);
  console.log(req.body.token);

  sendDialog(req.body.token,req.body.trigger_id)
    .then(() => {
      return res.status(200).json({ message:'Launching ASC Finder'});
    })
    .catch((err) => {
      console.log(err);
      res.status(200).json({ error: `Failed to launch ASC Finder ${err}`});
    });

});

function sendDialog(token, trigger_id) {
  return new Promise((resolve, reject) => {

    var dialogDataJSON=JSON.stringify({
      "trigger_id": trigger_id,
      "response_url": config.get("app.find.responseURL"),
      "dialog": {
        "callback_id": "bmo-callbackid",
        "title":"BMO Dialog",
        "elements": [{
          "type": "text",
          "label": "Enter something",
          "name": "enter"
        }]
      }
    });

    console.dir(JSON.parse(dialogDataJSON));

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
