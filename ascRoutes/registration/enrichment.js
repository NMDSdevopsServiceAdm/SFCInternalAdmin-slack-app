const express = require('express');
const router = express.Router();
const SearchUtil = require('../../utils/search');

router.route('/').post((req, res) => {

  //console.log("POST asc/enrich " + req.body);

  var promises=[];

  // postcode, location id and name are each optional
  req.body.postcode ? addSearchPromise(promises,"postcode", req.body.postcode, res) : true;
  req.body.locationid ? addSearchPromise(promises,"locationid", req.body.locationid, res) : true;
  req.body.name ? addSearchPromise(promises,"name", req.body.name, res) : true;

  Promise.all(promises)
    .then((resultArrys) => {
      results=[].concat.apply([],resultArrys);

      console.log("POST asc/enrich - All Promises done");
      res.status(200).json(results);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: `search/combined ${err}`});
  });
});

function addSearchPromise(promises, fieldName, fieldValue, res) {
  if(fieldValue!=undefined && fieldValue!=null) {
    promises.push(new Promise((resolve, reject) => {
      return SearchUtil.stepSearch(fieldName, fieldValue, resolve, res);
    }));
  }
}
