const Queue = require('bull')
const TelegramSender = require('../class/TelegramSender')
const TelegramChat = require('../class/TelegramChat')
const winston = require('../winston')

const messagingQueue = new Queue('messaging')

// Process messaging jobs.
messagingQueue.process(async (job, done) => {
	try {
		winston.log('info', 'Messaging job started', {
			jobId: job.id,
			data: job.data
		})

		// When a messaging job is being processed, send the listing information to the Telegram chat.
		for (const chatId of job.data.chatIds) {
			await new Promise(resolve => setTimeout(resolve, 1000))

			const hasSeenId = await TelegramChat.hasSeenId(
				chatId,
				job.data.listing.carousellId
			)

			if (hasSeenId) {
				winston.log(
					'info',
					`ChatId: ${chatId} has already seen listing: ${job.data.listing.carousellId}. Skipping...`,
					{ jobId: job.id, data: job.data }
				)
				continue
			}

			await TelegramSender.sendSingleListing(chatId, job.data.listing)
			winston.log(
				'info',
				`Listing: ${job.data.listing.carousellId} sent to ChatId: ${chatId}`,
				{ jobId: job.id, data: job.data }
			)
		}

		done()
		winston.log('info', 'Messaging job completed', { jobId: job.id })
	} catch (err) {
		winston.log('error', 'Error occurred during sending the message', {
			jobId: job.id,
			data: job.data,
			error: err
		})
		done(err)
	}
})

module.exports = messagingQueue
