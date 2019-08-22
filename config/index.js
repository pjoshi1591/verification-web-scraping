import common from './common/common'

const env = process.env.NODE_ENV || 'development'
const config = require(`./common/${env}`).default

export default Object.assign({}, common, config)
