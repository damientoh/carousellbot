const mongoose = require('mongoose')

const TelegramChatSchema = new mongoose.Schema({
	chatId: {
		type: Number,
		required: true,
		unique: true
	},
	keywords: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Keyword'
		}
	],
	seenIds: [
		{
			type: Number,
			default: []
		}
	]
})

const TelegramChatModel = mongoose.model('TelegramChat', TelegramChatSchema)

module.exports = TelegramChatModel
