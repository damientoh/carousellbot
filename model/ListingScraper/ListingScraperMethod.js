const axios = require('axios')
const cheerio = require('cheerio')
const ListingScraperSchema = require('./ListingScraperSchema')
const mongoose = require('mongoose')

ListingScraperSchema.methods.noKeyword = function () {
	return this.keyword === '*'
}

ListingScraperSchema.methods.noCategory = function () {
	return this.categoryUrl === 'ALL'
}

ListingScraperSchema.methods.makeSearchUrl = function () {
	if (this.noCategory() && this.noKeyword()) {
		return this.constructor.CAROUSELL_SEARCH_URL +
			this.constructor.CAROUSELL_SEARCH_EXTENSION
	}

	if (this.noCategory() && !this.noKeyword()) {
		return this.constructor.CAROUSELL_SEARCH_URL +
			this.keyword +
			this.constructor.CAROUSELL_SEARCH_EXTENSION
	}

	if (!this.noCategory() && !this.noKeyword()) {
		return this.constructor.CAROUSELL_URL +
			this.categoryUrl +
			this.constructor.CAROUSELL_SEARCH_EXTENSION +
			'&search=' + this.keyword
	}
	if (!this.noCategory() && this.noKeyword()) {
		return this.constructor.CAROUSELL_URL +
			this.categoryUrl +
			this.constructor.CAROUSELL_SEARCH_EXTENSION
	}

}

ListingScraperSchema.methods.delay = async function delay(time) {
	await new Promise(resolve => setTimeout(resolve, time))
}

ListingScraperSchema.methods.getFirstPageDataFromHtml = function (
	firstPageHtml
)
{
	const $ = cheerio.load(firstPageHtml)

	const result = []

	$('[data-testid^=\'listing-card\']').each(function () {
		let carousellId = $(this).attr('data-testid').replace('listing-card-', '')
		carousellId = parseInt(carousellId)

		if (!carousellId) {
			return
		}

		const carousellBaseUrl = 'https://carousell.sg'

		// const username = $(this).find('[data-testid=\'listing-card-text-seller-name\']').text()
		const content = $(this).children().first()
		const header = $(content).children('a').first()
		const ownerProfileUrl = carousellBaseUrl + $(header).attr('href').split('?')[0]
		const postedDate = $(header).children().eq(1).children().eq(1).text()
		const isBoosted = $(header).children().eq(1).children().eq(1).children().length > 1

		const listingUrl = carousellBaseUrl + $(content).children('a').eq(1).attr('href').split('?')[0]
		const title = $(content).children('a').eq(1).children('p').eq(0).text()
		const condition = $(content).children('a').eq(1).children('p').eq(1).text()
		const price = $(content).children('a').eq(1).children('div').eq(1).text()
		const validListing = !isBoosted && postedDate && (postedDate.indexOf('months') === -1) && (postedDate.indexOf(
			'month') === -1) && (postedDate.indexOf('year') === -1) && (postedDate.indexOf('years') === -1)

		if (validListing) {
			result.push({
				            postedDate,
				            carousellId,
				            title,
				            price,
				            condition,
				            ownerProfileUrl,
				            listingUrl,
			            })
		}

	})

	console.log(result)
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
)
{
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
)
{
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

ListingScraperSchema.statics.findScraperWithKeyword = async function (keyword, categoryUrl) {
	keyword = keyword.toLowerCase()
	const scraper = await this.findOne({ keyword, categoryUrl })
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
)
{
	await this.constructor.findOneAndUpdate({ _id: this.id }, { $pull: { notification } })
	await this.decreaseUsageByOne() // minus 1 from the usage count
	await this.deleteIfNoUsage() // delete this scraper if there's usage
}

ListingScraperSchema.methods.hasUsage = async function () {
	return (await this.getUsage()) > 0
}

ListingScraperSchema.methods.deleteIfNoUsage = async function () {
	const scraper = await this.constructor.findById(this.id)

	if (!(await scraper.hasUsage())) {
		await this.constructor.deleteOne({ _id: this.id })
	}
}

ListingScraperSchema.methods.getFirstPageNewListings = async function () {
	try {
		let firstScrape = false

		if ((await this.getLastFetchedIds()).length === 0) {
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

ListingScraperSchema.methods.is = function (keyword, categoryUrl) {
	return this.keyword === keyword && this.categoryUrl === categoryUrl
}

module.exports = mongoose.model('ListingScraper', ListingScraperSchema)
