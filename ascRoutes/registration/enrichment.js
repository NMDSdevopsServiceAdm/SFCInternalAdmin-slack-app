const express = require('express');
const router = express.Router();
const SearchUtil = require('../../utils/search');

router.route('/').post((req, res) => {

  //console.log("POST asc/enrich " + req.body);

  var promises=[];

  // postcode, location id and name are each optional
  req.body.postcode ? addSearchPromise(promises,"postcode", req.body.postcode, res) : true;
  req.body.locationid ? addSearchPromise(promises,"locationid", req.body.locationid, res) : true;
  req.body.name ? addSearchPromise(promises,"establishmentName", req.body.name, res) : true;

  Promise.all(promises)
    .then((resultArrys) => {
      results=[].concat.apply([],resultArrys);

      console.log("POST asc/enrich - All Promises done");

      // now filter down to get a unqiue set of attachments
      const uniqueResults = {};

      if (results && Array.isArray(results)) {
        results.forEach(thisSet => {
          if (thisSet.attachments && Array.isArray(thisSet.attachments)) {
            thisSet.attachments.forEach(thisAttachment => {
              const key = thisAttachment.title.replace(/\s/g, "");
              if (!uniqueResults[key]) {
                uniqueResults[key] = thisAttachment;
              }
            });
          }
        });
      }

      res.status(200).json(Object.values(uniqueResults));
    })
    .catch((err) => {
      console.error('POST asc/enrich', err);
      res.status(500).send();
  });
});

function addSearchPromise(promises, fieldName, fieldValue, res) {
  if(fieldValue!=undefined && fieldValue!=null) {
    promises.push(new Promise((resolve, reject) => {
      return SearchUtil.stepSearch(fieldName, fieldValue, resolve, res);
    }));
  }
}

module.exports = router;