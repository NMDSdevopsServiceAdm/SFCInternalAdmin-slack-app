const axios = require('axios');
const JWT = require('../utils/security/JWT');
const config = require('../config/config');

const apiUrl = config.get('app.url') + '/api/establishment';

const approveReject = async (establishmentUID, request) => {
  if (request.actions && Array.isArray(request.actions)) {
    const backendApiJWT = JWT.ASCWDS_JWT(15, request.user.name);

    if (request.actions[0] && request.actions[0].value === 'accept') {

      try {
        const apiResponse = await axios(
          {
            method: 'post',
            url: `${apiUrl}/${establishmentUID}/approve`,
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
            },
          }
        );

        if (apiResponse.status === 200) {
          console.log("Accepting the registration");
          return true;
        } else {
          console.log("The ASC WDS failed to accept registration");
          return null;
        }
      } catch (err) {
        console.error("WA TODO - Need better error handling: ", err);
        return null;
      }

    } else {
      const reasonForRejection = request.actions[0].selected_options;
      console.log("REJECTING THE REGISTRATION: ", reasonForRejection[0].value);


      try {
        const apiResponse = await axios(
          {
            method: 'post',
            url: `${apiUrl}/${establishmentUID}/reject`,
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
            },
            data: {
              reject: {
                reason: reasonForRejection[0].value,
                notes: '',    // this will come later
              }
            }
          }
        );

        if (apiResponse.status === 200) {
          console.log("Rejecting the registration");
          return false;
        } else {
          console.log("The ASC WDS failed to reject registration");
          return null;
        }
      } catch (err) {
        console.error("WA TODO - Need better error handling: ", err);
        return null;
      }
    }
  } else {
    return null;
  }
};

const processApproveReject = async (paylaod, res) => {
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
}

/*
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
}; */

module.exports = processApproveReject;