const Notification = require('../model/Notification/Notification')
const ListingScraper = require('../model/ListingScraper/ListingScraper')
const Bot = require('./Bot/Bot')

class Notifier {
	bot
	messageQueue
	scrapingQueue

	constructor() {
		this.bot = new Bot()
	}

	async initialize() {
		await this.bot.startBot()
	}

	async delay(time) {
		return new Promise(resolve => {
			setTimeout(resolve, time)
		})
	}

	async removeSeenBeforeAndUpdateListings(chatId, listings) {
		if (!listings) return

		const notification = await Notification.findByChatId(chatId)
		const seenBeforeIds = notification.seenIds
		const uniqueListings = listings.filter(
			listing => !seenBeforeIds.includes(listing.carousellId)
		)
		const uniqueIds = uniqueListings.map(listing => listing.carousellId)
		await notification.addSeenIds(uniqueIds)

		return uniqueListings
	}

	async activateScrapers() {
		const allScrapers = await ListingScraper.find({})

		for (const scraper of allScrapers) {
			const listings = await scraper.getFirstPageNewListings()
			await scraper.populate('notification')

			for (const notification of scraper.notification) {
				const uniqueListings = await this.removeSeenBeforeAndUpdateListings(
					notification.chatId,
					listings
				)
				await this.bot.sendManyListings(
					notification.chatId,
					uniqueListings,
					scraper.keyword
				)
			}

			await this.delay(1000)
		}
	}
}

module.exports = Notifier
