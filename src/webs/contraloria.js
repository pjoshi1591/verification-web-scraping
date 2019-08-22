const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')
var anticaptcha = require('../anticaptcha')('260677347c416618dfff97b85785b35b')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('contraloria');
      const userName = user.name
      const lastName = user.surname
      const website = 'https://cfiscal.contraloria.gov.co/SiborWeb/Certificados/CertificadoPersonaNatural.aspx'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      const downloadPath = path.resolve(`${__dirname}/../../pdf-server/web/`)
      await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      })

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'networkidle0' })

      console.log('***Confirmar carga de web')
      await page.waitForSelector('#ddlTipoDocumento');
      await page.waitForSelector('#txtNumeroDocumento');
      await page.waitForSelector('#MainContent_recaptcha');

      console.log('***Llenar formulario')
      await page.select('#ddlTipoDocumento', '1')
      await page.type('#txtNumeroDocumento', user.id_number)
      await page.evaluate(() => { document.querySelector('#g-recaptcha-response').style = ''; });

      console.log('***anticaptcha');
      anticaptcha.setWebsiteURL("https://cfiscal.contraloria.gov.co/SiborWeb/Certificados/CertificadoPersonaNatural.aspx");
      anticaptcha.setWebsiteKey("6LcfnjwUAAAAAIyl8ehhox7ZYqLQSVl_w1dmYIle");


      anticaptcha.getBalance(async function (err, balance) {
        if (err) {
          return reject(err)
        }

        if (balance > 0) {
          anticaptcha.createTaskProxyless(async function (err, taskId) {
            if (err) {
              return reject(err)
            }

            anticaptcha.getTaskSolution(taskId, async function (err, taskSolution) {
              if (err) {
                return reject(err)
              }
              console.log('anticaptcha-taskSolution:', taskSolution)

              await page.type('#g-recaptcha-response', taskSolution)
              await page.click('#btnBuscar')

              console.log('Esperar descarga pdf 5 segundos...')
              await page.waitFor(5000);

              await page.goto('http://127.0.0.1:8080/web/viewer.html?file=' + user.id_number + '.pdf', { waitUntil: ['networkidle0', 'networkidle2', 'domcontentloaded', 'load'] })

              await page.click('#viewFind')
              await page.type('#findInput', 'NO SE ENCUENTRAREPORTADO COMO RESPONSABLE FISCAL')

              console.log('***Comprobar resultados pdf')
              await page.waitFor(3000);
              const searchResultsText =  await page.evaluate(() => document.getElementsByClassName('highlight') )
              const isEmptyObjectResults = Object.entries(searchResultsText).length === 0 && searchResultsText.constructor === Object

              console.log('***Resultado final:')
              let isUserSafe = false
              if (isEmptyObjectResults) {
                isUserSafe = false
                console.log('💀 PERSONA ENCONTRADA ')
              } else {
                isUserSafe = true
                console.log('💚 PERSONA LIMPIA')
              }

              console.log('***Tomar screenshot')
              const image =  user.id_number + '-contraloria-' + moment().format('DD-MM-YYYY') + '.png'
              await page.screenshot({
                fullPage: true,
                path: path.resolve(`${__dirname}/../../images/${image}`)
              })

              console.log('***Cerrar browser')
              await browser.close()

              return resolve({
                name: 'Contraloria',
                web: 'contraloria',
                isUserSafe: isUserSafe,
                image: image
              })

            });
          });
        }
        else {
          return reject('balance no suficiente')
        }
      })

    } catch (er) {
      return {
        name: 'Contraloria',
        web: 'contraloria',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
