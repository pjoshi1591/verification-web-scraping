const puppeteer = require('puppeteer')
const moment = require('moment')
const path = require('path')

async function init (user) {

  const getAnswer = (user, captchaQuestion) => {
    const question1 = '¿Escriba las tres primeras letras del primer apellido de la persona a la cual esta expidiendo el certificado?'
    const question2 = '¿Escriba las tres ultimas letras del primer apellido de la persona a la cual esta expidiendo el certificado?'
    const question3 = '¿Escriba la cantidad de letras del primer apellido de la persona a la cual esta expidiendo el certificado?'
    const question4 = '¿Cual es el primer apellido de la persona a la cual esta expidiendo el certificado?'
    // Esta pregunta no funciona aunque se responda correctamente
    // const question5 = '¿Escriba la cantidad de letras del primer nombre de la persona a la cual esta expidiendo el certificado?'
    const question6 = '¿Escriba los tres primeros digitos del documento a consultar?'
    const question7 = '¿Escriba los tres ultimos digitos del documento a consultar?'
    const question8 = '¿Escriba las dos primeras letras del primer nombre de la persona a la cual esta expidiendo el certificado?'
    const question9 = '¿Escriba las dos ultimas letras del primer nombre de la persona a la cual esta expidiendo el certificado?'
    const question10 = '¿Escriba los dos primeros digitos del documento a consultar'
    const question11 = '¿Escriba los dos ultimos digitos del documento a consultar?'
    const question12 = '¿Cual es el primer nombre de la persona a la cual esta expidiendo el certificado?'
    const question13 = '¿Número de colores en la bandera de Colombia?'
    const question14 = '¿Escriba las dos ultimas letras del primer apellido de la persona a la cual esta expidiendo el certificado?'
    const question15 = '¿ Cual es la Capital de Antioquia (sin tilde)?'
    const question16 = '¿ Cual es la Capital de Colombia (sin tilde)?'
    const question17 = '¿ Cual es la Capital del Atlantico?'
    const question18 = '¿ Cuanto es 3 X 3 ?'
    const question19 = '¿ Cuanto es 2 X 3 ?'

    let answer = ''
    const userName = user.name
    const lastName = user.surname
    const lastNames = lastName.split(' ');
    const firstLastName = lastNames[0]
    const names = userName.split(' ');
    const firstName = names[0]

    switch(captchaQuestion) {
      case question1:
        answer = lastName.substring(0,2)
      break;
      case question2:
        answer = firstLastName.substring(firstLastName.length - 3, firstLastName.length)
      break;
      case question3:
        answer = firstLastName.length
      break;
      case question4:
        answer = firstLastName
      break;
      // case question5:
      //   answer = firstName.length
      // break;
      case question6:
        answer = user.id_number.substring(0,3)
      break;
      case question7:
        answer = user.id_number.substring(user.id_number.length - 3, user.id_number.length)
      break;
      case question8:
        answer = userName.substring(0,2)
      break;
      case question9:
        answer = firstName.substring(firstName.length - 2, firstName.length)
      break;
      case question10:
        answer = user.id_number.substring(0,2)
      break;
      case question11:
          answer = user.id_number.substring(user.id_number.length - 2, user.id_number.length)
      break;
      case question12:
        answer = firstName
      break;
      case question13:
        answer = 3
      break;
      case question14:
        answer = firstLastName.substring(firstLastName.length - 2, firstLastName.length)
      break;
      case question15:
        answer = 'Medellin'
      break;
      case question16:
        answer = 'Bogota'
      break;
      case question17:
        answer = 'Barranquilla'
      break;
      case question18:
        answer = '9'
      break;
      case question19:
        answer = '6'
      break;
      default:
        console.log('-->NO ES NINGUNA DE LAS PREGUNTAS PREDEFINIDAS<--');
    }

    return answer
  }

  return new Promise(async (resolve, reject) => {

    try {
      console.log('procuraduria');
      const userName = user.name
      const lastName = user.surname
      const website = 'https://www.procuraduria.gov.co/CertWEB/Certificado.aspx?tpo=1'

      console.log('***Inicializar browser')
      const browser = await puppeteer.launch({
        headless: true
      })
      const page = await browser.newPage()
      await page.setViewport({width: 1280, height: 1000})

      console.log('***Ingresar a: ', website)
      await page.goto(website, { waitUntil: 'networkidle0' })

      let answer = ''
      let totalNumberTries = [1,2,3,4,5,6,7,8,9,10]
      for (const tryNumber in totalNumberTries) {

        console.log('***Confirmar carga de web')
        await page.waitForSelector('#ddlTipoID');
        await page.waitForSelector('#txtNumID');
        await page.waitForSelector('#txtRespuestaPregunta');
        await page.waitForSelector('#btnConsultar');

        console.log('***Llenar formulario')
        await page.select('#ddlTipoID', '1')
        await page.type('#txtNumID', user.id_number)
        let captchaQuestion = await page.evaluate(() => document.querySelector('#lblPregunta').innerText)
        answer = getAnswer(user, captchaQuestion)

        console.log(tryNumber + '-captchaQuestion:',captchaQuestion);
        console.log(tryNumber + '-answer:',answer);

        if (answer) {
          break
        } else {
          console.log('***Recargar pagina, e intentar nuevamente');
          await page.evaluate(() => {
             location.reload(true)
          })
        }
      }

      await page.type('#txtRespuestaPregunta', answer)
      await page.click('#btnConsultar')

      console.log('***Comprobar resultados')
      await page.waitForSelector('.datosConsultado');

      const html = await page.content()
      const htmlOnlyText = html.replace(/<[^>]*>?/gm, '')
      const nameRegex = new RegExp('El ciudadano no presenta antecedentes', 'gi')
      let found = htmlOnlyText.match(nameRegex)
      if (!found) found = []
      const foundQuantity = found.length

      console.log('***Resultado final:')
      let isUserSafe = false
      if (!foundQuantity) {
        isUserSafe = false
        console.log('💀 PERSONA ENCONTRADA ')
      } else {
        isUserSafe = true
        console.log('💚 PERSONA LIMPIA')
      }

      console.log('***Tomar screenshot')
      const image =  user.id_number + '-procuraduria-' + moment().format('DD-MM-YYYY') + '.png'
      await page.screenshot({
        fullPage: true,
        path: path.resolve(`${__dirname}/../../images/${image}`)
      })

      console.log('***Cerrar browser')
      await browser.close()

      return resolve({
        name: 'Procuraduria',
        web: 'procuraduria',
        isUserSafe: isUserSafe,
        image: image
      })

    } catch (er) {
      return {
        name: 'Procuraduria',
        web: 'procuraduria',
        error: 'No se pudo terminar el proceso'
      }
    }

  });
}

module.exports = init
