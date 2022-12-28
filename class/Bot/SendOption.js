const SendOption = {
	standard: {},
	forceReply: {
		reply_markup: {
			force_reply: true,
		},
	},
	hideKeyboard: {
		reply_markup: {
			hide_keyboard: true,
		},
	},
	singleListing(message, listingUrl) {
		if (listingUrl) {
			return {
				caption: message,
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'View on Carousell',
								url: listingUrl || 'https://example.com',
							},
						],
					],
				},
			}
		} else {
			return {
				caption: message,
				parse_mode: 'HTML',
			}
		}
	},
}

module.exports = SendOption
