const Queue = require('bull')
const Scraper = require('../class/Scraper')
const messagingQueue = require('./MessagingQueue')
const winston = require('../winston')

const imageRetrievalQueue = new Queue('imageRetrieval')

// Process image retrieval jobs.
imageRetrievalQueue.process(async (job, done) => {
	winston.log('info', 'Start processing image retrieval job', {
		data: job.data
	})

	try {
		// Delay before starting
		await new Promise(resolve => setTimeout(resolve, 5 * 1000))

		job.data.listing.imageUrl = await Scraper.getImageUrl(
			job.data.listing.listingUrl
		)
		winston.log('info', 'Image URL retrieved successfully', {
			data: job.data
		})
	} catch (error) {
		winston.log('error', 'Error retrieving image URL', {
			data: job.data,
			error
		})
	}

	try {
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
		winston.log('info', 'Added job to messaging queue', {
			data: job.data
		})
	} catch (error) {
		winston.log('error', 'Error adding job to messaging queue', {
			data: job.data,
			error
		})
	}

	winston.log('info', 'Finished processing image retrieval job', {
		data: job.data
	})

	done()
})

module.exports = imageRetrievalQueue
