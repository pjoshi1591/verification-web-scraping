const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('interpol');
      const userName = user.name
      const lastName = user.surname
      const website = 'https://www.interpol.int/How-we-work/Notices/View-Red-Notices'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'networkidle0' })

      console.log('***Confirmar carga de web')
      await page.waitForSelector('#name');
      await page.waitForSelector('#forename');
      await page.waitForSelector('#submit')
      await page.waitForSelector('#searchResults')
      const totalResultsQuantity = await page.evaluate(() => document.querySelector('#searchResults').innerText)

      console.log('***Llenar formulario')
      await page.type('#name', userName)
      await page.type('#forename', lastName)
      await page.click('#submit')

      //  Como el checador de navegacion no funciona por ser la misma URL,
      //  reviso que cambie la cantidad de resultados encontrados para proseguir
      console.log('***Confirmar carga de resultados')
      await page.waitForFunction(
        'document.querySelector("#searchResults").innerText != ' + totalResultsQuantity
      );

      console.log('***Comprobar resultados')
      await page.waitForSelector('#searchResults')
      const searchResultsText = await page.evaluate(() => document.querySelector('#searchResults').innerText)
      const resultsQuantity = Number(searchResultsText)

      console.log('***Resultado final:')
      let isUserSafe = false
      if (resultsQuantity > 0) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-interpool-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: false,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Interpol',
        web: 'interpol',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Interpol',
        web: 'interpol',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
