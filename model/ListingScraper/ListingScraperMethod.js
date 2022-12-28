const axios = require('axios')
const cheerio = require('cheerio')
const ListingScraperSchema = require('./ListingScraperSchema')
const mongoose = require('mongoose')

ListingScraperSchema.methods.makeSearchUrl = function () {
	return (
		this.constructor.CAROUSELL_SEARCH_URL +
		this.keyword +
		this.constructor.CAROUSELL_SEARCH_EXTENSION
	)
}

ListingScraperSchema.methods.delay = async function delay(time) {
	await new Promise(resolve => setTimeout(resolve, time))
}

ListingScraperSchema.methods.getFirstPageDataFromHtml = function (
	firstPageHtml
) {
	const $ = cheerio.load(firstPageHtml)

	const result = []
	const model = this.constructor

	$(this.constructor.LISTING_SELECTOR).each(async function () {
		const postedDate = $(this).find(model.POSTED_DATE_SELECTOR).text()

		if (postedDate) {
			const listingUrl =
				'https://carousell.sg' +
				$(this).find(model.LINK_SELECTOR).attr('href').split('?')[0]

			result.push({
				postedDate,
				carousellId: $(this)
					.find(model.LISTING_ID_SELECTOR)
					.attr('data-testid')
					.replace('listing-card-', ''),
				title: $(this).find(model.TITLE_SELECTOR).text(),
				price: $(this).find(model.PRICE_SELECTOR).text(),
				condition: $(this)
					.find(model.CONDITION_SELECTOR)
					.text()
					.replace(new RegExp('Free shipping', 'g'), '')
					.replace(new RegExp('Protection', 'g'), ''),
				ownerProfileUrl: $(this)
					.find(model.PROFILE_LINK_SELECTOR)
					.attr('href')
					.split('?')[0],
				listingUrl,
			})
		}
	})

	return result
}

ListingScraperSchema.statics.getImageUrl = async function (singleUrl) {
	try {
		const page = await axios.get(singleUrl)
		const $ = cheerio.load(page.data)
		return $('meta[property="og:image"]').attr('content')
	} catch (error) {
		throw new Error(error.message)
	}
}

ListingScraperSchema.methods.getLastFetchedIds = async function () {
	const scraper = await this.constructor.findById(this.id)
	return scraper.lastFetchIds
}

ListingScraperSchema.methods.removeScrapedBeforeListings = async function (
	allListings
) {
	const lastFetchIds = await this.getLastFetchedIds()

	const uniqueListings = []

	for (const listing of allListings) {
		if (lastFetchIds && lastFetchIds.includes(listing.carousellId)) {
			return uniqueListings
		}

		uniqueListings.push(listing)
	}

	return uniqueListings
}

ListingScraperSchema.methods.updateScrapedBeforeListings = async function (
	uniqueListings
) {
	if (uniqueListings.length > 0) {
		const lastFetchIds = uniqueListings.map(listing => listing.carousellId)

		const scraper = await this.constructor.findById(this.id)

		if (scraper.lastFetchIds.length > 200) {
			await this.constructor.updateOne(
				{ _id: this.id },
				{
					$set: {
						lastFetchIds: lastFetchIds.slice(scraper.lastFetchIds.length - 100),
					},
				}
			)
		}

		await this.constructor.findOneAndUpdate(
			{ _id: this.id },
			{ $push: { lastFetchIds } }
		)
	}
}

ListingScraperSchema.statics.findScraperWithKeyword = async function (keyword) {
	keyword = keyword.toLowerCase()
	const scraper = await this.findOne({ keyword })
	if (scraper) {
		return scraper
	}
	return null
}

ListingScraperSchema.methods.getUsage = async function () {
	const scraper = await this.constructor.findById(this.id)
	return scraper.usage
}

ListingScraperSchema.methods.increaseUsageByOne = async function () {
	await this.constructor.findOneAndUpdate(
		{ _id: this.id },
		{ usage: (await this.getUsage()) + 1 }
	)
}

ListingScraperSchema.methods.decreaseUsageByOne = async function () {
	await this.constructor.findOneAndUpdate(
		{ _id: this.id },
		{ usage: (await this.getUsage()) - 1 }
	)
}

ListingScraperSchema.methods.addNotification = async function (notification) {
	await this.constructor.findOneAndUpdate(
		{ _id: this.id },
		{ $push: { notification } }
	)
	await this.increaseUsageByOne()
}

ListingScraperSchema.methods.deleteNotification = async function (
	notification
) {
	await this.constructor.findOneAndUpdate(
		{ _id: this.id },
		{ $pull: { notification } }
	)
	await this.decreaseUsageByOne()
	await this.deleteIfNoUsage()
}

ListingScraperSchema.methods.hasUsage = async function () {
	return (await this.getUsage()) > 0
}

ListingScraperSchema.methods.deleteIfNoUsage = async function () {
	const scraper = await this.constructor.findById(this.id)

	if (!(await scraper.hasUsage())) {
		await this.constructor.deleteOne({ id: this.id })
	}
}

ListingScraperSchema.methods.getFirstPageNewListings = async function () {
	try {
		let firstScrape = false

		if ((await this.getLastFetchedIds()).length == 0) {
			firstScrape = true
		}

		const firstPage = await axios.get(this.makeSearchUrl())
		let allListings = this.getFirstPageDataFromHtml(firstPage.data)
		let uniqueListings = await this.removeScrapedBeforeListings(allListings)

		await this.updateScrapedBeforeListings(uniqueListings)

		if (firstScrape) {
			return []
		}

		return uniqueListings.reverse()
	} catch (error) {
		throw new Error(error.message)
	}
}

module.exports = mongoose.model('ListingScraper', ListingScraperSchema)
