const fs = require("fs")
const path = require('path')
const aws = require('aws-sdk');

const BUCKET_NAME = 'reports.verilaft.com';
const IAM_USER_KEY = 'AKIAUQUAZHWF4AFJKHO2';
const IAM_USER_SECRET = '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';

async function init (fileName) {

  console.log('Subiendo pdf***');

  const s3bucket = new aws.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    Bucket: BUCKET_NAME
  })

  var pdfBuffer = fs.readFileSync(path.resolve(`${__dirname}/../../pdfs/${fileName}`));

  console.log('pdfBuffer:',pdfBuffer);
  await s3bucket.createBucket()

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: pdfBuffer
  };

  let data;
  try {
    data = await s3bucket.upload(params).promise()
  } catch(err) {
    console.log('error in callback');
    console.log(err);
    return { err: 'error uploading pdf'}
  }

  return {
    url: data.Location
  }
}

module.exports = init
