const axios = require('axios');
const qs = require('qs');
const express = require('express');
const config = require('../../config/config');
const registrationApproval = require('../../utils/registrationApprovals');

const router = express.Router();

const apiUrl = 'https://slack.com/api';

// open the dialog by calling dialogs.open method and sending the payload
const openDialog = async (payload, real_name) => {
  const dialogData = {
    token:  config.get('slack.client_secret'),
    trigger_id: payload.trigger_id,
    dialog: JSON.stringify({
      title: 'Save it to ClipIt!',
      callback_id: 'clipit',
      submit_label: 'ClipIt',
      elements: [
         {
           label: 'Reason for rejection',
           type: 'textarea',
           name: 'message',
           value: ''
         },
         {
           label: 'Posted by',
           type: 'text',
           name: 'send_by',
           value: `${real_name}`
         },
         {
           label: 'Importance',
           type: 'select',
           name: 'importance',
           value: 'Medium 💎',
           options: [
             { label: 'High', value: 'High 💎💎✨' },
             { label: 'Medium', value: 'Medium 💎' },
             { label: 'Low', value: 'Low ⚪️' }
           ],
         },
      ]
    })
  };

  try {
    // open the dialog by calling dialogs.open method and sending the payload
    const dialogDataJSON = qs.stringify(dialogData);
    console.log("WA DEBUG - posting dialog: ", dialogDataJSON);
    const slackResponse = await axios.post(`${apiUrl}/dialog.open`, dialogDataJSON);

    console.log("WA DEBUG - slack response: ", slackResponse)

    return true;
  } catch (err) {
    console.error("openDialog - failed to post to slack: ", err);

    return false;
  }
};

router.route('/').post(async (req, res) => {
 console.log("[POST] interactions: ", req.body);

  if (req.body.payload) {
    const payload = JSON.parse(req.body.payload);

    console.log("WA DEBUG - payload: ", payload)

    const callbackID = payload.callback_id;
    console.log("WA DEBUG - interactions: callback id", callbackID)
  
    switch (callbackID) {
      case "registration":
        const processedRegistration = await registrationApproval(payload);
        if (processedRegistration === null) {
          return res.status(500).send();

        } else if (processedRegistration) {
          console.log("WA DEBUG - approved")
          return res.status(200).json(
            {
              username: 'markdownbot',
              markdwn: true,
              response_type: 'in_channel',
              replace_original: false,
              delete_original: false,
              attachments: [
                {
                  color: "success",
                  pretext: "Approved Registration",
                  title: "The best establishment to have ever been created",
                  title_link: "https://sfcdev.cloudapps.ditigal/workplace/7r537t584748",
                  text: `Approved by ${payload.user.name}`,
                  fields: [
                      {
                          "title": "NMDS ID",
                          "value": "A475786",
                          "short": true
                      },
                      {
                        "title": "Postcode",
                        "value": "SE19 3NS",
                        "short": true
                      },
                  ],
                  image_url: "https://i.ya-webdesign.com/images/approved-stamp-png-7.png",
                  // thumb_url: "https://sfcstaging.cloudapps.digital/assets/images/logo.png",
                  footer: "SFC ASCWDS",
                  // footer_icon: "https://sfcstaging.cloudapps.digital/assets/images/logo.png",
                  // ts: 123456789
                }
              ]
            }
          );
        } else {
          console.log("WA DEBUG - rejected")


          // const sendDialog = await openDialog(payload, 'Warren Ayling');
          // if (sendDialog) {
          //   return res.status(200).send();
          // } else {
          //   return res.status(500).send();
          // }

          return res.status(200).json({
            username: 'markdownbot',
            markdwn: true,
            response_type: 'in_channel',
            replace_original: true,
            delete_original: false,
            attachments: [
              {
                color: "danger",
                pretext: "Rejected Registration",
                title: "The best establishment to have ever been created",
                title_link: "https://sfcdev.cloudapps.ditigal/workplace/7r537t584748",
                text: `Rejected by ${payload.user.name} because ${payload.actions[0].selected_options[0].value}`,
                fields: [
                    {
                        "title": "NMDS ID",
                        "value": "A475786",
                        "short": true
                    },
                    {
                      "title": "Postcode",
                      "value": "SE19 3NS",
                      "short": true
                    },
                ],
                image_url: "http://iphone-developers.com/images/uploads/tt.png",
                // thumb_url: "https://sfcstaging.cloudapps.digital/assets/images/logo.png",
                footer: "SFC ASCWDS",
                // footer_icon: "https://sfcstaging.cloudapps.digital/assets/images/logo.png",
                // ts: 123456789
              }
            ]
          });
        }
        break;
    }
  
    return res.status(200).json({
        text: 'DOH!',
        style: 'warning',
        username: 'markdownbot',
        markdwn: true,
    });
  
  } else {
    res.status(500).send();
  }

});

module.exports = router;
