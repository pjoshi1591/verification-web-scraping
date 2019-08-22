const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')
var anticaptcha = require('../anticaptcha')('260677347c416618dfff97b85785b35b')

async function init (user) {

  return new Promise(async (resolve, reject) => {

    try {
      console.log('policia-nacional');
      const userName = user.name
      const lastName = user.surname
      const website = 'https://antecedentes.policia.gov.co:7005/WebJudicial/antecedentes.xhtml'

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
            waitUntil: ['domcontentloaded', 'load'],
            timeout: 45000
          })
          console.log('-> Pagina cargada GOOD BREAK !!');
          break
        } catch (err) {
          console.log('-> Página tarda mucho en cargar (45s), intento ' + tryLoad+1 + '/' + totalLoadTries.length + '!!');
          console.log('***Recargar pagina, e intentar nuevamente');
        }
      }

      let totalNumberTries = [1,2,3,4,5,6,7,8,9,10]
      for (const tryNumber in totalNumberTries) {
        console.log('***Confirmar carga de web')
        const agreeButtonSelector = '#aceptaOption > tbody > tr > td:nth-child(1) > label'
        await page.waitForSelector(agreeButtonSelector);
        await page.waitForSelector('#continuarBtn');

        console.log('***Acceder a formulario')
        console.log('***Click botón aceptar terminos');
        await page.waitFor(5000)
        const coso = await page.click(agreeButtonSelector)
        console.log('**Aceptar fomulario de terminos**');
        try {
          await page.waitForFunction('document.getElementById("continuarBtn").getAttribute("aria-disabled") === "false"', {timeout: 20000})
          console.log('->Botón aceptar habilitado GOOD BREAK !!');
          break
        } catch (err) {
          console.log('->Botón aceptar INHABILITADO, intento ' + tryNumber+1 + '/' + totalNumberTries.length + '!!');
          console.log('***Recargar pagina, e intentar nuevamente');
          await page.evaluate(() => {
             location.reload(true)
          })
        }
      }

      console.log('waitfun-continuarBtn:')
      await page.click('#continuarBtn')

      console.log('***Confirmar carga de formulario')
      await page.waitForSelector('#cedulaInput');
      await page.waitForSelector('#cedulaTipo');
      await page.waitForSelector('#textcaptcha');
      await page.waitForSelector('#capimg');
      await page.waitFor(3000)

      console.log('***Llenar formulario')
      await page.type('#cedulaInput', user.id_number)
      const imageCaptchaSelector = await page.$('#capimg')
      const imageCaptcha = await imageCaptchaSelector.screenshot({encoding: 'base64'})

      console.log('***anticaptcha');
      anticaptcha.getBalance(async function (err, balance) {
        if (err) {
          return reject(err)
        }

        if (balance > 0) {
          anticaptcha.createImageToTextTask({
                case: true,
                body: imageCaptcha
            }, async function (err, taskId) {
            if (err) {
              return reject(err)
            }

            anticaptcha.getTaskSolution(taskId, async function (err, taskSolution) {
              if (err) {
                return reject(err)
              }
              console.log('anticaptcha-taskSolution:', taskSolution)

              await page.type('#textcaptcha', taskSolution)
              await page.click('#j_idt20')

              console.log('***Comprobar resultados')
              await page.waitForSelector('#form\\:j_idt9_content');
              await page.evaluate(() => { document.querySelector('.preloader').style.display = 'none'; });
              const html = await page.content()
              const htmlOnlyText = html.replace(/<[^>]*>?/gm, '')
              const nameRegex = new RegExp('NO TIENE ASUNTOS PENDIENTES CON LAS AUTORIDADES JUDICIALES', 'gi')
              let found = htmlOnlyText.match(nameRegex)
              if (!found) found = []
              const defaultFoundQuantity = 2
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
              const image =  user.id_number + '-policia-nacional-' + moment().format('DD-MM-YYYY') + '.png'
              await page.screenshot({
                fullPage: true,
                path: path.resolve(`${__dirname}/../../images/${image}`)
              })

              console.log('***Cerrar browser')
              await browser.close()

              return resolve({
                name: 'Policia',
                web: 'policia-nacional',
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
        name: 'Policia',
        web: 'policia-nacional',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
