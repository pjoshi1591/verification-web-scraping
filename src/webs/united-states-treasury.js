const puppeteer = require('puppeteer')
const moment = require('moment')
const fs = require("fs")
const request = require("request-promise-native")
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('united-states-treasury')
      const userName = user.name
      const lastName = user.surname
      const website = 'https://www.treasury.gov/ofac/downloads/sdnlist.pdf'
      const pdfServerLocal = 'http://127.0.0.1:8080/web/viewer.html?file='
      const pdfFileName = 'united-states-treasury.pdf'

      async function downloadPDF(pdfURL, outputFilename) {
          console.log('Downloading pdf file...')
          let pdfBuffer = await request.get({uri: pdfURL, encoding: null})
          console.log("Writing downloaded PDF file to " + outputFilename + "...")
          fs.writeFileSync(outputFilename, pdfBuffer)
      }
      await downloadPDF(website, path.resolve(`${__dirname}/../../pdf-server/web/${pdfFileName}`))

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', pdfServerLocal + pdfFileName)
      await page.goto(pdfServerLocal + pdfFileName, { waitUntil: ['networkidle0', 'networkidle2', 'domcontentloaded', 'load'] })

      console.log('***Comprobar resultados pdf')
      const searchQuery = `${lastName}, ${userName}`
      await page.click('#viewFind')
      await page.type('#findInput', searchQuery)
      await page.waitForFunction('document.getElementById("findInput").getAttribute("data-status") === ""')
      const searchResultsText =  await page.evaluate(() => document.getElementsByClassName('highlight') )
      const isEmptyObjectResults = Object.entries(searchResultsText).length === 0 && searchResultsText.constructor === Object

      console.log('***Resultado final:')
      let isUserSafe = false
      if (!isEmptyObjectResults) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-united-states-treasury-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: true,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Ofac',
        web: 'united-states-treasury',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Ofac',
        web: 'united-states-treasury',
        error: 'No se pudo terminar el proceso'
      }
    }

  })
}

module.exports = init
