const cron = require('node-cron')
const Notifier = require('./class/Notifier')

const notifier = new Notifier()
const CategoryGetter = require('./class/CategoryGetter')
CategoryGetter.refreshCategories()
	.then(() => notifier.initialize())
	.then(() => {
		cron.schedule('*/10 * * * * *', async () => {
			await notifier.activateScrapers()
		})
		console.log('Initialized successfully')
	})
	.catch(error => console.log(error.message))

module.exports = cron
