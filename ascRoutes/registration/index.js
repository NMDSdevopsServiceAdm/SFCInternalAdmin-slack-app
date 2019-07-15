const express = require('express');
const router = express.Router();

const enrichmentRoute = require('./enrichment');

router.use('/enrich', enrichmentRoute);

module.exports = router;
