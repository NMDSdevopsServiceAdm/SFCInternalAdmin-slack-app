const express = require('express');
const router = express.Router();

const searchActionRoute = require('./search');
const findctionRoute = require('./find');

router.use('/search', searchActionRoute);
router.use('/find', findctionRoute);

module.exports = router;
