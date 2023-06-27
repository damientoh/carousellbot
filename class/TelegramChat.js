const TelegramChatModel = require('../model/TelegramChatModel')

class TelegramChat {
	/**
	 * Checks if a chat exists based on the chat ID.
	 * @param {string} chatId - The chat ID to check.
	 * @returns {Promise<boolean>} A promise that resolves to true if the chat exists, or false otherwise.
	 * @static
	 */
	static async chatExists(chatId) {
		try {
			const chat = await TelegramChatModel.findOne({ chatId })
			return !!chat
		} catch (error) {
			throw error
		}
	}

	/**
	 * Creates a new chat with the specified chat ID if it doesn't already exist.
	 * If it exists, updates the existing chat.
	 * @param {number} chatId - The chat ID of the new chat.
	 * @returns {Promise<Object>} A promise that resolves with the upserted chat object.
	 * @static
	 */
	static async upsert(chatId) {
		try {
			// findOneAndUpdate method will create a new document in the database if one matching the
			// filter does not exist. "upsert: true" option is used to create the document if it doesn't
			// exist.
			return await TelegramChatModel.findOneAndUpdate(
				{ chatId }, // filter
				{ $set: { chatId } }, // update operation
				{ new: true, upsert: true } // options
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Retrieves the keywords associated with a chat ID.
	 * @param {number} chatId - The chat ID to retrieve the keywords for.
	 * @returns {Promise<Array>} A promise that resolves to an array of keyword objects containing the keyword and
	 *     link.
	 * @static
	 */
	static async getKeywordsByChatId(chatId) {
		try {
			const chat = await TelegramChatModel.findOne({ chatId }).populate(
				'keywords',
				'keyword link'
			)
			if (!chat) {
				return []
			}
			return chat.keywords
		} catch (error) {
			throw error
		}
	}

	/**
	 * Checks if a keyword exists in a chat.
	 * @param {number} chatId - The chat ID to check.
	 * @param {string} keyword - The keyword to check.
	 * @param {string} link - The link associated with the keyword.
	 * @returns {Promise<boolean>} A promise that resolves to true if the keyword exists, or false otherwise.
	 * @static
	 */
	static async hasKeyword(chatId, keyword, link) {
		try {
			const chat = await TelegramChat.findByTelegramId(chatId)
			await chat.populate('keywords')
			return chat.keywords.some(
				kw => kw.keyword === keyword && kw.link === link
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Adds a keyword ID to the specified chat.
	 * @param {string} mongooseChatId - The mongoose chat ID to which the keyword ID will be added.
	 * @param {string} mongooseKeywordId - The mongoose keyword ID to be added.
	 * @returns {Promise<Object>} A promise that resolves to the updated chat object.
	 * @static
	 * @throws {Error} If there was an error adding the keyword ID.
	 */
	static async addKeywordId(mongooseChatId, mongooseKeywordId) {
		try {
			// Find chat and add keyword ID to keywords array
			return await TelegramChatModel.findOneAndUpdate(
				{ _id: mongooseChatId }, // filter
				{ $push: { keywords: mongooseKeywordId } }, // update operation
				{ new: true } // return the updated document
			)
		} catch (error) {
			throw new Error('Failed to add keyword ID to chat.')
		}
	}

	/**
	 * Finds a chat based on the Telegram chat ID.
	 * @param {number} chatId - The ID of the chat to find.
	 * @returns {Promise<Object>} A promise that resolves with the chat object if found, or null otherwise.
	 * @static
	 * @throws {Error} If there was an error finding the chat.
	 */
	static async findByTelegramId(chatId) {
		try {
			return await TelegramChatModel.findOne({ chatId })
		} catch (error) {
			throw error
		}
	}

	/**
	 * Removes a keyword ID from the specified chat.
	 * @param {ObjectId} mongooseChatId - The Mongoose ObjectId of the chat from which the keyword ID will be
	 *     removed.
	 * @param {ObjectId} mongooseKeywordId - The Mongoose ObjectId of the keyword to be removed.
	 * @returns {Promise<Object>} A promise that resolves to the updated chat object.
	 * @static
	 * @throws {Error} If there was an error removing the keyword ID.
	 */
	static async removeKeywordId(mongooseChatId, mongooseKeywordId) {
		try {
			// Find chat and remove keyword ID from keywords array
			return await TelegramChatModel.findOneAndUpdate(
				{ _id: mongooseChatId }, // filter
				{ $pull: { keywords: mongooseKeywordId } }, // update operation
				{ new: true } // return the updated document
			)
		} catch (error) {
			throw error
		}
	}

	/**
	 * Checks if a Carousell ID has been seen in the specified chat. If not, adds it to the chat.
	 * If the size of the seenIds array exceeds 500, it is reduced to the last 250 items.
	 * @param {number} chatId - The chatId of the Telegram chat to check and potentially add the Carousell ID to.
	 * @param {number} carousellId - The Carousell ID to check and potentially add.
	 * @returns {Promise<boolean>} Returns true if the Carousell ID has been seen before, false if not.
	 * @throws {Error} If there was an error during the process.
	 */
	static async hasSeenId(chatId, carousellId) {
		try {
			// Find the chat by chatId
			const chat = await TelegramChatModel.findOne({ chatId: chatId })

			// If the Carousell ID has been seen before, return true
			if (chat.seenIds.includes(carousellId)) {
				return true
			}

			// Add the new Carousell ID
			chat.seenIds.push(carousellId)

			// If the length exceeds 500, keep the last 250
			if (chat.seenIds.length > 500) {
				chat.seenIds = chat.seenIds.slice(-250)
			}

			// Update the chat with new seenIds
			await TelegramChatModel.updateOne(
				{ chatId: chatId },
				{ $set: { seenIds: chat.seenIds } }
			)

			// If the Carousell ID hasn't been seen before, return false
			return false
		} catch (error) {
			throw error
		}
	}
}

module.exports = TelegramChat
