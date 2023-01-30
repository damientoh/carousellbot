const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
	chatId: String,
	listingScraper: [
		{
			type: mongoose.Types.ObjectId,
			ref: 'ListingScraper',
		},
	],
	seenIds: [String],
	isPremium: Boolean
})

module.exports = NotificationSchema
