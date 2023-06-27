const TelegramSendOption = {
	standard: {},
	forceReply: {
		reply_markup: {
			force_reply: true
		}
	},
	hideKeyboard: {
		reply_markup: {
			hide_keyboard: true
		}
	},
	singleListing(message, listingUrl) {
		const options = {
			caption: message,
			parse_mode: 'HTML'
		}

		if (listingUrl) {
			options.reply_markup = {
				inline_keyboard: [
					[
						{
							text: 'View on Carousell',
							url: listingUrl
						}
					]
				]
			}
		}

		return options
	}
}

module.exports = TelegramSendOption
