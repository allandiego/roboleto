const path = require('path')
const fs = require('fs')
const PDF2Json = require("pdf2json")
const CONFIG_PATH = './config/configuration.json'

async function robot() {
  const {appConfig} = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  const filesList = await getFilesListFromFolder(appConfig.downloadPath)
  const pdfData = await fetchFilesData(filesList)
  return pdfData

  async function getFilesListFromFolder(folderPath) {
    const pdfFiles = []
    fs.readdirSync(folderPath).forEach(file => {
      pdfFiles.push({
        fileName: file,
        filePath: path.resolve(__dirname, `../${folderPath}`, file)
      })
    })
    return pdfFiles
  }

  async function fetchFilesData(filesList) {
    console.log(`> [pdf-extractor]: Extracting PDF data from (${appConfig.downloadPath}):`)
    const pdfData = []
    for (let fileData of filesList) {
      console.log(`> [pdf-extractor]:  ${fileData.fileName}`)
      pdfData.push({
        fileName: fileData.fileName,
        data: await ExtractPdfData(fileData.filePath)
      })
    }
    return pdfData
  }

  async function ExtractPdfData(filePath) {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDF2Json(this,1)
      pdfParser.on("pdfParser_dataError", errData => console.error(`> [pdf-extractor]: ERROR: ${errData.parserError}`) )

      pdfParser.on("pdfParser_dataReady", pdfData => {
        const regexBarcode = /(\d{3})(9\d{1}.\d{5})\s{0,1}(\d{5}.\d{6})\s{0,1}(\d{5}.\d{6})\s{0,1}(\d{1})\s{0,1}(\d{4})(\d{10})/gm
        //const regexDescription = /Cedente\s{0,1}/gm
        const rawText = pdfParser.getRawTextContent()
        const matches = rawText.match(regexBarcode)
        const barcodeData = []
        //match.forEach((matchBarcode, groupIndex) => { console.log(`Group ${groupIndex}: ${matchBarcode}`) })
        if (matches !== null) {
          for (match of matches) {
            const barcode = sanitizeBarcode(match)
            //check duplicated before push
            if (barcodeData.map((arr) => { return arr.barcode }).indexOf(barcode) < 0) {
              barcodeData.push({
                barcodeRaw: match,
                barcode: barcode,
                bankCode: barcode.substr(0, 3),
                expirationDate: parseDate(barcode.substr(-14, 4)),
                value: parseValue(barcode.substr(-10)),
                description: ''
              })
            }
          }
        }
        resolve(barcodeData)
      })
      pdfParser.loadPDF(filePath)
    })
  }

  function sanitizeBarcode(barcode) {
    return barcode.replace(/[^0-9]/gm, '')
  }

  function parseDate(days) {
    const baseDate1 = new Date(2000, (7-1), 3) //03/07/2000 month start on 0
    const baseDate2 = new Date(2025, (2-1), 22) //22/02/2025 month start on 0
    const now = new Date()

    if (now < baseDate2) {
      //before 22/02/2025
      baseDate1.setDate(baseDate1.getDate() + (parseInt(days)-1000)) // -1000 days bank factor base date table
      return `${baseDate1.getDate()}/${baseDate1.getMonth()+1}/${baseDate1.getFullYear()}`
    } else {
      //after 22/02/2025
      baseDate2.setDate(baseDate2.getDate() + (parseInt(days)-1000))
      return `${baseDate2.getDate()}/${baseDate2.getMonth()+1}/${baseDate2.getFullYear()}`
    }
  }

  function parseValue(value) {
    return parseFloat(`${value.substr(0, value.length-2)}.${value.substr(-2, 2)}`)
  }
}

module.exports = robot
