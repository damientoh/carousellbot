const Queue = require('bull')
const TelegramSender = require('../class/TelegramSender')
const TelegramChat = require('../class/TelegramChat')

const messagingQueue = new Queue('messaging')

// Process messaging jobs.
messagingQueue.process(async (job, done) => {
	// When a messaging job is being processed, send the listing information to the Telegram chat.
	for (const chatId of job.data.chatIds) {
		await new Promise(resolve => setTimeout(resolve, 1000))
		if (
			!(await TelegramChat.hasSeenId(
				chatId,
				job.data.listing.carousellId
			))
		) {
			await TelegramSender.sendSingleListing(chatId, job.data.listing)
		}
	}

	done()
})

module.exports = messagingQueue
