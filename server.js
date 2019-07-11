const express = require('express');
const bodyParser = require('body-parser');
// const proxy = require('express-http-proxy');          // for service public/download content

const querystring = require('querystring');

// app config
const AppConfig = require('./config/appConfig');
const config = require('./config/config');

// security libraries
const helmet = require('helmet');
const xssClean = require('xss-clean');
const sanitizer = require('express-sanitizer');

const otherRoutes = require('./routes');
const helperRoutes = require('./routes/helper');

const app = express();

/*
 * security - incorproate helmet & xss-clean (de facto/good practice headers) across all endpoints
 */

// exclude middleware for given API path - used to exclude xss-clean to be able to demonstrate express-sanitizer on /api/test
const unless = function(root, path, middleware) {
    return function(req, res, next) {
        const rootRegex = new RegExp('^' + root);
        const excludePathRegex = new RegExp('^' + root + '/' + path);

        // first, if the exclude root, simply move on
        if (excludePathRegex.test(req.path)) {
            return next();
        } else if (rootRegex.test(req.path)) {
            // matches on the root path, and is not excluded
            return middleware(req, res, next);
        } else {
            // doesn't match the root path, so move on
            return next();
        }
    };
};

// disable Helmet's caching - because we control that directly - cahcing is not enabled by default; but explicitly disabling it here
// set frame policy to deny
// only use on '/api' endpoint, because these changes may otherwise impact on the UI.
app.use('/', helmet({
    noCache: false,
    frameguard: {
        action: 'deny'
    },
    contentSecurityPolicy : {
        directives: {
            defaultSrc: ["'self'"]
        }
    }
}));

// encodes all URL parameters
// app.use('/', xssClean());
// app.use('/', sanitizer());
/*
 * end security
 */

// for verifying signature
//app.use('/actions',function(req, res, next){
//    var data = "";
//    req.on('data', function(chunk){
//      data += chunk;
//      next();
//    })
//    req.on('end', function(){
//      req.rawBody = data;
//      req.body=JSON.parse(data);
//      next();
//    })
//});

function getRaw(req, res, next) {
    req.rawBody=req.body;
    req.body=querystring.parse(req.rawBody);
    next();
}

// for parsing of JSON from request body
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/x-www-form-urlencoded' }));
app.use(getRaw);
app.use(bodyParser.urlencoded({ extended: true }));

// this middleware add common 'no cache' headerst to the response
const nocache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, max-age=0, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};
app.use('/', nocache);

const rootEndpoint = (req, res, next) => {
    console.log("WA DEBUG hit root endpoint: ", req.originalUrl, req.headers);
    return res.status(200).json({
        status: true
    });
};

const interactiveRoute = (req, res, next) => {
    console.log("TODO: refactor this endpoint: ", req.body);
    return res.status(200).json({
        text: `INFO`,
        username: 'markdownbot',
        markdwn: true,
        attachments: Object.keys(req.body).map(thisKey => {
            return {
                color: Number.isInteger(req.body[thisKey]) ? 'good' : 'bad',
                title: 'Internal Admin Root',
                text: `${thisKey} : ${req.body[thisKey]}`
            };
        })
    });
};

// open/reference endpoints
app.use('/',otherRoutes);
app.use('/helper', helperRoutes);
app.post('/', interactiveRoute);
app.use('/',rootEndpoint);

const startApp = () => {
    const listenPort = parseInt(config.get('listen.port'), 10);
    app.set('port', listenPort);
    app.listen(app.get('port'));
    console.log('Listening on port: ' + app.get('port'));
};

if (AppConfig.ready) {
    startApp();
} else {
    AppConfig.on(AppConfig.READY_EVENT, () => {
        startApp();
    });
}

module.exports = app;
