
const convict = require('convict');
const fs = require('fs');
const yaml = require('js-yaml');

// AWS Secrets Manager override
const AWSSecrets = require('../aws/secrets');

const AppConfig = require('./appConfig');

// Define schema
const config = convict({
  env: {
    doc: 'The application environment',
    format: ['production', 'development', 'test', 'accessibility', 'localhost'],
    default: 'localhost',
    env: 'NODE_ENV'
  },
  version: {
    doc: 'The API version',
    format: String,
    default: '0.0.0'
  },
  log: {
    level: {
      doc: 'Not yet used, but will be the default log level',
      format: String,
      default: 'NONE'
    },
  },
  listen: {
    port: {
      doc: 'Server binding port',
      format: 'port',
      default: 3000,
      env: 'PORT'
    },
    ip: {
      doc: 'Server binding IP',
      format: "ipaddress",
      default: "127.0.0.1",
      env: 'HOST',
    }
  },
  notify: {
      key: {
          doc: 'The gov.uk notify key',
          format: '*',
          default: 'unknown',           // note - bug in notify - must provide a default value for it to use env var
          env: "NOTIFY_KEY"
      },
      replyTo: {
        doc: 'The id to use for reply-to',
        format: function check(val) {
          const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
          if (!uuidRegex.test(val.toUpperCase())) throw new TypeError('gov.uk notify reply-to id should be a V4 UUID');
        },
        default: '80d54020-c420-46f1-866d-b8cc3196809d'
      },
      templates: {
        resetPassword: {
          doc: 'The template id for sending reset password emails',
          format: function check(val) {
            const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
            if (!uuidRegex.test(val.toUpperCase())) throw new TypeError('gov.uk notify reset password template id should be a V4 UUID');
          },
          default: '80d54020-c420-46f1-866d-b8cc3196809d'
        },
        addUser: {
          doc: 'The template id for sending user registration emails',
          format: function check(val) {
            const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
            if (!uuidRegex.test(val.toUpperCase())) throw new TypeError('gov.uk notify add user template id should be a V4 UUID');
          },
          default: '80d54020-c420-46f1-866d-b8cc3196809d'
        }
      }
  },
  jwt: {
      iss: {
          doc: 'The JWT issuer',
          format: 'url',
          env: 'TOKEN_ISS',
          default: 'http://localhost:3000'
      },
      secret: {
        doc: 'The JWT signing secret',
        format: '*',
        env: 'Token_Secret'
      },
      ttl: {
        default : {
          doc: 'The (default) Time To Live (in minutes) for token (timeout)',
          format: 'int',
          default: 5
        },
        login: {
          doc: 'The Time To Live (in minutes) for login token',
          format: 'int',
          default: 5,
          env: 'LOGIN_JWT_TTL'
        }
      },
      aud: {
        internalAdminApp: {
          doc: 'The JWT audience for the Internal Admin application',
          format: String,
          default: 'ADS-WDS-Internal-Admin-App'
        },
      }
  },
  slack: {
      url: {
          doc: 'The slack notification endpoint',
          format: 'url',
          default: 'unknown',           // note - bug in notify - must provide a default value for it to use env var
          env: 'SLACK_URL'
      },
      secret: {
        doc: 'Slack signing secret',
        format: '*',
        default: '',
        env: 'SLACK_SIGNING_SECRET'
      },
      client_secret: {
        doc: 'The slack client secret to use when posting responses back to Slack',
        format: '*',
        default: '',
        env: 'SLACK_CLIENT_SECRET'
      },
      registrations : {
        webhook: {
          doc: 'The URL to post registrations',
          format: 'url',
          default: 'http://localhost',
          env: 'SLACK_REGISTRATION_WEBHOOK'
        }
      }
  },
  aws: {
    region: {
      doc: 'AWS region',
      format: '*',
      default: 'eu-west-2',
    },
    secrets: {
      use: {
        doc: 'Whether to use AWS Secret Manager to retrieve sensitive information, e.g. DB_PASS. If false, expect to read from environment variables.',
        format: 'Boolean',
        default: false
      },
      wallet: {
        doc: 'The name of the AWS Secrets Manager wallet to recall from',
        format: String,
        default: 'bob'
      }
    },
  },
  app: {
    url: {
      doc: 'The base URL to ASC WDS',
      format: 'url',
      default: 'http://localhost:3001'
    },
    find: {
      verifySignature: {
        doc: 'Weather to verify the Slack Token is signed correctly.',
        format: 'Boolean',
        default: true
      },
      slackToken: {
        doc: 'The OAuth Token to login to Slack',
        format: String,
        default: 'configure_token_here',
        env: 'FIND_SLACK_TOKEN'
      },
      slackURL: {
        doc: 'The URL for Slack Dialog to post back',
        format: String,
        default: 'https://slack.com/api/dialog.open',
      },
      responseURL: {
        doc: 'The URL for Slack Dialog to post back',
        format: String,
        default: 'http://localhost:3001/find',
      }
    },
    search: {
      verifySignature: {
        doc: 'Weather to verify the Slack Token is signed correctly.',
        format: 'Boolean',
        default: true
      },
      strapiBaseURL: {
        doc: 'The base URL to STRAPI',
        format: 'url',
        default: 'http://localhost:1337'
      },
      strapiUsername: {
        doc: 'The base Username to login to STRAPI',
        format: String,
        default: 'configure_username_here'
      },
      strapiPassword: {
        doc: 'The base Password to login to STRAPI',
        format: String,
        default: 'configure_password_here',
        env: 'SEARCH_STRAPI_PASSWORD'
      }
    }
  }
});

// Load environment dependent configuration
var env = config.get('env');

const envConfigfile = yaml.safeLoad(fs.readFileSync(__dirname + '/' + env + '.yaml'));
const commonConfigfile = yaml.safeLoad(fs.readFileSync(__dirname + '/common.yaml'));

// load common file first, then env (so env overrides common)
config.load(commonConfigfile);
config.load(envConfigfile);

// Perform validation
config.validate(
    {allowed: 'strict'}
);

// now, if defined, load secrets from AWS Secret Manager
if (config.get('aws.secrets.use')) {
  AWSSecrets.initialiseSecrets(
    config.get('aws.region'),
    config.get('aws.secrets.wallet')
  ).then(ret => {
    // DB rebind
    config.set('db.host', AWSSecrets.dbHost());
    config.set('db.password', AWSSecrets.dbPass());

    // external APIs
    config.set('slack.url', AWSSecrets.slackUrl());
    config.set('notify.key', AWSSecrets.govNotify());
    config.set('admin.url', AWSSecrets.adminUrl());

    config.set('slack.secret', AWSSecrets.slackSecret());

    AppConfig.ready = true;
    AppConfig.emit(AppConfig.READY_EVENT);
  });
} else {
  // emit something here
  AppConfig.ready = true;
}

module.exports = config;
