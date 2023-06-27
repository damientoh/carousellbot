const validator = require('validator')
const TelegramChat = require('../class/TelegramChat')
const TelegramTemplate = require('../class/TelegramTemplate')

class TelegramValidate {
	/**
	 * Validate a user's keyword. The keyword should be alphanumeric and not already exist in the chat.
	 * @param {number} chatId - The ID of the chat to check.
	 * @param {string} keyword - The keyword to validate.
	 * @param {string} link - The link associated with the keyword.
	 * @returns {Promise<void>} A promise that resolves when the keyword is valid and doesn't exist in the chat.
	 * @throws {Error} If the keyword is invalid or already exists in the chat.
	 * @static
	 */
	static async userKeyword(chatId, keyword, link) {
		// Preprocess the keyword: trim whitespaces and convert to lowercase
		// (assuming these operations have been done and the result is in 'processedKeyword')

		// Check if the keyword is alphanumeric using a validator library
		// This ensures that our keyword only contains letters and numbers, preventing any potential security
		// issues or errors
		if (!validator.isAlphanumeric(keyword) && !(keyword === '*')) {
			// If the keyword is not alphanumeric, throw an error with a message from our TelegramTemplate
			throw new Error(TelegramTemplate.invalidKeyword)
		}

		// Check if the keyword already exists in the chat
		// This is done by calling the 'hasKeyword' method on the TelegramChat class
		// 'hasKeyword' takes the chat ID, the keyword and the link as arguments
		const keywordExists = await TelegramChat.hasKeyword(
			chatId,
			keyword,
			link
		)

		if (keywordExists) {
			throw new Error(TelegramTemplate.keywordExists(keyword))
		}

		// If the keyword already exists, throw an error
		// The error message is obtained from the TelegramTemplate class, and it includes the keyword that
		// caused the error
		if (keywordExists) {
			throw new Error(TelegramTemplate.keywordExists(keyword))
		}
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
}

module.exports = TelegramValidate
