const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('bidd');
      const userName = user.name
      const lastName = user.surname
      const fullName = userName + ' ' + lastName
      const website = 'https://www.iadb.org/es/temas/transparencia/integridad-en-el-grupo-bid/empresas-y-personas-sancionadas,1293.html'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'domcontentloaded' })

      console.log('***Confirmar carga de web')
      const inputNameSelector = '#sanctioned-jsGrid table .jsgrid-filter-row > td:nth-child(1) > input[type=text]'
      await page.waitForSelector(inputNameSelector);
      await page.waitForSelector('.jsgrid-search-button')

      console.log('***Llenar formulario')
      await page.type(inputNameSelector, fullName)
      await page.click('.jsgrid-search-button')

      console.log('***Comprobar resultados')
      const html = await page.content()
      const htmlOnlyText = html.replace(/<[^>]*>?/gm, '')
      const nameRegex = new RegExp('Not found', 'gi')
      let found = htmlOnlyText.match(nameRegex)
      if (!found) found = []
      const defaultFoundQuantity = 1
      const foundQuantity = found.length

      console.log('***Resultado final:')
      let isUserSafe = false
      if (foundQuantity !== defaultFoundQuantity) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-bidd-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: false,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Bid',
        web: 'bidd',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Bid',
        web: 'bidd',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
