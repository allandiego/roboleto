const fs = require('fs')
const {google} = require('googleapis')
const readline = require('readline')
const opn = require('opn')

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/spreadsheets'
]
const TOKEN_PATH = './credentials/google-token.json'
const KEYS_PATH = './credentials/credentials.json'

async function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
      const {
        installed:{client_secret},
        installed:{client_id},
        installed:{redirect_uris}
      } = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'))
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      )
      if (fs.existsSync(TOKEN_PATH)) {
          const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
          oAuth2Client.setCredentials(tokens)
          console.info(`> [google-auth]: Tokens retrieved from ${TOKEN_PATH}.`)
          resolve(oAuth2Client)
      } else {
        // Generate the url that will be used for the consent dialog.
        const authorizationUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        })
        //code asking interface
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        })
        //open authorization url in borwser
        console.info(`> [google-auth]: Opening Browser authorization url (${authorizationUrl})`)
        opn(authorizationUrl)
        rl.question('> [google-auth]: Enter the code from that page here: ', (code) => {
          rl.close()
          oAuth2Client.getToken(code).then(response => {
            oAuth2Client.setCredentials(response.tokens)
            console.info(`> [google-auth]: Creating token file (${TOKEN_PATH})`)
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(response.tokens))
            console.info('> [google-auth]: Tokens acquired.')
            resolve(oAuth2Client)
          })
        })
      }
    })
}

module.exports = {
  getAuthenticatedClient
}
