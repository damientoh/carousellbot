const axios = require('axios')
const cheerio = require('cheerio')
const Keyword = require('../class/Keyword')
const winston = require('../winston')
const fs = require('fs')
const path = require('path')
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
	}

	/**
	 * Retrieves the image URL from a single web page URL.
	 * @param {string} listingUrl - The URL of a single web page.
	 * @returns {Promise<string>} The image URL.
	 * @throws {Error} If retrieving the image URL fails.
	 */
	static async getImageUrl(listingUrl) {
		try {
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
		console.log('Starting _getFirstPageDataFromHtml...')

		const $ = cheerio.load(firstPageHtml)
		console.log('Loaded HTML into Cheerio.')

		const result = []
		console.log('Initialized result array.')

		// Loop through each listing card element
		$("[data-testid^='listing-card']").each(function () {
			console.log('Processing a listing card element...')

			let carousellId = $(this)
				.attr('data-testid')
				.replace('listing-card-', '')
			console.log('Extracted carousellId:', carousellId)

			carousellId = parseInt(carousellId)
			if (!carousellId) {
				console.log('Invalid carousellId, skipping this listing.')
				return
			}
			console.log('Parsed carousellId:', carousellId)

			const carousellBaseUrl = 'https://carousell.sg'
			console.log('Set base URL:', carousellBaseUrl)

			const content = $(this).children().first()
			const header = $(content).children('a').first()
			console.log('Extracted content and header.')

			// Extract owner profile URL
			const ownerProfileUrl =
				carousellBaseUrl + $(header).attr('href').split('?')[0]
			console.log('Extracted ownerProfileUrl:', ownerProfileUrl)

			// Extract posted date and boosted status
			const postedDate = $(header)
				.children()
				.eq(1)
				.children()
				.eq(1)
				.text()
			console.log('Extracted postedDate:', postedDate)

			const isBoosted =
				$(header).children().eq(1).children().eq(1).children().length >
				1
			console.log('Determined isBoosted:', isBoosted)

			// Extract listing URL, title, condition, and price
			const listingUrl =
				carousellBaseUrl +
				$(content).children('a').eq(1).attr('href').split('?')[0]
			console.log('Extracted listingUrl:', listingUrl)

			const title = $(content)
				.children('a')
				.eq(1)
				.children('p')
				.eq(0)
				.text()
			console.log('Extracted title:', title)

			const condition = $(content)
				.children('a')
				.eq(1)
				.children('p')
				.eq(1)
				.text()
			console.log('Extracted condition:', condition)

			const price = $(content)
				.children('a')
				.eq(1)
				.children('div')
				.eq(1)
				.text()
			console.log('Extracted price:', price)

			// Check if the listing is valid (not boosted and has a valid posted date)
			const validListing =
				!isBoosted &&
				postedDate &&
				postedDate.indexOf('months') === -1 &&
				postedDate.indexOf('month') === -1 &&
				postedDate.indexOf('year') === -1 &&
				postedDate.indexOf('years') === -1
			console.log('Valid listing:', validListing)

			const imageUrl = $(content).find('img').attr('src')
			console.log('Extracted imageUrl:', imageUrl)

			// Add the listing to the result if it is valid
			if (validListing) {
				console.log('Adding valid listing to results.')
				result.push({
					postedDate,
					carousellId,
					title,
					price,
					condition,
					ownerProfileUrl,
					listingUrl,
					imageUrl
				})
			} else {
				console.log('Listing is not valid, skipping.')
			}
		})

		console.log('Finished processing all listing cards.')
		result.reverse()
		console.log('Reversed result array.')

		console.log('Returning result:', result)
		return result
	}

	/**
	 * Generates a URL based on the provided link and keyword.
	 * If the keyword is an empty string, returns the original link.
	 * Otherwise, appends "?search=<keyword>" to the link.
	 * @returns {string} The generated URL.
	 */
	makeUrl() {
		return this.link
	}

	/**
	 * Scrapes the web page and retrieves the listings.
	 * @returns {Promise<void>}
	 * @throws {Error} If scraping the web page fails.
	 */
	async scrape() {
		try {
			// Prepare the data for the API request
			const data = JSON.stringify({
				cmd: 'request.get',
				url: this.makeUrl()
			})

			console.log('Prepared data for Scrappey API:', data)

			// Make the POST request to the Scrappey API via RapidAPI
			const response = await axios.post(
				'https://scrappey-com.p.rapidapi.com/api/v1',
				data,
				{
					headers: {
						'x-rapidapi-key':
							'938b25843dmsh5215bd0c4e2aa53p1b24cbjsn929b1e1ba3ed', // Your RapidAPI key
						'x-rapidapi-host': 'scrappey-com.p.rapidapi.com',
						'Content-Type': 'application/json'
					},
					timeout: 3 * 30 * 1000 // Wait for 30 seconds
				}
			)

			console.log(
				'Received response from Scrappey API:',
				response.data.solution.response
			)

			// Write the response to a file
			const filePath = path.join(__dirname, 'scrappey_response.txt')
			fs.writeFileSync(filePath, response.data.solution.response, 'utf8')
			console.log('Response written to file:', filePath)

			// Extract listings from the API response
			// Update the listings
			this.listings = Scraper._getFirstPageDataFromHtml(
				response.data.solution.response
			)
			console.log('Listings extracted and updated:', this.listings)
		} catch (error) {
			console.error(
				'Error occurred during scraping via Scrappey API:',
				error
			)
			throw error
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
