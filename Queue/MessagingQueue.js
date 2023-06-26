const Queue = require('bull')
const TelegramSender = require('../class/TelegramSender')

const messagingQueue = new Queue('messaging')

// Process messaging jobs.
messagingQueue.process(async (job, done) => {
	// When a messaging job is being processed, send the listing information to the Telegram chat.
	for (const chatId of job.data.chatIds) {
		await new Promise(resolve => setTimeout(resolve, 1000))
		await TelegramSender.sendSingleListing(chatId, job.data.listing)
	}

	done()
})
