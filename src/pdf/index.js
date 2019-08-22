const moment = require('moment')
const pdfPrinter = require('pdfmake');
const fs = require("fs")
const path = require('path')

async function init (results, user) {

  console.log('Creando pdf***');
  return new Promise(async (resolve, reject) => {

    const fonts = {
      Roboto: {
        normal: path.resolve(`${__dirname}/fonts/Roboto-Regular.ttf`),
        bold: path.resolve(`${__dirname}/fonts/Roboto-Medium.ttf`),
        italics: path.resolve(`${__dirname}/fonts/Roboto-Italic.ttf`),
        bolditalics: path.resolve(`${__dirname}/fonts/Roboto-MediumItalic.ttf`)
      }
    };
    const printer = new pdfPrinter(fonts);

    let docDefinition = {
      content: [
        { text: 'Fecha: ' + moment().format('DD/MM/YYYY, h:mm:ss A'), fontSize: 16 },
        { text: 'Nombre: ' + user.name, fontSize: 16 },
        { text: 'Apellido: ' + user.surname, fontSize: 16 },
        { text: 'CI: ' + user.id_number, fontSize: 16 },
        { text: 'Tipo de documento: ' + user.id_type, fontSize: 16 },
        { text: 'Estado general: ' + user.status, fontSize: 16 }
      ]
    };

    results.forEach(result => {
      docDefinition.content.push({ text: '', pageBreak: 'before' })
      docDefinition.content.push({ text: 'Sitio: ' + result.name, fontSize: 16 })
      docDefinition.content.push({ text: 'Estado: ' + result.status, fontSize: 16 })
      docDefinition.content.push({
        image: path.resolve(`${__dirname}/../../images/${result.image}`),
        width: 500
      })
    })

    const options = {}
    const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    const fileName = `${user.id_number}-${moment().format('DD-MM-YYYY')}.pdf`
    pdfDoc.pipe(fs.createWriteStream(path.resolve(`${__dirname}/../../pdfs/${fileName}`)))
    .on('finish', () => {
      return resolve({
        fileName: fileName
      })
    });
    pdfDoc.end();

  })
}

module.exports = init
