const Queue = require('bull')
const Scraper = require('../class/Scraper')
const CarousellListing = require('../class/CarousellListing')
const TelegramChatCarousellListing = require('../class/TelegramChatCarousellListing')
const messagingQueue = require('./MessagingQueue')
const statusCheck = require('./statusCheck.queue')
const winston = require('../winston')

const imageRetrievalQueue = new Queue('image retrieval') // create image retrieval queue

// Process image retrieval jobs.
imageRetrievalQueue.process(async (job, done) => {
	try {
		winston.log('info', 'Start processing image retrieval job', {
			data: job.data
		})

		job.data.listing.imageUrl = await Scraper.getImageUrl(
			job.data.listing.listingUrl
		)

		// Create a new carousell listing
		const carousellListing = await CarousellListing.createNew(
			job.data.listing
		)

		const telegramChatIds = job.data.telegramChats.map(chat => chat._id)
		await TelegramChatCarousellListing.bulkCreate(
			carousellListing._id,
			telegramChatIds
		)

		// When an image retrieval job finishes, add a job to the messaging queue.
		await messagingQueue.add(
			{
				listing: job.data.listing,
				chatIds: job.data.chatIds
			},
			{
				attempts: 2,
				removeOnComplete: true
			}
		)

		await statusCheck.add(
			{
				carousellListing
			},
			{
				attempts: 2,
				removeOnComplete: true,
				delay: 2 * 60 * 60 * 1000 // 2 minutes delay
			}
		)

		// Delay before finishing this job and moving on to the next
		await new Promise(resolve => setTimeout(resolve, 5 * 1000))

		winston.log('info', 'Finished processing image retrieval job', {
			data: job.data
		})
		done()
	} catch (error) {
		winston.log('error', 'Error processing image retrieval job', {
			data: job.data,
			error
		})
		done(error)
	}
})

module.exports = imageRetrievalQueue
