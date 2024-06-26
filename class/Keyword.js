const KeywordModel = require('../model/KeywordModel')
const winston = require('../winston')

/**
 * Represents a keyword entity.
 */
class Keyword {
	/**
	 * Retrieves the last fetch IDs associated with a keyword with a specific ID and link.
	 * @param {string} keywordId - The ID of the keyword to retrieve the last fetch IDs for.
	 * @returns {Promise<string[]>} The last fetch IDs.
	 * @throws {Error} If retrieving the last fetch IDs fails or the keyword is not found.
	 */
	static async getPrevIds(keywordId) {
		try {
			winston.log('info', 'start getPrevIds', { keywordId })

			const existingKeyword = await KeywordModel.findById(keywordId)

			if (!existingKeyword) {
				winston.log(
					'warning',
					'existing keyword not found in getPrevIds',
					{ keywordId }
				)
				return []
			}

			winston.log('info', 'getPrevIds successful')

			return existingKeyword.prevIds
		} catch (error) {
			winston.log('error', 'getPrevIds failed', { error })
			throw error
		}
	}

	/**
	 * Updates the previous fetch IDs for a keyword with a specific ID and link.
	 * Ensures that a maximum of 250 IDs are maintained.
	 * @param {string} mongooseKeywordId - The Mongoose ObjectId of the keyword to update the previous fetch IDs
	 *     for.
	 * @param {string[]} carousellIds - The new set of previous fetch IDs (Carousell IDs).
	 * @returns {Promise<void>}
	 * @throws {Error} If updating the previous fetch IDs fails.
	 */
	static async addScrapedIds(mongooseKeywordId, carousellIds) {
		try {
			// Find the keyword
			const keyword = await KeywordModel.findById(mongooseKeywordId)

			// Concatenate old and new Carousell IDs
			const updatedPrevIds = keyword.prevIds.concat(carousellIds)

			// If the number of Carousell IDs exceeds the maximum limit (250),
			// remove the oldest ones to maintain the maximum limit.
			if (updatedPrevIds.length > 250) {
				const excessAmount = updatedPrevIds.length - 250
				updatedPrevIds.splice(0, excessAmount)
			}

			// Update the 'prevIds' field of the keyword
			await KeywordModel.findOneAndUpdate(
				{ _id: mongooseKeywordId }, // search condition
				{ prevIds: updatedPrevIds }, // fields to update
				{ new: true, useFindAndModify: false } // options: return updated document, and don't use
				// deprecated findAndModify function
			)
		} catch (error) {
			throw new Error('Failed to update the previous fetch IDs.')
		}
	}

	/**
	 * Retrieve an existing keyword or create a new one.
	 * @param {string} keyword - The keyword to find or create.
	 * @param {string} link - The link associated with the keyword.
	 * @returns {Promise<Object>} A promise that resolves with the keyword object.
	 * @throws {Error} If retrieving or creating the keyword fails.
	 */
	static async upsert(keyword, link) {
		try {
			let keywordDoc = await KeywordModel.findOne({ keyword, link })

			if (!keywordDoc) {
				keywordDoc = new KeywordModel({ keyword, link })
				await keywordDoc.save()
			}

			return keywordDoc
		} catch (error) {
			throw error
		}
	}

	/**
	 * Adds a Telegram chat ID to a keyword.
	 * @param {string} mongooseChatId - The Mongoose ID of the Telegram chat to add.
	 * @param {string} mongooseKeywordId - The Mongoose ID of the keyword.
	 * @returns {Promise<Object>} The updated keyword object.
	 * @throws {Error} If updating the keyword fails.
	 */
	static async addChatId(mongooseChatId, mongooseKeywordId) {
		try {
			// find the keyword with given id and push the new chatId to 'telegramChats' field
			return await KeywordModel.findOneAndUpdate(
				{ _id: mongooseKeywordId }, // search condition
				{ $push: { telegramChats: mongooseChatId } }, // field to update
				{ new: true, useFindAndModify: false } // options: return updated document, and don't use
				// deprecated findAndModify function
			)
		} catch (error) {
			throw new Error('Failed to add the chat ID to the keyword.')
		}
	}

