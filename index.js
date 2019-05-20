const robots = {
  gmail: require('./src/google-gmail.js'),
  pdfExtractor: require('./src/pdf-extractor.js'),
  spreadsheets: require('./src/google-sheets.js')
}

async function main() {
  console.log(`> [main]: Starting Robots`)
  await robots.gmail()
  const extractedFilesData = await robots.pdfExtractor()
  //console.dir(extractedData, {depth:null})
  await robots.spreadsheets(extractedFilesData)
}

main().catch(console.error);
