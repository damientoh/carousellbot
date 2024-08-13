// const Queue = require('bull')
// const TelegramSender = require('../class/TelegramSender')
// const TelegramChat = require('../class/TelegramChat')
// const winston = require('../winston')
//
// const messagingQueue = new Queue('messaging', process.env.REDISURL)
//
// // Process messaging jobs.
// messagingQueue.process(async (job, done) => {
// 	try {
// 		console.log('Processing job started:', job.id)
// 		winston.log('info', 'Messaging job started', {
// 			jobId: job.id,
// 			data: job.data
// 		})
//
// 		// Define the specific chat ID you want to send the message to
// 			const specificChatId = '-1002237927569'
// 		console.log('Specific chat ID defined:', specificChatId)
//
// 		// Check if the specific chat ID has already seen the listing
// 		console.log('Checking if the chat ID has seen the listing...')
// 		const hasSeenId = await TelegramChat.hasSeenId(
// 			specificChatId,
// 			job.data.listing.carousellId
// 		)
// 		console.log('hasSeenId result:', hasSeenId)
//
// 		if (hasSeenId) {
// 			console.log(
// 				`ChatId: ${specificChatId} has already seen listing: ${job.data.listing.carousellId}. Skipping...`
// 			)
// 			winston.log(
// 				'info',
// 				`ChatId: ${specificChatId} has already seen listing: ${job.data.listing.carousellId}. Skipping...`,
// 				{ jobId: job.id, data: job.data }
// 			)
// 		} else {
// 			console.log('Sending the listing to the specific chat ID...')
// 			// Send the listing to the specific chat ID
// 			await TelegramSender.sendSingleListing(specificChatId, job.data.listing)
// 			console.log(
// 				`Listing: ${job.data.listing.carousellId} sent to ChatId: ${specificChatId}`
// 			)
// 			winston.log(
// 				'info',
// 				`Listing: ${job.data.listing.carousellId} sent to ChatId: ${specificChatId}`,
// 				{ jobId: job.id, data: job.data }
// 			)
// 		}
//
// 		console.log('Marking job as done...')
// 		done()
// 		console.log('Messaging job completed:', job.id)
// 		winston.log('info', 'Messaging job completed', { jobId: job.id })
// 	} catch (err) {
// 		console.error('Error occurred during sending the message:', err)
// 		winston.log('error', 'Error occurred during sending the message', {
// 			jobId: job.id,
// 			data: job.data,
// 			error: err
// 		})
// 		done(err)
// 	}
// })
//
// module.exports = messagingQueue
