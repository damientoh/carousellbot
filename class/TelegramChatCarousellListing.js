const mongoose = require('mongoose')
const winston = require('../winston')
const TelegramChatCarousellListingModel = require('../model/telegramchatcarouselllisting.model')

/**
 * Represents a relationship between a TelegramChat and a CarousellListing.
 */
class TelegramChatCarousellListing {
	/**
	 * Creates a new relationship between a TelegramChat and a CarousellListing.
	 * @param {mongoose.Types.ObjectId} telegramChatId - The Mongoose ObjectId of the TelegramChat.
	 * @param {mongoose.Types.ObjectId} carousellListingId - The Mongoose ObjectId of the CarousellListing.
	 * @returns {Promise<Object>} A promise that resolves to the created relationship object.
	 * @throws {Error} If creating the relationship fails.
	 */
	static async create(telegramChatId, carousellListingId) {
		try {
			const newRelationship = new TelegramChatCarousellListingModel({
				telegramChat: telegramChatId,
				carousellListing: carousellListingId
			})

			await newRelationship.save()

			return newRelationship
		} catch (error) {
			winston.log(
				'error',
				'An error occurred while creating the TelegramChat-CarousellListing relationship.',
				{
					telegramChatId,
					carousellListingId,
					errorMessage: error.message
				}
			)
			throw error
		}
	}

	/**
	 * Retrieves all CarousellListings associated with a specific TelegramChat.
	 * @param {mongoose.Types.ObjectId} telegramChatId - The Mongoose ObjectId of the TelegramChat to retrieve
	 *     CarousellListings for.
	 * @returns {Promise<Object[]>} A promise that resolves to an array of CarousellListing objects.
	 * @throws {Error} If retrieving the CarousellListings fails.
	 */
	static async getCarousellListingsByTelegramChat(telegramChatId) {
		try {
			// Find all relationships with the specified TelegramChat and populate the 'carousellListing'
			// field
			const relationships = await TelegramChatCarousellListingModel.find({
				telegramChat: telegramChatId
			}).populate('carousellListing')

			// Extract the CarousellListings from the relationships
			return relationships.map(
				relationship => relationship.carousellListing
			)
		} catch (error) {
			winston.log(
				'error',
				'An error occurred while retrieving CarousellListings for a TelegramChat.',
				{ telegramChatId, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Retrieves paginated CarousellListings associated with a specific TelegramChat.
	 * @param {mongoose.Types.ObjectId} telegramChatId - The Mongoose ObjectId of the TelegramChat to retrieve
	 *     CarousellListings for.
	 * @param {number} [page=1] - The page number to retrieve.
	 * @param {number} [limit=10] - The number of documents per page.
	 * @returns {Promise<Object>} A promise that resolves to an object with pagination info and an array of
	 *     CarousellListing objects.
	 * @throws {Error} If retrieving the CarousellListings fails.
	 */
	static async getCarousellListingsByTelegramChatPaginated(
		telegramChatId,
		page = 1,
		limit = 10
	) {
		try {
			// Find all relationships with the specified TelegramChat, populate the 'carousellListing'
			// field, and apply pagination
			const result = await TelegramChatCarousellListingModel.paginate(
				{
					telegramChat: telegramChatId
				},
				{
					populate: 'carousellListing',
					page,
					limit
				}
			)

			// Extract the CarousellListings from the result
			const carousellListings = result.docs.map(
				doc => doc.carousellListing
			)

			return {
				carousellListings,
				currentPage: result.page,
				hasPrevPage: result.hasPrevPage,
				hasNextPage: result.hasNextPage,
				prevPage: result.prevPage,
				nextPage: result.nextPage,
				totalPages: result.totalPages,
				totalDocs: result.totalDocs
			}
		} catch (error) {
			winston.log(
				'error',
				'An error occurred while retrieving paginated CarousellListings for a TelegramChat.',
				{ telegramChatId, page, limit, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Creates multiple new relationships between multiple TelegramChats and a single CarousellListing.
	 * @param {mongoose.Types.ObjectId} carousellListingId - The Mongoose ObjectId of the CarousellListing.
	 * @param {mongoose.Types.ObjectId[]} telegramChatIds - An array of Mongoose ObjectIds of the TelegramChats.
	 * @returns {Promise<Object[]>} A promise that resolves to an array of the created relationship objects.
	 * @throws {Error} If creating the relationships fails.
	 */
	static async bulkCreate(carousellListingId, telegramChatIds) {
		try {
			const newRelationships = []

			for (const telegramChatId of telegramChatIds) {
				const newRelationship = new TelegramChatCarousellListingModel({
					telegramChat: telegramChatId,
					carousellListing: carousellListingId
				})

				await newRelationship.save()
				newRelationships.push(newRelationship)
			}

			return newRelationships
		} catch (error) {
			winston.log(
				'error',
				'An error occurred while bulk creating TelegramChat-CarousellListing relationships.',
				{
					carousellListingId,
					telegramChatIds,
					errorMessage: error.message
				}
			)
			throw error
		}
	}
}

module.exports = TelegramChatCarousellListing
