const express = require('express');
const bodyParser = require('body-parser');
// const proxy = require('express-http-proxy');          // for service public/download content

// app config
const AppConfig = require('./config/appConfig');
const config = require('./config/config');

// interactive slack library
const { createMessageAdapter } = require('@slack/interactive-messages');

// security libraries
const helmet = require('helmet');
const xssClean = require('xss-clean');
const sanitizer = require('express-sanitizer');

const otherRoutes = require('./routes');

const app = express();


/* public/download - proxy interception */
// const publicDownloadBaseUrl = config.get('public.download.baseurl');
// app.use('/public/download', proxy(
//     publicDownloadBaseUrl,
//     {
//         proxyReqPathResolver: function (req) {
//           const updatedPath = publicDownloadBaseUrl + req.url;
//           //console.log("public/download proxy API request to: ", `${updatedPath}`)
//           return updatedPath;
//         }
//     }
// ));

// // redirect the admin application
// app.use('/admin', (req, res) => {
//   res.redirect(301, config.get('admin.url'));
// });

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

// for parsing of JSON from request body
app.use(bodyParser.json());

// this middleware add common 'no cache' headerst to the response
const nocache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, max-age=0, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};
app.use('/', nocache);

const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);
app.use('/slack/actions', slackInteractions.expressMiddleware());

const rootEndpoint = (req, res, next) => {
    console.log("hit root endpoint: ", req.body);
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
