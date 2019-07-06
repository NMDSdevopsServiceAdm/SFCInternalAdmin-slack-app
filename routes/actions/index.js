const express = require('express');
const router = express.Router();

const searchActionRoute = require('./search');
const findctionRoute = require('./find');
const approveActionRoute = require('./approveReject');

router.use('/search', searchActionRoute);
router.use('/find', findctionRoute);
router.use('/approve', approveActionRoute);

module.exports = router;
