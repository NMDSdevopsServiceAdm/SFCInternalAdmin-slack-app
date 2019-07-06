const express = require('express');
const axios = require('axios');
const config = require('../config/config');

const router = express.Router();

const slackMsg = (params) => {
console.log("WA DEBUG params: ", params)

  return {
    username: 'markdownbot',
    attachments: [
      {
        color: "good",
        pretext: "Registration for Approval",
        title: params.establishment.name,
        title_link: "https://sfcdev.cloudapps.digital/workplace/7r537t584748",
        // text: "Approved by aylingw",
        fields: [
            {
                title: "NMDS ID",
                value: params.establishment.nmdsId,
                short: true
            },
            {
              title: "Postcode",
              value: params.establishment.postcode,
              short: true
            }
        ],
      },
      {
        color: "warning",
        title: "1. Have Not and Want Not",
        title_link: "https://sfcdev.cloudapps.digital/workplace/89248593585648",
        // text: "Approved by aylingw",
        fields: [
            {
                title: "NMDS ID",
                value: "H838598",
                short: true
            },
            {
              title: "Postcode",
              value: "SE19 3SS",
              short: true
            }
        ],
      },
      {
        color: "warning",
        title: "2. Them and Us",
        title_link: "https://sfcdev.cloudapps.digital/workplace/854e864893483",
        // text: "Approved by aylingw",
        fields: [
            {
                title: "NMDS ID",
                value: "C088958",
                short: true
            },
            {
              title: "Postcode",
              value: "HS6 7SS",
              short: true
            }
        ],
      },
      {
        text: "registration",
        fallback: "You are unable to approve/reject",
        callback_id: "registration",
        color: "danger",
        attachment_type: "default",
        actions: [
          {
            name: "status",
            text: "Accept",
            type: "button",
            value: "accept",
            style: "primary",
          },
          {
              name: "status",
              text: "Reject",
              type: "select",
              options: [
                {
                    "text": "Duplicate",
                    "value": "Duplicated",
                },
                {
                    "text": "Poppicot",
                    "value": "Pure Poppicott",
                }
              ],
              confirm: {
                title: "Are you sure?",
                text: "Confirm to reject this registration?",
                ok_text: "Yes",
                dismiss_text: "No"
              },
          }
        ]
      },
    ]
  };
}

const postRegistration = async (req, res, next) => {
  console.log("WA DEBUG - SLACK webhook: ", config.get('slack.registrations.webhook'));
  console.log("WA DEBUG - request body: ", req.body);

  console.log("WA DEBUG - message in JSON: ", JSON.stringify(slackMsg(req.body)));


  try {
    const apiResponse = await axios.post(
      config.get('slack.registrations.webhook'),
        slackMsg(req.body),       // the data
        {
            headers: {
                'Content-Type': 'application/json',
            }
        });

      console.log("WA DEBUG - apiResponse: ", apiResponse.data);

      return res.status(200).json({
        success: true
      });
  } catch (err) {
    // silently discard errors
    console.error("Failed to post to Slack: ", err);
  }
};

router.post('/registration', postRegistration);

module.exports = router;