	/**
	 * Removes a chat ID from the specified keyword.
	 * @param {ObjectId} mongooseKeywordId - The Mongoose ObjectId of the keyword from which the chat ID will be
	 *     removed.
	 * @param {ObjectId} mongooseChatId - The Mongoose ObjectId of the chat to be removed.
	 * @returns {Promise<Object>} A promise that resolves to the updated keyword object.
	 * @static
	 * @throws {Error} If there was an error removing the chat ID.
	 */
	static async removeChatId(mongooseKeywordId, mongooseChatId) {
		try {
			// Find keyword and remove chat ID from chats array
			const keyword = await KeywordModel.findOneAndUpdate(
				{ _id: mongooseKeywordId }, // filter
				{ $pull: { telegramChats: mongooseChatId } }, // update operation
				{ new: true } // return the updated document
			)

			// If the updated keyword has no more chats, delete it
			if (keyword.telegramChats.length === 0) {
				await KeywordModel.findByIdAndDelete(mongooseKeywordId)
			}
		} catch (error) {
			throw error
		}
	}

	/**
	 * Retrieves all chat IDs associated with a specific keyword.
	 * @param {string} mongooseKeywordId - The Mongoose ObjectId of the keyword to retrieve chat IDs for.
	 * @returns {Promise<number[]>} A list of chat IDs.
	 * @throws {Error} If retrieving the chat IDs fails.
	 */
	static async getChatIds(mongooseKeywordId) {
		try {
			// find keyword by id and populate telegramChats with only chatId field
			const keyword = await KeywordModel.findById(
				mongooseKeywordId
			).populate('telegramChats', 'chatId')

			// If the keyword does not exist, return an empty array
			if (!keyword) {
				return []
			}

			// map through telegramChats and return only chatId
			return keyword.telegramChats.map(chat => chat.chatId)
		} catch (error) {
			throw error
		}
	}

	/**
	 * @static
	 * Adds a new job to the scraping queue.
	 * @param {Object} keyword - The keyword object with link, keyword, and _id properties.
	 * @throws {Error} If adding the job fails.
	 */
	static async addToScrapingQueue(keyword) {
		try {
			const scrapingQueue = require('../Queue/ScrapingQueue')
			// Create a new job with the link and keyword from the keyword object
			await scrapingQueue.add(
				{
					link: keyword.link,
					keyword: keyword.keyword,
					keywordId: keyword._id
				},
				{ attempts: 2, removeOnComplete: true }
			)
		} catch (error) {
			winston.log('error', 'not able to add to scraping queue', {
				error,
				...{
					link: keyword.link,
					keyword: keyword.keyword,
					keywordId: keyword._id
				}
			})
			throw error
		}
	}

	/**
	 * Retrieves all keywords from the database and adds them to the scraping queue.
	 * @returns {Promise<void>}
	 * @throws {Error} If retrieving the keywords or adding them to the queue fails.
	 */
	static async addAllKeywordsToQueue() {
		try {
			winston.log('info', 'start addAllKeywordsToQueue')

			// Retrieve all keywords from the database
			const allKeywords = await KeywordModel.find()

			// For each keyword, add it to the scraping queue
			for (const keyword of allKeywords) {
				await this.addToScrapingQueue(keyword)
			}

			winston.log('info', 'addAllKeywordsToQueue successful')
		} catch (error) {
			winston.log('error', 'addAllKeywordsToQueue failed', { error })
			throw error
		}
	}

	/**
	 * Retrieves all telegram chats associated with a specific keyword.
	 * @param {mongoose.Types.ObjectId} mongooseKeywordId - The Mongoose ObjectId of the keyword.
	 * @returns {Promise<Object[]>} A promise that resolves with an array of telegram chats.
	 * @throws {Error} If an error occurs during the process.
	 */
	static async getAllTelegramChats(mongooseKeywordId) {
		try {
			// Find the keyword document with the provided ID and populate the 'telegramChats' field
			const keywordDoc = await KeywordModel.findById(
				mongooseKeywordId
			).populate('telegramChats', '_id chatId')

			// If no keyword is found, log a warning and return an empty array
			if (!keywordDoc) {
				winston.log(
					'warning',
					'No keyword found with the provided ID',
					{ mongooseKeywordId }
				)
				return []
			}

			return keywordDoc.telegramChats
		} catch (error) {
			// Log the error and throw it to be handled by the caller
			winston.log(
				'error',
				'An error occurred while getting all Telegram chats for the keyword',
				{
					mongooseKeywordId,
					errorMessage: error.message
				}
			)
			throw error
		}
	}
}

module.exports = Keyword
