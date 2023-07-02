const mongoose = require('mongoose')

/**
 * @typedef {Object} CarousellListing
 * @property {number} carousellId - Unique identifier for the listing
 * @property {string} title - Title of the listing
 * @property {number} price - Price of the listing
 * @property {string} condition - Condition of the item in the listing
 * @property {string} ownerProfileUrl - URL of the owner's profile
 * @property {string} listingUrl - URL of the listing
 * @property {string} imageUrl - URL of the listing image
 */

/**
 * Define the schema for a Carousell listing.
 */
const CarousellListingSchema = new mongoose.Schema(
	{
		carousellId: { type: Number, required: true, unique: true },
		title: { type: String, required: false },
		price: { type: Number, required: false },
		condition: { type: String, required: false },
		ownerProfileUrl: { type: String, required: false },
		listingUrl: { type: String, required: false },
		imageUrl: { type: String, required: false },
		status: {
			type: String,
			required: false,
			enum: ['active', 'deleted', 'sold'],
			default: 'active'
		},
		statusChangeAt: { type: Date, required: false, default: Date.now },
		statusLastCheckedAt: { type: Date, required: false, default: Date.now },
		statusCheckCount: { type: Number, required: false, default: 0 },
		nextDelay: {
			type: Number,
			required: false,
			default: 2 * 60 * 60 * 1000
		}
	},
	{
		timestamps: true // Adds `createdAt` and `updatedAt` fields automatically
	}
)

/**
 * The `mongoose.model` function converts our schema into a Model.
 */
module.exports = mongoose.model('CarousellListing', CarousellListingSchema)
