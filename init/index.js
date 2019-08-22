const glob = require('glob')
const to = require('await-to')
const moment = require('moment')
const people =  require('../people-test.json')
const path = require('path')
const pdfCreator = require(path.resolve(`${__dirname}/../src/pdf`))
const updloader = require(path.resolve(`${__dirname}/../src/uploader`))
const nedb = require('nedb')
const db = new nedb({ filename: 'storage.txt', autoload: true })


function find(db, opt) {
  return new Promise(function(resolve, reject) {
    db.find(opt, function(err, doc) {
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}
function findOne(db, opt) {
  return new Promise(function(resolve, reject) {
    db.findOne(opt, function(err, doc) {
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}
function insert(db, opt) {
  return new Promise(function(resolve, reject) {
    db.insert(opt, function(err, doc) {
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}
function remove(db, opt) {
  return new Promise(function(resolve, reject) {
    db.remove(opt, {}, function(err, doc) {
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}
const saveEvidence = async (id, evidence) => {
  const filter = {
    id: id,
    web: evidence.web
  }
  const findOneResult = await findOne(db, filter)

  if (!findOneResult) {
    evidence.id = id
    const insertResult = await insert(db, evidence)
  } else {
    const removeResult = await remove(db, filter)
    evidence.id = id
    const insertResult = await insert(db, evidence)
  }
}


glob(path.resolve(`${__dirname}/../src/webs/*`), { ignore: '/index.js' }, async (err, matches) => {
  if (err) { throw err }

  console.log('***WEB: ', process.env.WEB)
  const selectedWeb = process.env.WEB

  let pdfResults = {}
  let webs = []
  matches.forEach(async (mod) => {
    const router = require(`${mod}`)
    webs.push(router)
  })

  for (const peopleIndex in people) {

    const person = people[peopleIndex]
    pdfResults[person.id_number] = []
    console.log('***Person:')
    console.log(person)

    if (!selectedWeb) {
      for (const websIndex in webs) {
        const web = webs[websIndex]

        let { data: response, err } = await to(web(person))
        if (err) {
          response = err
        }

        await saveEvidence(person.id_number, response)

        pdfResults[person.id_number].push(response)
      }

      const pdfResult = pdfResults[person.id_number]
      console.log('pdfResult:',pdfResult)
      person.status = 'GOOD'
      pdfResult.forEach(result => {
        result.status = result.isUserSafe ? 'GOOD' : 'BAD'
        if (!result.isUserSafe) {
          person.status = 'BAD'
        }
      })
      const creatorResponse = await pdfCreator(pdfResult, person)

      const pdfUrl = await updloader(creatorResponse.fileName)
      console.log('pdfUrl:', pdfUrl.url)

    } else {

      const websites = [
        'alqaeda',
        'bidd',
        'bank-of-england',
        'contraloria',
        'dea',
        'fbi',
        'interpol',
        'onu',
        'policia-nacional',
        'procuraduria',
        'the-world-bank',
        'united-states-treasury',
        'pdf',
        'upload'
      ]
      const websiteFound = websites.indexOf(selectedWeb)

      if (websiteFound == -1) {
        return console.log('WEB Solicitada no existe, intente nuevamente')
      }

      if (websiteFound <= 11) {
        console.log('Ejecutando Script:', selectedWeb)

        const selectedWebFn = require(`../src/webs/${selectedWeb}`)
        const webResponse = await selectedWebFn(person)
        await saveEvidence(person.id_number, webResponse)

      } else if (selectedWeb === 'pdf') {
        console.log('Ejecutando Script:', selectedWeb)

        const pdfResult = await find(db, {id: person.id_number})
        console.log('pdfResult:',pdfResult)
        person.status = 'GOOD'
        pdfResult.forEach(result => {
          result.status = result.isUserSafe ? 'GOOD' : 'BAD'
          if (!result.isUserSafe) {
            person.status = 'BAD'
          }
        })
        const creatorResponse = await pdfCreator(pdfResult, person)
        console.log('Pdf creado:', creatorResponse)

      } else if (selectedWeb == 'upload') {
        console.log('Ejecutando Script:', selectedWeb)

        const fileName = `${person.id_number}-${moment().format('DD-MM-YYYY')}.pdf`
        console.log('Buscando y subiendo archivo: ', fileName)

        const pdfUrl = await updloader(fileName)
        console.log('pdfUrl:', pdfUrl.url)

      }

    }

  }

})
