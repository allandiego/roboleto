const google = require('googleapis').google
const sheets = google.sheets({ version: 'v4' })
const authClient = require('./google-auth.js')
const fs = require('fs')
const CONFIG_PATH = './config/configuration.json'

async function robot(extractedFilesData) {
  const {googleSheet} = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  await authenticateWithOAuth()
  const sheetData = await formatExtractedData(extractedFilesData)
  await updateSheet(sheetData, googleSheet)

  async function authenticateWithOAuth() {
    const OAuthClient = await authClient.getAuthenticatedClient()
    await setGlobalGoogleAuthentication(OAuthClient)
    function setGlobalGoogleAuthentication(OAuthClient) {
      google.options({
        auth: OAuthClient
      })
    }
  }

  async function formatExtractedData(extractedFilesData) {
    const sheetData = []
    for (let file of extractedFilesData) {
      //console.log(`File: ${file.fileName}`)
      for (let dataRow of file.data) {
        sheetData.push([
          dataRow.expirationDate,
          `'${dataRow.bankCode}`,//force sheet toString
          dataRow.value,
          `'${dataRow.barcode}`, //force sheet toString
          dataRow.description,
          file.fileName,
          dataRow.barcodeRaw
        ])
      }
    }
    return sheetData
  }

  //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
  async function updateSheet(sheetData, googleSheet) {
    console.log(`> [google-sheets]: Updating sheet (${googleSheet.sheetName}): ${googleSheet.spreadsheetId}`)
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: googleSheet.spreadsheetId,
        range: `${googleSheet.sheetName}!A:G`,
        valueInputOption: 'USER_ENTERED', //RAW (no parse) | USER_ENTERED (parsed)
        resource: {
          values: sheetData
        }
      })
      console.log(`> [google-sheets]: Rows updated: ${response.data.updates.updatedRows}`)
      console.log('> [google-sheets]: Done!')
    } catch (e) {
      throw e
    }
  }

}

module.exports = robot
