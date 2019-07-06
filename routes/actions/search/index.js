const express = require('express');
const router = express.Router();

router.route('/').post((req, res) => {
  console.log("[POST] actions/search: ", req.body, req.params);

  return res.status(200).json({
    text: `Search Results - SE19 3NS`,
    username: 'markdownbot',
    markdwn: true,
    attachments: [
      {
          color: 'good',
          title: 'establishment 1 - A7838489 - SE19 3NS',
          text: 'https://sfcdev.cloudapps.digital/workplace/3f4b2ac9-4a90-4b84-827c-0c70c765a5ce'
      },
      {
        color: 'good',
        title: 'establishment 2 - A204989 - LS1 1AA',
        text: 'https://sfcdev.cloudapps.digital/workplace/c06886b3-c798-4f9c-b549-873aeac2bd80'
    }
    ]
  });
});

module.exports = router;
