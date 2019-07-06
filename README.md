# ASC WDS Slack "Internal Admin" app

## commands
* /asc-search [postcode] [nmdsid] [name] [username] <value>

## examples
* `/asc-search postcode SE19`
* `/asc-search postcode SE19 3SS`
* `/asc-search nmds 489`
* `/asc-search name jack`
* `/asc-search name blue`
* `/asc-search username jack`
* `/asc-search username green`


## Dependencies
* https://github.com/slackapi/node-slack-interactive-messages

## via ngrok proxy
ngrok http 3000

# TODO
* verify slack messages using signed secret - from config