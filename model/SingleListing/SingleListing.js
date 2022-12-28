const mongoose = require('mongoose')

const SingleListingSchema = new mongoose.Schema({
	owner: {
		type: String,
	},
	ownerProfileUrl: {
		type: String,
	},
	postedDate: {
		type: Date,
	},
	title: {
		type: String,
	},
	price: {
		type: Number,
	},
	condition: {
		type: String,
	},
	listingUrl: {
		type: String,
	},
	carousellId: {
		type: String,
	}
})

const SingleListing = mongoose.model('SingleListing', SingleListingSchema)

module.exports = { SingleListingSchema, SingleListing }
