# ASC WDS Slack "Internal Admin" app

## commands
* /asc-search [postcode] [nmdsid] [name] [username] <value>

## Config
The default username is in env config but please set the password in env;

Windows -> set SEARCH_STRAPI_PASSWORD=xxxxx
Linux -> export set SEARCH_STRAPI_PASSWORD=xxxxx

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