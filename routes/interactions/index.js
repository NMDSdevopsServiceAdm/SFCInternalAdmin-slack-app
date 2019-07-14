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
  if(config.get('app.search.verifySignature')) {
    if (!isVerified(req)) return res.status(401).send();
  } else {
    console.log("WARNING - search - VerifySignature disabled");
  }

  if (req.body.payload) {
    const payload = JSON.parse(req.body.payload);

    // console.log("WA DEBUG - payload: ", payload)

    const originalEstablishment = payload.original_message.attachments[0];
    const originalEstablishmentName = originalEstablishment.title;
    const originalEstablishmentFields = originalEstablishment.fields;
    const originalEstablishmentUIDField = originalEstablishmentFields.find(thisField => thisField.title === 'UID');
    const originalEstablishmentNMDSField = originalEstablishmentFields.find(thisField => thisField.title === 'NMDS ID');
    const originalEstablishmentPostcodeField = originalEstablishmentFields.find(thisField => thisField.title === 'Postcode');
    const establishmentUID = originalEstablishmentUIDField ? originalEstablishmentUIDField.value : null;

    if (!establishmentUID) {
      // failed to extract the establishment UID
      return res.status(400).send('Failed to identifiy establishment UID from Slack request');
    }
  
    const callbackID = payload.callback_id;
    switch (callbackID) {
      case "registration":
        const processedRegistration = await registrationApproval(establishmentUID, payload);
        if (processedRegistration === null) {
          return res.status(500).send();

        } else if (processedRegistration) {
          return res.status(200).json(
            {
              username: 'markdownbot',
              markdwn: true,
              response_type: 'in_channel',
              replace_original: true,
              delete_original: false,
              attachments: [
                {
                  color: "success",
                  pretext: "Approved Registration",
                  title: originalEstablishmentName,
                  title_link: `https://sfcdev.cloudapps.digitial/workplace/${establishmentUID}`,
                  text: `Approved by ${payload.user.name}`,
                  fields: [
                      {
                        "title": "UID",
                        "value": establishmentUID,
                        "short": false
                      },
                      {
                          "title": "NMDS ID",
                          "value": originalEstablishmentNMDSField ? originalEstablishmentNMDSField.value : 'oops',
                          "short": true
                      },
                      {
                        "title": "Postcode",
                        "value": originalEstablishmentPostcodeField ? originalEstablishmentPostcodeField.value : 'whoops',
                        "short": true
                      },
                  ],
                  image_url: "https://asc-support.uk/images/registration_approved.png",
                  footer: "SFC ASCWDS",
                }
              ]
            }
          );
        } else {
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
                title: originalEstablishmentName,
                title_link: `https://sfcdev.cloudapps.digitial/workplace/${establishmentUID}`,
                text: `Rejected by ${payload.user.name} because ${payload.actions[0].selected_options[0].value}`,
                fields: [
                  {
                    "title": "UID",
                    "value": establishmentUID,
                    "short": false
                  },
                  {
                    "title": "NMDS ID",
                    "value": originalEstablishmentNMDSField ? originalEstablishmentNMDSField.value : 'oops',
                    "short": true
                  },
                  {
                    "title": "Postcode",
                    "value": originalEstablishmentPostcodeField ? originalEstablishmentPostcodeField.value : 'whoops',
                    "short": true
                  },
                ],
                image_url: "https://asc-support.uk/images/registration_rejected.png",
                footer: "SFC ASCWDS",
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
