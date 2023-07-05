const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

/**
 * Define the schema for a Carousell listing.
 */
const CarousellListingSchema = new mongoose.Schema(
	{
		carousellId: { type: Number, required: true, unique: true },
		title: { type: String, required: false },
		price: { type: String, required: false },
		condition: { type: String, required: false },
		ownerProfileUrl: { type: String, required: false },
		listingUrl: { type: String, required: false },
		imageUrl: { type: String, required: false },
		status: {
			type: String,
			required: false,
			enum: ['active', 'deleted', 'sold', 'reserved', 'not tracking'],
			default: 'active'
		},
		statusChangeAt: { type: Date, required: false, default: Date.now },
		statusLastCheckedAt: { type: Date, required: false, default: Date.now },
		statusCheckCount: { type: Number, required: false, default: 0 },
		nextDelay: {
			type: Number,
			required: false,
			default: 2 * 60 * 60 * 1000
		},
		keyword: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Keyword'
		}
	},
	{
		timestamps: true // Adds `createdAt` and `updatedAt` fields automatically
	}
)

// Add the plugin to your schema
CarousellListingSchema.plugin(mongoosePaginate)

/**
 * The `mongoose.model` function converts our schema into a Model.
 */
module.exports = mongoose.model('CarousellListing', CarousellListingSchema)
