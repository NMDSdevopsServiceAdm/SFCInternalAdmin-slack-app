const express = require('express');
const router = express.Router();

const registrationApproval = require('../../utils/registrationApprovals');

router.route('/').post(async (req, res) => {
  // console.log("[POST] interactions: ", req.body);

  if (req.body.payload) {
    const payload = JSON.parse(req.body.payload);

    console.log("WA DEBUG - payload: ", payload)

    const callbackID = payload.callback_id;
    console.log("WA DEBUG - interactions: callback id", callbackID)
  
    switch (callbackID) {
      case "registration":
        const processedRegistration = await registrationApproval(payload);
        if (processedRegistration === null) {

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
                  image_url: "https://cdn3.iconfinder.com/data/icons/3d-glossy-basic/512/ok-512.png",
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
