const express = require('express');
const registrationApproval = require('../../utils/registrationApprovals');
const SearchUtil = require('../../utils/search');

const router = express.Router();

router.route('/').post(async (req, res) => {
  if (req.body.payload) {
    const payload = JSON.parse(req.body.payload);

    // console.log("WA DEBUG - payload: ", payload)

    const callbackID = payload.callback_id;
    console.log("CallbackID - ", callbackID);

    switch (callbackID) {
      // on accepting or rejecting a registration
      case "registration":
        return registrationApproval(payload, res);
        break;
      
      // on having entered information in the find (search) dialog
      case "find-callbackid":
        return SearchUtil.interactiveFind(payload, res);
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
