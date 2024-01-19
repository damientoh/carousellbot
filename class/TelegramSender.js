const TelegramSendOption = require('../class/TelegramSendOption')
const TelegramFormatter = require('../class/TelegramFormatter')

class TelegramSender {
	/**
	 * Sends a single listing to a specified chat.
	 * @static
	 * @param {number} chatId - The ID of the chat to send the listing to.
	 * @param {Object} listing - The listing object to send.
	 * @returns {Promise<void>}
	 * @throws {Error} If sending the single listing fails.
	 */
	static async sendSingleListing(chatId, listing) {
		try {
			const hasImage = listing.imageUrl

			if (!hasImage) {
				await TelegramSender.sendMessage(
					chatId,
					TelegramFormatter.formatListing(listing),
					TelegramSendOption.inlineButton(
						'View on Carousell',
						listing.listingUrl
					)
				)
				return
			}

			await TelegramSender.sendMessageWithPhoto(
				chatId,
				listing.imageUrl,
				TelegramSendOption.singleListing(
					TelegramFormatter.formatListing(listing),
					listing.listingUrl
				)
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Sends a message to a specified chat.
	 * @static
	 * @param {number} chatId - The ID of the chat to send the message to.
	 * @param {string} message - The message content to send.
	 * @param {object} [options] - Additional options for sending the message.
	 * @returns {Promise<object>} A promise that resolves to the sent message object.
	 * @throws {Error} If sending the message fails.
	 */
	static async sendMessage(chatId, message, options) {
		const TelegramBot = require('../class/TelegramBot')
		return await TelegramBot.sendMessage(chatId, message, options)
	}

	/**
	 * Sends a message with a photo to a specified chat.
	 * @static
	 * @param {number} chatId - The ID of the chat to send the message to.
	 * @param {string} imageUrl - The URL of the photo to send.
	 * @param {object} [options] - Additional options for sending the message.
	 * @returns {Promise<object>} A promise that resolves to the sent message object.
	 * @throws {Error} If sending the message with photo fails.
	 */
	static async sendMessageWithPhoto(chatId, imageUrl, options) {
		try {
			const TelegramBot = require('../class/TelegramBot')
			return TelegramBot.sendPhoto(chatId, imageUrl, options)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Asks a question in a specified chat and waits for a reply.
	 * @static
	 * @param {number} chatId - The ID of the chat to ask the question in.
	 * @param {string} question - The question to ask.
	 * @returns {Promise<string>} A promise that resolves to the text of the reply.
	 * @throws {Error} If no reply is received within 120 seconds.
	 */
	static ask(chatId, question) {
		return new Promise((resolve, reject) => {
			const TelegramBot = require('../class/TelegramBot')
			this.sendMessage(chatId, question)
				.then(() => {
					const listener = msg => {
						if (msg.chat.id === chatId) {
							resolve(msg.text)
						}
					}
					TelegramBot.once('message', listener)
					setTimeout(() => {
						TelegramBot.removeListener('message', listener)
						reject(
							new Error('No reply received within 120 seconds')
						)
					}, 120000) // 120 seconds
				})
				.catch(error => {
					reject(error)
				})
		})
	}
}

module.exports = TelegramSender
