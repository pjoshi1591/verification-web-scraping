/*
  Nota: No toma imagen en screnshoot fullPage:true, por ser muy grande la web.
*/

const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('the-world-bank');
      const userName = user.name
      const lastName = user.surname
      const website = 'http://www.worldbank.org/en/projects-operations/procurement/debarred-firms'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      let totalLoadTries = [1,2,3,4,5,6,7,8,9,10]
      for (const tryLoad in totalLoadTries) {
        console.log('***Ingresar a: ', website)
        try {
          await page.goto(website, {
            waitUntil: ['networkidle0', 'networkidle2', 'domcontentloaded', 'load'],
            timeout: 45000
          })
          console.log('-> Pagina cargada GOOD BREAK !!');
          break
        } catch (err) {
          console.log('-> Página tarda mucho en cargar (45s), intento ' + tryLoad+1 + '/' + totalLoadTries.length + '!!');
          console.log('***Recargar pagina, e intentar nuevamente');
        }
      }

      console.log('***Confirmar carga de web')
      await page.waitForSelector('#category');
      await page.waitForFunction(
        'document.querySelector(".k-grid-content.k-auto-scrollable") != null'
      );

      const defaultTableResultsHeight = await page.evaluate(() => document.querySelector('.k-grid-content.k-auto-scrollable').offsetHeight)

      console.log('***Llenar formulario')
      await page.type('#category', userName + ' ' + lastName)

      console.log('***Confirmar carga de resultados')
      await page.waitForFunction(
        'document.querySelector(".k-grid-content.k-auto-scrollable").offsetHeight != ' + defaultTableResultsHeight
      );

      console.log('***Comprobar resultados')
      const finalTableResultsHeight = await page.evaluate(() => document.querySelector('.k-grid-content.k-auto-scrollable').offsetHeight)

      console.log('***Resultado final:')
      let isUserSafe = false
      if (finalTableResultsHeight > 0) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-the-world-bank-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: false,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Bancomundial',
        web: 'the-world-bank',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Bancomundial',
        web: 'the-world-bank',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
