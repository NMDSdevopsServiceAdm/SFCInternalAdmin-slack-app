const express = require('express');
const slackAuthorised = require('./../utils/verifySignature').slackAuthorised;

const router = express.Router();

const actionRoutes =  require('./actions')
const interactionsRoutes =  require('./interactions')

// prefix slack authorisation middleware on all slack routes
router.use('/', slackAuthorised);
router.use('/actions', actionRoutes);
router.use('/interactions', interactionsRoutes);

module.exports = router;
