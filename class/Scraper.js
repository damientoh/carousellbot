const axios = require('axios')
const cheerio = require('cheerio')
const Keyword = require('../class/Keyword')
const winston = require('../winston')

/**
 * Represents a web scraper that extracts information based on a provided link and keyword.
 */
class Scraper {
	/**
	 * The list of listings retrieved from a web page.
	 * @type {Object[]}
	 */
	listings = []

	/**
	 * Creates a new Scraper instance.
	 * @param {string} link - The link of the web page to scrape.
	 * @param {string} keyword - The keyword to search for in the web page.
	 * @param {string} keywordId - The ID of the keyword associated with the Scraper instance.
	 */
	constructor(link, keyword, keywordId) {
		this.link = link
		this.keyword = keyword
		this.keywordId = keywordId
		// this.proxy = 'http://cloudscraper.vivhlseiso-gjy3m5dv168q.p.temp-site.link/fetch?url='
	}

	/**
	 * Retrieves the image URL from a single web page URL.
	 * @param {string} listingUrl - The URL of a single web page.
	 * @returns {Promise<string>} The image URL.
	 * @throws {Error} If retrieving the image URL fails.
	 */
	static async getImageUrl(listingUrl) {
		try {
			listingUrl = this.proxy + listingUrl
			winston.log('info', 'start getImageUrl', { listingUrl })
			const page = await axios.get(listingUrl, { timeout: 10000 })
			const $ = cheerio.load(page.data)
			winston.log('info', 'success getImageUrl', { listingUrl })
			return $('meta[property="og:image"]').attr('content')
		} catch (error) {
			winston.log('error', 'failed to getImageUrl', { listingUrl, error })
			throw error
		}
	}

	getListingsV2() {

	}

	/**
	 * Extracts listings data from the HTML of the first page.
	 * @static
	 * @param {string} firstPageHtml - The HTML content of the first page.
	 * @returns {Object[]} An array of listing objects.
	 * Each listing object contains the following properties:
	 * - postedDate {string} The date when the listing was posted.
	 * - carousellId {number} The unique identifier of the listing on Carousell.
	 * - title {string} The title of the listing.
	 * - price {string} The price of the listing.
	 * - condition {string} The condition of the listing.
	 * - ownerProfileUrl {string} The URL of the owner's profile on Carousell.
	 * - listingUrl {string} The URL of the listing on Carousell.
	 * @throws {Error} If there is an error during the extraction process.
	 */
	static _getFirstPageDataFromHtml(firstPageHtml) {
		const $ = cheerio.load(firstPageHtml)

		const result = []

		// Loop through each listing card element
		$("[data-testid^='listing-card']").each(function () {
			let carousellId = $(this)
				.attr('data-testid')
				.replace('listing-card-', '')
			carousellId = parseInt(carousellId)

			if (!carousellId) {
				return
			}

			const carousellBaseUrl = 'https://carousell.sg'

			const content = $(this).children().first()
			const header = $(content).children('a').first()

			// Extract owner profile URL
			const ownerProfileUrl =
				carousellBaseUrl + $(header).attr('href').split('?')[0]

			// Extract posted date and boosted status
			const postedDate = $(header)
				.children()
				.eq(1)
				.children()
				.eq(1)
				.text()
			const isBoosted =
				$(header).children().eq(1).children().eq(1).children().length >
				1

			// Extract listing URL, title, condition, and price
			const listingUrl =
				carousellBaseUrl +
				$(content).children('a').eq(1).attr('href').split('?')[0]
			const title = $(content)
				.children('a')
				.eq(1)
				.children('p')
				.eq(0)
				.text()
			const condition = $(content)
				.children('a')
				.eq(1)
				.children('p')
				.eq(1)
				.text()
			const price = $(content)
				.children('a')
				.eq(1)
				.children('div')
				.eq(1)
				.text()

			// Check if the listing is valid (not boosted and has a valid posted date)
			const validListing =
				!isBoosted &&
				postedDate &&
				postedDate.indexOf('months') === -1 &&
				postedDate.indexOf('month') === -1 &&
				postedDate.indexOf('year') === -1 &&
				postedDate.indexOf('years') === -1

			// Add the listing to the result if it is valid
			if (validListing) {
				result.push({
					postedDate,
					carousellId,
					title,
					price,
					condition,
					ownerProfileUrl,
					listingUrl
				})
			}
		})

		result.reverse()

		return result
	}

	/**
	 * Generates a URL based on the provided link and keyword.
	 * If the keyword is an empty string, returns the original link.
	 * Otherwise, appends "?search=<keyword>" to the link.
	 * @returns {string} The generated URL.
	 */
	makeUrl() {
		if (this.keyword === '*') {
			return `${this.link}?sort_by=3`
		} else {
			return `${this.link}?search=${this.keyword}&sort_by=3`
		}
	}

	/**
	 * Scrapes the web page and retrieves the listings.
	 * @returns {Promise<void>}
	 * @throws {Error} If scraping the web page fails.
	 */
	async scrape() {
		try {
			const options = {
				method: 'GET',
				url: 'https://cloudflare-bypass2.p.rapidapi.com/',
				params: {
					url: this.makeUrl()
				},
				headers: {
					'X-RapidAPI-Key': '92d8ad7343mshf3835640917dfd6p17af1ajsnb31edae7dc02',
					'X-RapidAPI-Host': 'cloudflare-bypass2.p.rapidapi.com',
					"Accept-Encoding": "gzip,deflate,compress"
				},
				timeout: 10000 // Timeout in milliseconds
			};

			// Retrieve the first page HTML
			const firstPage = await axios.request(options)

			// Extract listings from the first page
			// Update the listings
			this.listings = Scraper._getFirstPageDataFromHtml(firstPage.data)
		} catch (error) {
			console.error("Error during scraping:", error.message);
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.error(error.response.data);
				console.error(error.response.status);
				console.error(error.response.headers);
			} else if (error.request) {
				// The request was made but no response was received
				console.error(error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.error('Error', error.message);
			}
			// throw error;
		}
	}

	/**
	 * Processes listings: filters seen listings, updates previous fetched IDs, and clears listings if it's the
	 * first scrape.
	 * @returns {Promise<void>}
	 * @throws {Error} If processing the listings fails.
	 */
	async processListings() {
		try {
			// Filter out seen listings
			await this.filterScrapedListings()

			// Fetch previous IDs
			const prevIds = await Keyword.getPrevIds(this.keywordId)

			// Update previous IDs
			await this.updatePrevIds()

			// Clear listings if it's the first scrape
			if (prevIds.length === 0) {
				this.listings = []
			}
		} catch (error) {
			throw error
		}
	}

	/**
	 * Updates the previous fetch IDs for the keyword and link associated with the Scraper instance.
	 * @returns {Promise<void>}
	 * @throws {Error} If updating the previous fetch IDs fails.
	 */
	async updatePrevIds() {
		try {
			const carousellIds = this.listings.map(
				listing => listing.carousellId
			)
			await Keyword.addScrapedIds(this.keywordId, carousellIds)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Filters out the listings that have carousellIds existing in prevIds.
	 * @returns {Promise<void>}
	 * @throws {Error} If filtering the seen listings fails.
	 */
	async filterScrapedListings() {
		try {
			const prevIds = await Keyword.getPrevIds(this.keywordId)
			this.listings = this.listings.filter(
				listing => !prevIds.includes(listing.carousellId)
			)
		} catch (error) {
			throw error
		}
	}
}

module.exports = Scraper
