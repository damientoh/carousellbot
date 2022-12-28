const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
	chatId: String,
	listingScraper: [
		{
			type: mongoose.Types.ObjectId,
			ref: 'ListingScraper',
		},
	],
	seenIds: [String]
})

module.exports = NotificationSchema
