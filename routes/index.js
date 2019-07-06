const express = require('express');
const router = express.Router();

const statusRoute = require('./status');
const actionRoutes =  require('./actions')

router.use('/status', statusRoute);
router.use('/actions', actionRoutes);

module.exports = router;
