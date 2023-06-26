const TelegramSender = require('../class/TelegramSender')
const TelegramTemplate = require('../class/TelegramTemplate')
const TelegramSendOption = require('../class/TelegramSendOption')
const TelegramChat = require('../class/TelegramChat')
const TelegramFormatter = require('../class/TelegramFormatter')
const TelegramValidate = require('../class/TelegramValidate')
const Keyword = require('../class/Keyword')

/**
 * Represents a Telegram action.
 */
class TelegramAction {
	/**
	 * @typedef {object} TelegramMessage
	 * @property {object} chat - The chat object within the message.
	 * @property {number} chat.id - The unique identifier of the chat.
	 */

	/**
	 * Start Telegram action.
	 * @static
	 * @param {TelegramMessage} msg - The message object received from Telegram.
	 */
	static async start(msg) {
		try {
			await TelegramChat.upsert(msg.chat.id)
			await TelegramSender.sendMessage(
				msg.chat.id,
				TelegramTemplate.welcomeMessage,
				TelegramSendOption.standard
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Displays all keywords and links.
	 * @static
	 * @param {TelegramMessage} msg - The message object received from Telegram. retrieve the keywords for.
	 * @returns {Promise<void>} A promise that resolves once the keywords and links are displayed.
	 */
	static async seeKeywords(msg) {
		try {
			await TelegramChat.upsert(msg.chat.id)
			const keywords = await TelegramChat.getKeywordsByChatId(msg.chat.id)
			await TelegramSender.sendMessage(
				msg.chat.id,
				TelegramFormatter.formatKeywords(keywords),
				TelegramSendOption.standard
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Asks the user for a Carousell link and a keyword, then checks if these already exist for the given chat ID.
	 * If they do not exist, adds them to the chat's keywords.
	 * @static
	 * @param {TelegramMessage} msg - The message object received from Telegram.
	 * @throws {Error} If the keyword already exists.
	 * @returns {Promise<void>} A promise that resolves when the new keyword and link have been successfully added.
	 */
	static async addKeyword(msg) {
		try {
			await TelegramChat.upsert(msg.chat.id)
			const linkResponse = await TelegramSender.ask(
				msg.chat.id,
				TelegramTemplate.askCarousellLink
			)

			const keywordResponse = await TelegramSender.ask(
				msg.chat.id,
				TelegramTemplate.askKeyword
			)

			// Normalize the keyword
			const keyword = keywordResponse.trim().toLowerCase()

			// Check if the keyword and link exist for this chat
			await TelegramValidate.userKeyword(
				msg.chat.id,
				keyword,
				linkResponse
			)

			// If they do not exist, add them to the chat's keywords
			const keywordObj = await Keyword.upsert(keyword, linkResponse)
			const chat = await TelegramChat.findByTelegramId(msg.chat.id)

			await Promise.all([
				TelegramChat.addKeywordId(chat._id, keywordObj._id),
				Keyword.addChatId(chat._id, keywordObj._id)
			])

			await TelegramSender.sendMessage(
				msg.chat.id,
				TelegramTemplate.keywordAddedSuccessfully(keyword)
			)
			await TelegramAction.seeKeywords(msg)
		} catch (error) {
			await TelegramSender.sendMessage(msg.chat.id, error.message)
		}
	}

	/**
	 * Deletes a keyword for the given chat ID based on user input.
	 * @static
	 * @param {TelegramMessage} msg - The message object received from Telegram.
	 * @throws {Error} If the keyword doesn't exist or if the input is invalid.
	 * @returns {Promise<void>} A promise that resolves when the keyword has been successfully deleted.
	 */
	static async deleteKeyword(msg) {
		try {
			await TelegramChat.upsert(msg.chat.id)

			// Get all keywords associated with this chat
			const keywords = await TelegramChat.getKeywordsByChatId(msg.chat.id)

			// Check if there are keywords to delete
			if (keywords.length === 0) {
				await TelegramSender.sendMessage(
					msg.chat.id,
					TelegramTemplate.noKeyword
				)
				return
			}

			// Display all keywords
			await TelegramAction.seeKeywords(msg)

			// Ask for keyword number to delete
			const response = await TelegramSender.ask(
				msg.chat.id,
				TelegramTemplate.indexToDelete
			)

			// Validate response
			await TelegramValidate.isNumberInRange(
				response,
				0,
				keywords.length,
				msg.chat.id
			)

			const keywordToDelete = keywords[parseInt(response) - 1]
			const telegramChat = await TelegramChat.findByTelegramId(
				msg.chat.id
			)

			// Remove keyword from chat
			await TelegramChat.removeKeywordId(
				telegramChat._id,
				keywordToDelete._id
			)

			// Remove chat from keyword
			await Keyword.removeChatId(keywordToDelete._id, telegramChat._id)

			await TelegramSender.sendMessage(
				msg.chat.id,
				TelegramTemplate.keywordDeleted(keywordToDelete.keyword)
			)
			await TelegramAction.seeKeywords(msg)
		} catch (error) {
			await TelegramSender.sendMessage(msg.chat.id, error.message)
		}
	}
}

module.exports = TelegramAction
