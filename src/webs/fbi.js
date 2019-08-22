const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('fbi')
      const userName = user.name
      const lastName = user.surname
      const fullName = userName + ' ' + lastName
      const website = 'https://www.fbi.gov/wanted/fugitives'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'networkidle0' })

      console.log('***Confirmar carga de web')
      await page.waitForSelector('#fbi-search')
      await page.waitForSelector('#navbar-collapse-1 button')

      console.log('***Llenar formulario')
      await page.type('#fbi-search', fullName)
      await page.click('#navbar-collapse-1 button')

      console.log('***Confirmar carga de resultados')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })

      console.log('***Comprobar resultados')
      const html = await page.content()
      const htmlOnlyText = html.replace(/<[^>]*>?/gm, '')
      const nameRegex = new RegExp(fullName, 'gi')
      let found = htmlOnlyText.match(nameRegex)
      if (!found) found = []
      const defaultFoundQuantity = 0
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
      const image =  user.id_number + '-fbi-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: false,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Fbi',
        web: 'fbi',
        isUserSafe: 'isUserSafe',
        image: image
      })

    } catch (er) {
      return {
        name: 'Fbi',
        web: 'fbi',
        error: 'No se pudo terminar el proceso'
      }
    }

  })
}

module.exports = init
