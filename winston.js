const winston = require('winston')
const { Loggly } = require('winston-loggly-bulk')

winston.add(
	new Loggly({
		token: '9c092b53-bb4d-4f2f-996d-f721fcf16cb9',
		subdomain: 'damienone',
		tags: ['Winston-NodeJS'],
		json: true
	})
)

module.exports = winston
