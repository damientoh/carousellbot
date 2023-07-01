const Queue = require('bull')
const Scraper = require('../class/Scraper')
const messagingQueue = require('./MessagingQueue')
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

		// When an image retrieval job finishes, add a job to the messaging queue.
		await messagingQueue.add({
			listing: job.data.listing,
			chatIds: job.data.chatIds
		})

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
