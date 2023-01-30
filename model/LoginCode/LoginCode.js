const mongoose = require('mongoose')
const schemaFields = require('./schemaFields')

const LoginCodeSchema = new mongoose.Schema(schemaFields)
const LoginCode = mongoose.model('LoginCode', LoginCodeSchema)

module.exports = LoginCode
