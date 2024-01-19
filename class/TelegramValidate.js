const validator = require('validator')
const TelegramChat = require('../class/TelegramChat')
const TelegramTemplate = require('../class/TelegramTemplate')
const Scraper = require('../class/Scraper')

class TelegramValidate {
	/**
	 * Check if a user's keyword already exists in the chat.
	 * @param {number} chatId - The ID of the chat to check.
	 * @param {string} keyword - The keyword to check.
	 * @param {string} link - The link associated with the keyword.
	 * @returns {Promise<boolean>} A promise that resolves to 'true' if the keyword exists in the chat, 'false'
	 *     otherwise.
	 * @throws {Error} If there's an error in the checking process.
	 * @static
	 */
	static async userHasKeyword(chatId, keyword, link) {
		try {
			const keywordExists = await TelegramChat.hasKeyword(
				chatId,
				keyword,
				link
			)
			return Boolean(keywordExists)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Validate a user's keyword. The keyword should be alphanumeric or '*'.
	 * @param {string} keyword - The keyword to validate.
	 * @returns {boolean} Returns 'true' if the keyword is valid, 'false' otherwise.
	 * @throws {Error} If the keyword is not of type string.
	 * @static
	 */
	static isValidKeyword(keyword) {
		if (typeof keyword !== 'string') {
			return false
		}

		const trimmedKeyword = keyword.trim()

		if (trimmedKeyword.length === 0) {
			return false
		}

		return (
			validator.isAlphanumeric(trimmedKeyword) || trimmedKeyword === '*'
		)
	}

	/**
	 * Check if a given text is a command. A command is considered to be any text that starts with '/'.
	 * @param {string} text - The text to check.
	 * @returns {boolean} Returns 'true' if the text is a command, 'false' otherwise.
	 * @throws {Error} If the text is not of type string.
	 * @static
	 */
	static isCommand(text) {
		return text.startsWith('/')
	}

	/**
	 * Checks if a response is a number within a specific range.
	 * @param {string} response - The response to validate.
	 * @param {number} min - The minimum value (inclusive).
	 * @param {number} max - The maximum value (inclusive).
	 * @param {number} chatId - The ID of the chat.
	 * @throws {Error} If the response is not a number or is not within the specified range.
	 */
	static async isNumberInRange(response, min, max, chatId) {
		const number = parseInt(response, 10)

		// Validate if response is a number
		if (isNaN(number) || number < min || number > max) {
			throw new Error(TelegramTemplate.invalidKeywordNumber)
		}
	}

	/**
	 * Checks if a link is valid by attempting to scrape it.
	 * A link is considered valid if the scraper finds at least one listing.
	 * @param {string} link - The link to validate.
	 * @param {string} keyword - The keyword to use for scraping.
	 * @returns {Promise<boolean>} Returns 'true' if the link is valid, 'false' otherwise.
	 * @throws {Error} If there is an error during the scraping process.
	 * @static
	 */
	static async isValidLink(link, keyword) {
		try {
			const scraper = new Scraper(link, keyword, '')
			await scraper.scrape()
			return scraper.listings.length > 0
		} catch (error) {
			throw error
		}
	}
}

module.exports = TelegramValidate
