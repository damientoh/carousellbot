const CarousellListingModel = require('../model/carouselllisting.model')
const winston = require('../winston')

/**
 * Class representing a CarousellListing. Interacts with the Mongoose model.
 */
class CarousellListing {
	/**
	 * Create a new CarousellListing.
	 * @param {Object} listingData - The data for the new listing.
	 * @returns {Promise<Object>} The saved listing document.
	 */
	static async createNew(listingData) {
		try {
			const listing = new CarousellListingModel(listingData)
			return await listing.save()
		} catch (error) {
			winston.log(
				'error',
				'An error occurred during the creation of a new listing',
				{
					carousellId: listingData.carousellId,
					errorMessage: error.message
				}
			)
			throw error
		}
	}

	/**
	 * Find a CarousellListing by carousellId.
	 * @param {number} carousellId - The carousellId of the listing to find.
	 * @returns {Promise<Object>} The found listing document.
	 */
	static async findByCarousellId(carousellId) {
		try {
			return await CarousellListingModel.findOne({ carousellId })
		} catch (error) {
			winston.log(
				'error',
				'An error occurred during the search for a listing',
				{ carousellId, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Update imageUrl of a CarousellListing by carousellId.
	 * @param {number} carousellId - The carousellId of the listing to update.
	 * @param {string} imageUrl - The new imageUrl.
	 * @returns {Promise<Object>} The updated listing document.
	 */
	static async updateImageUrl(carousellId, imageUrl) {
		try {
			return await CarousellListingModel.findOneAndUpdate(
				{ carousellId },
				{ imageUrl },
				{ new: true }
			)
		} catch (error) {
			winston.log(
				'error',
				"An error occurred during the update of a listing's imageUrl",
				{ carousellId, imageUrl, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Set status of a CarousellListing by carousellId.
	 * @param {number} carousellId - The carousellId of the listing to update.
	 * @param {string} status - The new status.
	 * @returns {Promise<Object>} The updated listing document.
	 */
	static async setStatus(carousellId, status) {
		try {
			return await CarousellListingModel.findOneAndUpdate(
				{ carousellId },
				{ status, statusChangeAt: new Date() },
				{ new: true }
			)
		} catch (error) {
			winston.log(
				'error',
				'An error occurred during the status update process',
				{ carousellId, status, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Increase statusCheckCount and update statusLastCheckedAt of a CarousellListing by carousellId.
	 * @param {number} carousellId - The carousellId of the listing to update.
	 * @param {number} statusCheckCount - The current status check count.
	 * @returns {Promise<Object>} The updated listing document.
	 */
	static async increaseStatusCheckCount(carousellId, statusCheckCount) {
		try {
			const nextDelay = CarousellListing.getNextDelay(
				statusCheckCount + 1
			)

			return await CarousellListingModel.findOneAndUpdate(
				{ carousellId },
				{
					$inc: { statusCheckCount: 1 }, // Increment statusCheckCount by 1
					statusLastCheckedAt: new Date(), // Update the statusLastCheckedAt to the current
					// date and time
					nextDelay // Update the delay field with the next delay
				},
				{ new: true } // Return the updated document
			)
		} catch (error) {
			winston.log(
				'error',
				'An error occurred during the update of status check count',
				{ carousellId, errorMessage: error.message }
			)
			throw error
		}
	}

	/**
	 * Get the next delay for status check based on the status check count.
	 * @param {number} statusCheckCount - The status check count of the listing.
	 * @returns {number} The delay in milliseconds.
	 */
	static getNextDelay(statusCheckCount) {
		const MAX_STATUS_CHECK_COUNT = 40
		const SIX_HOURS = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
		const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

		if (statusCheckCount < MAX_STATUS_CHECK_COUNT) {
			return SIX_HOURS
		} else {
			return TWENTY_FOUR_HOURS
		}
	}

	/**
	 * Get paginated CarousellListing with query conditions.
	 * @param {Object} query - The query conditions.
	 * @param {number} page - The page number (starts from 1).
	 * @param {number} limit - The number of items per page.
	 * @param {Object} sort - The sorting conditions.
	 * @returns {Promise<Object>} The result containing docs and other pagination info.
	 */
	static async getPaginatedListings(
		query = {},
		page = 1,
		limit = 10,
		sort = {}
	) {
		try {
			return await CarousellListingModel.paginate(query, {
				page,
				limit,
				sort
			})
		} catch (error) {
			winston.log(
				'error',
				'An error occurred during the retrieval of paginated listings',
				{ errorMessage: error.message }
			)
			throw error
		}
	}
}

module.exports = CarousellListing
