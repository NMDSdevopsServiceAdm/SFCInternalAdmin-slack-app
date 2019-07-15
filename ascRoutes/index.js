const express = require('express');
const isAuthenticated = require('./../utils/security/JWT').isAuthenticated;
const registrationRoutes =  require('./registration');

const router = express.Router();


// prefix ASC WDS authorisation middleware on all ASC routes
//router.use('/', isAuthenticated);

// import routes
router.use('/registrations', registrationRoutes);

module.exports = router;
