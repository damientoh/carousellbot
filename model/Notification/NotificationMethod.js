const NotificationSchema = require('./NotificationSchema')
const ListingScraper = require('../ListingScraper/ListingScraper')
const mongoose = require('mongoose')

NotificationSchema.statics.chatExists = async function (chatId) {
	return await this.exists({ chatId })
}

NotificationSchema.statics.findByChatId = async function (chatId) {
	return await this.findOne({ chatId })
}

NotificationSchema.methods.HasScraper = async function (listingScraperId, categoryUrl) {
	const notification = await this.constructor.findById(this.id)
	await notification.populate('listingScraper')
	return notification.listingScraper
		.map(scraper => scraper.id === listingScraperId && categoryUrl === scraper.categoryUrl)
		.includes(true)
}

NotificationSchema.methods.addScraperId = async function (listingScraperId) {
	if (!(await this.HasScraper(listingScraperId))) {
		await this.constructor.findOneAndUpdate(
			{ _id: this.id },
			{ $push: { listingScraper: listingScraperId } }
		)
	}
}

NotificationSchema.statics.hasKeyword = async function (chatId, keyword, categoryUrl) {
	const notification = await this.findByChatId(chatId)
	await notification.populate('listingScraper')
	const scrapers = notification.listingScraper
	const allKeywords = scrapers.map(scraper => scraper.is(keyword, categoryUrl))
	return allKeywords.includes(true)
}

NotificationSchema.methods.hasKeyword = async function (keyword, categoryUrl) {
	const notification = await this.constructor.findById(this.id)
	await notification.populate('listingScraper')
	const scrapers = notification.listingScraper
	const allKeywords = scrapers.map(scraper => scraper.is(keyword, categoryUrl))
	return allKeywords.includes(true)
}

// NotificationSchema.methods.getKeywords = async function () {
// 	const notification = await this.constructor.findById(this.id)
// 	await notification.populate('listingScraper')
// 	const scrapers = notification.listingScraper
// 	return scrapers.map(scraper => scraper.keyword)
// }

// NotificationSchema.methods.getKeywordsWithCategory = async function () {
// 	const notification = await this.constructor.findById(this.id)
// 	await notification.populate('listingScraper')
// 	const scrapers = notification.listingScraper
// 	return scrapers.map(scraper => {
// 		return {
// 			keyword: scraper.keyword,
// 			category: scraper.category,
// 		}
// 	})
// }

NotificationSchema.methods.getKeywordsWithCategory = async function () {
	const notification = await this.constructor.findById(this.id)
	await notification.populate('listingScraper')
	const scrapers = notification.listingScraper
	return scrapers.map(scraper => {
		return {
			keyword: scraper.keyword,
			category: scraper.category,
		}
	})
}

NotificationSchema.methods.deleteKeywordByIndex = async function (index) {
	const notification = await this.constructor.findById(this.id)
	await notification.populate('listingScraper')
	const allScrapers = notification.listingScraper
	const scraper = allScrapers[index]
	// remove keyword from notification
	await this.constructor.findOneAndUpdate(
		{ _id: notification.id },
		{ $pull: { listingScraper: scraper.id } }
	)
	await scraper.deleteNotification(notification.id)
}

NotificationSchema.statics.addKeyword = async function (chatId, keyword, category, categoryUrl) {
	const notification = await this.findByChatId(chatId)
	if (await notification.hasKeyword(keyword, categoryUrl)) {
		return
	}

	// check if a scraper for this keyword already exists
	let scraper = await ListingScraper.findScraperWithKeyword(keyword, categoryUrl)

	if (!scraper) {
		scraper = new ListingScraper({ keyword, usage: 0, category, categoryUrl })
		await scraper.save()
	}

	try {
		await Promise.all([
			notification.addScraperId(scraper.id),
			scraper.addNotification(notification.id),
		])
	} catch (error) {
		throw error
	}
}

NotificationSchema.methods.addKeyword = async function (keyword, categoryUrl) {
	if (await this.hasKeyword(keyword, categoryUrl)) {
		return
	}

	// check if a scraper for this keyword already exists
	let scraper = await ListingScraper.findScraperWithKeyword(keyword, categoryUrl)

	if (!scraper) {
		scraper = new ListingScraper({ keyword, usage: 0, categoryUrl })
		await scraper.save()
	}

	try {
		await Promise.all([
			this.addScraperId(scraper.id),
			scraper.addNotification(notification.id),
		])
	} catch (error) {
		throw new Error(error.message)
	}
}

NotificationSchema.methods.addSeenIds = async function (uniqueIds) {
	await this.resizeSeenIds()
	await this.constructor.findOneAndUpdate(
		{ _id: this.id },
		{ $push: { seenIds: { $each: uniqueIds } } }
	)
}

NotificationSchema.methods.resizeSeenIds = async function () {
	const notification = await this.constructor.findById(this.id)

	if (notification.seenIds && notification.seenIds.length > 2000) {
		await this.constructor.findOneAndUpdate(
			{ _id: this.id },
			{ $slice: { seenIds: 500 } }
		)
	}
}

module.exports = mongoose.model('Notification', NotificationSchema)
