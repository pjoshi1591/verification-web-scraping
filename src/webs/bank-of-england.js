const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('bank-of-england');
      const userName = user.name
      const lastName = user.surname
      const fullName = userName + ' ' + lastName
      const website = 'https://www.bankofengland.co.uk/'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'domcontentloaded' })

      console.log('***Confirmar carga de web')
      await page.waitForSelector('#SearchTerm');
      await page.waitForSelector('.search-widget-btn')

      console.log('***Llenar formulario')
      await page.type('#SearchTerm', fullName)
      await page.click('.search-widget-btn')

      page.waitForNavigation({ waitUntil: 'domcontentloaded' })

      console.log('***Comprobar resultados')
      let resultSelector = '#cludo-search-results > div.search-results-container > div.search-result-count.col12 > b:nth-child(2)'
      await page.waitForSelector(resultSelector)

      const html = await page.content()
      const htmlOnlyText = html.replace(/<[^>]*>?/gm, '')
      const nameRegex = new RegExp(fullName, 'gi')
      let found = htmlOnlyText.match(nameRegex)
      if (!found) found = []
      const defaultFoundQuantity = 1
      const foundQuantity = found.length

      console.log('***Resultado final:')
      let isUserSafe = false
      if (foundQuantity > defaultFoundQuantity) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-bank-of-england-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: true,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Bancodeinglaterra',
        web: 'bank-of-england',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Bancodeinglaterra',
        web: 'bank-of-england',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
