const express = require('express');
const router = express.Router();

const statusRoute = require('./status');
const actionRoutes =  require('./actions')
const interactionsRoutes =  require('./interactions')

router.use('/status', statusRoute);
router.use('/actions', actionRoutes);
router.use('/interactions', interactionsRoutes);

module.exports = router;
