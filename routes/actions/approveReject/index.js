const express = require('express');
const uuid = require('uuid');
const router = express.Router();

router.route('/').post((req, res) => {
  return res.status(200).json(
    {
      username: 'markdownbot',
      markdwn: true,
      attachments: [
        {
          color: "good",
          pretext: "Registration for Approval",
          title: "The best establishment to have ever been created",
          title_link: "https://sfcdev.cloudapps.digital/workplace/7r537t584748",
          // text: "Approved by aylingw",
          fields: [
              {
                  title: "NMDS ID",
                  value: "A475786",
                  short: true
              },
              {
                title: "Postcode",
                value: "SE19 3NS",
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
          callback_id: "registration",
          color: "danger",
          attachment_type: "default",
          block_id: "abc-12364-xyz",
          actions: [
            {
                name: "status",
                text: "Accept",
                type: "button",
                value: "accept",
                style: "primary",
                action_id: "abc-12364-xyz",
            },
            {
              name: "status",
              text: "Rejection Reason",
              type: "select",
              action_id: "abc-12364-xyz",
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
              }
            }
          ],
          ts: 123456789
        }
      ]
    }
  );
});

module.exports = router;
