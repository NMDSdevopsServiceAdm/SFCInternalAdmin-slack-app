const express = require('express');
const router = express.Router();

const statusRoute = require('./status');
router.use('/status', statusRoute);

module.exports = router;
