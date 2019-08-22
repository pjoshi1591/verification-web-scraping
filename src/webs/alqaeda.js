const puppeteer = require('puppeteer')
const moment = require('moment')
const fs = require("fs")
const request = require("request-promise-native")
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('alqaeda')
      const userName = user.name
      const lastName = user.surname
      const lastNames = lastName.split(' ')
      const firstLastName = lastNames[0]
      const names = userName.split(' ')
      const firstName = names[0]
      const website = 'http://hmt-sanctions.s3.amazonaws.com/sanctionsconlist.pdf'
      const pdfServerLocal = 'http://127.0.0.1:8080/web/viewer.html?file='
      const pdfFileName = 'alqaeda.pdf'

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
      const searchQuery = `Name 6: ${firstLastName} 1: ${firstName}`
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
      const image =  user.id_number + '-alqaeda-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: true,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Alqaeda',
        web: 'alqaeda',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Alqaeda',
        web: 'alqaeda',
        error: 'No se pudo terminar el proceso'
      }
    }

  })
}

module.exports = init
