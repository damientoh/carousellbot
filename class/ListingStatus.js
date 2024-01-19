const axios = require('axios')
const cheerio = require('cheerio')
const winston = require('../winston')

/**
 * The ListingStatus class provides a method to scrape a Carousell listing's page to get its status.
 * @class
 */
class ListingStatus {
	/**
	 * Create a ListingStatus object.
	 * @param {string} url - The URL of the Carousell listing to check.
	 */
	constructor(url) {
		this.url = url
	}

	/**
	 * Loads the web page of the Carousell listing and returns a Cheerio object for it.
	 * @returns {Promise<CheerioAPI>} A promise that resolves to a Cheerio object for the page.
	 * @throws {Error} If loading the web page fails.
	 */
	async loadWebPage() {
		try {
			// Use Axios to make a GET request for the page
			const response = await axios.get(this.url, { timeout: 10000 })

			// Return a Cheerio object for the page
			return cheerio.load(response.data)
		} catch (error) {
			// Log the error with Winston
			winston.log('error', 'Failed to load web page', {
				url: this.url,
				errorMessage: error.message
			})

			throw new Error(`Failed to load web page: ${error.message}`)
		}
	}

	/**
	 * Checks the status of the Carousell listing by scraping its page.
	 * @returns {Promise<string>} A promise that resolves to the status of the listing ('active', 'reserved', or
	 *     'sold').
	 * @throws {Error} If checking the status fails.
	 */
	async getStatus() {
		try {
			// Load the web page and get a Cheerio object for it
			const $ = await this.loadWebPage()

			// Get all button elements on the page
			const buttons = $('button').toArray()

			// Loop through the buttons
			for (let button of buttons) {
				// Get the text of the button and make it lowercase
				const buttonText = $(button).text().trim().toLowerCase()

				// Return the status of the listing based on the text of the button
				if (buttonText === 'reserved') {
					return 'reserved'
				} else if (buttonText === 'sold') {
					return 'sold'
				} else if (buttonText === 'chat') {
					return 'active'
				}
			}

			// If no button with one of the specified texts is found, return 'sold'
			return 'sold'
		} catch (error) {
			// Log the error with Winston
			winston.log('error', 'Failed to check listing status', {
				url: this.url,
				errorMessage: error.message
			})

			throw new Error(`Failed to check listing status: ${error.message}`)
		}
	}
}

module.exports = ListingStatus
