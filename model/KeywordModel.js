const mongoose = require('mongoose')

// Define the schema for the Keyword model
const KeywordSchema = new mongoose.Schema({
	link: {
		type: String,
		required: true
	},
	keyword: {
		type: String,
		required: true
	},
	telegramChats: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'TelegramChat'
		}
	],
	prevIds: {
		type: [Number],
		default: []
	}
})

// Create the KeywordModel based on the schema
const KeywordModel = mongoose.model('Keyword', KeywordSchema)

module.exports = KeywordModel
