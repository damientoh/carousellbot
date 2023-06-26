const TelegramTemplate = require('../class/TelegramTemplate')

class TelegramFormatter {
	/**
	 * @static
	 * Formats a listing into a Telegram message string.
	 * @param {object} listing - The listing object to format.
	 * @returns {string} The formatted Telegram message.
	 */
	static formatListing(listing) {
		let result = ''
		result += listing.title + '\n'
		result += '<strong>' + listing.price + '</strong>\n'
		result += listing.postedDate

		return result
	}

	/**
	 * @static
	 * Formats an array of keyword objects into a string representation.
	 * @param {Object[]} allKeywords - The array of keyword objects that should be formatted.
	 * Each object in the array should have the following structure:
	 * @param {string} allKeywords[].keyword - The keyword associated with the object. This represents
	 * the keyword's term or phrase.
	 * @param {string} allKeywords[].link - The URL associated with the keyword. This is the web
	 * address that the keyword links to.
	 * @returns {string} Returns a formatted string representing the keywords. Each keyword is linked
	 * to its associated URL, and all keyword-URL pairs are concatenated into a single string.
	 */
	static formatKeywords(allKeywords) {
		let result = ''

		allKeywords.forEach((keyword, index) => {
			index++
			result +=
				index + '. ' + keyword.keyword + ' in ' + keyword.link + '\n'
		})

		result += '\n'
		result += TelegramTemplate.numOfKeyword(allKeywords.length)

		return result
	}
}

module.exports = TelegramFormatter
