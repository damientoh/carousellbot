const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

// Define the schema for a TelegramChat and CarousellListing relationship.
const TelegramChatCarousellListingSchema = new mongoose.Schema({
		                                                               telegramChat: {
				                                                               type: mongoose.Schema.Types.ObjectId,
				                                                               ref: 'TelegramChat'
		                                                               },
		                                                               carousellListing: {
				                                                               type: mongoose.Schema.Types.ObjectId,
				                                                               ref: 'CarousellListing'
		                                                               }
                                                               })

// Add mongoose paginate to the schema
TelegramChatCarousellListingSchema.plugin(mongoosePaginate)

// Create an ascending index on the telegramChat field.
TelegramChatCarousellListingSchema.index({ telegramChat: 1 })

// Convert our schema into a Model.
module.exports = mongoose.model(
	'TelegramChatCarousellListing',
	TelegramChatCarousellListingSchema
)
