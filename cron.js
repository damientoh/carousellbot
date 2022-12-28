const cron = require('node-cron')
const Notifier = require('./class/Notifier')

const notifier = new Notifier()

notifier
	.initialize()
	.then(() => {
		cron.schedule('*/30 * * * * *', async () => {
			await notifier.activateScrapers()
		})
	})
	.catch(error => {
		throw error
	})

module.exports = cron
