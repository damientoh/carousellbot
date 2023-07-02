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

		try {
			// Try to retrieve the image URL from the listing
			job.data.listing.imageUrl = await Scraper.getImageUrl(
				job.data.listing.listingUrl
			)
		} catch (error) {
			// Log any errors that occur during this process
			winston.log('error', 'Error retrieving image URL', {
				data: job.data,
				errorMessage: error.message
			})
			throw error
		}

		// Check if CarousellListing exists before creating a new one
		let carousellListing = await CarousellListing.findByCarousellId(
			job.data.listing.carousellId
		)
		if (!carousellListing) {
			try {
				// Try to create a new CarousellListing
				carousellListing = await CarousellListing.createNew({
					...job.data.listing,
					keyword: job.data.keywordId
				})
			} catch (error) {
				// Log any errors that occur during this process
				winston.log('error', 'Error creating Carousell listing', {
					data: job.data,
					errorMessage: error.message
				})
				throw error
			}
		}

		let telegramChatIds
		try {
			// Map chat IDs
			telegramChatIds = job.data.telegramChats.map(chat => chat._id)
			await TelegramChatCarousellListing.bulkCreate(
				carousellListing._id,
				telegramChatIds
			)
		} catch (error) {
			// Log any errors that occur during this process
			winston.log(
				'error',
				'Error creating TelegramChatCarousellListing',
				{
					data: job.data,
					errorMessage: error.message
				}
			)
			throw error
		}

		// When an image retrieval job finishes, add a job to the messaging queue.
		try {
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
		} catch (error) {
			// Log any errors that occur during this process
			winston.log('error', 'Error adding job to messaging queue', {
				data: job.data,
				errorMessage: error.message
			})
			throw error
		}

		// Add a status check job
		try {
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
		} catch (error) {
			// Log any errors that occur during this process
			winston.log('error', 'Error adding job to status check queue', {
				data: job.data,
				errorMessage: error.message
			})
			throw error
		}

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
