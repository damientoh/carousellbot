const cron = require('node-cron')
const Notifier = require('./class/Notifier')

const CategoryGetter = require('./class/CategoryGetter')
CategoryGetter.refreshCategories()
	.then(() => {
		return Notifier.initialize()
	})
	.then(() => {
		cron.schedule('*/10 * * * * *', async () => {
			await Notifier.activateScrapers()
		})
		console.log('Initialized successfully')
	})
	.catch(error => console.log(error.message))

module.exports = cron
