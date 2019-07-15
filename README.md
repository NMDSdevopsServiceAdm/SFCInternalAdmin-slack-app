# ASC WDS Slack "Internal Admin" app

## commands
* /asc-search [postcode] [nmdsid] [name] [username] [locationid] <value>

All searches are case insensitive.

`postcode`, `username` and `name` match on any like the value (contains).

`nmdsid` and `locationid` match on value alone (equal).

## Config
### ENV vars
All mandatory:
* `NODE_ENV` - details which of the envrionment specific config definitions (yaml) to pickup
* `STRAPI_BASE_URL` - the base url for the STRAPI search backend
* `TOKEN_SECRET` - this is the JWT token secret used to create ASC WDS JWT for access ASC WDS APIs and for verifying inbound requests from AWS WDS
* `SLACK_SIGNING_SECRET` - this comes from "My Slack Apps" - `Basic Information::Signing Secret`
* `FIND_SLACK_TOKEN` - this comes from "My Slack Apps" - `OAuth & Permissions::OAuth Access Token`
* `SEARCH_STRAPI_PASSWORD` - this is the password used to login to strapi to generate API JWT, and matches the env specific yaml `app.search.strapiUsername`

To use ENV vars on command line:
* Windows -> set SEARCH_STRAPI_PASSWORD=xxxxx
* Linux -> SEARCH_STRAPI_PASSWORD=xxxxx

To set ENV vars with pm2 `ecosystem.config.js` propery file:
```
module.exports = {
  apps: [
    {
      name: '....',
      cwd: '....',
      script: 'node',
      args: 'server',
      env: {
        NODE_ENV: 'production',
        TOKEN_SECRET : '********',
        SLACK_SIGNING_SECRET:'paste you My Slack Apps signed secret here',
        SEARCH_STRAPI_PASSWORD:'your strapi api user's password here',
        FIND_SLACK_TOKEN:'paste you My Slack Apps OAuth Access Token here'
      },
    },
  ],
};
```

## From Postman, Curl and other Test Clients

The Slack message is a POST of type application/x-www-form-urlencoded.
To grab the body to verify the token I had to make changes to the decoding orders.
NB: sending application/json does not decode correctly.

## examples
* `/asc-search postcode SE19`
* `/asc-search postcode SE19 3SS`
* `/asc-search nmds 489`
* `/asc-search name jack`
* `/asc-search name blue`
* `/asc-search username jack`
* `/asc-search username green`

* `/asc-approve-example`

## Dependencies


## via ngrok proxy
ngrok http 3000

# TODO
* verify slack messages using signed secret - from config