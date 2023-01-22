const mongoose = require('mongoose')

const ListingScraperSchema = new mongoose.Schema({
	keyword: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		required: true
	},
	categoryUrl: {
		type: String,
		required: true
	},
	usage: {
		type: Number,
		required: true,
	},
	lastScraped: {
		type: Date,
	},
	lastFetchIds: [
		{
			type: String,
		},
	],
	notification: [
		{
			type: mongoose.Types.ObjectId,
			ref: 'Notification',
		},
	],
})

ListingScraperSchema.pre('save', function (next) {
	this.keyword = this.keyword.toLowerCase()
	next()
})

module.exports = ListingScraperSchema
