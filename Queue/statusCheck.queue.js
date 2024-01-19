const Queue = require('bull')
const ListingStatus = require('../class/ListingStatus')
const CarousellListing = require('../class/CarousellListing')
const winston = require('../winston')

// Create a status check queue
const statusCheckQueue = new Queue('statusCheckQueue')

statusCheckQueue.process(async (job, done) => {
	try {
		// Delay
		await new Promise(resolve => setTimeout(resolve, 5 * 1000))

		// Destructure the job data
		const listingUrl = job.data.carousellListing.listingUrl
		const carousellId = job.data.carousellListing.carousellId
		const statusCheckCount = job.data.carousellListing.statusCheckCount

		// Create a ListingStatus object for the provided URL
		const listingStatusChecker = new ListingStatus(listingUrl)

		// Get the status of the Carousell listing
		const status = await listingStatusChecker.getStatus()

		if (status !== 'active') {
			// Set the status if not active
			await CarousellListing.setStatus(carousellId, status)
		} else {
			if (statusCheckCount > 200) {
				await CarousellListing.setStatus(carousellId, 'not tracking')
				done()
				return
			}

			// Increase the status check count if still active
			const carousellListing =
				await CarousellListing.increaseStatusCheckCount(
					carousellId,
					statusCheckCount
				)

			// Add the job back to the queue for another check later
			await statusCheckQueue.add(
				{ carousellListing },
				{
					attempts: 2,
					removeOnComplete: true,
					delay: carousellListing.nextDelay
				}
			)
		}

		// Call the 'done' method to indicate successful processing
		done()
	} catch (error) {
		// Log the error using Winston
		winston.log(
			'error',
			'An error occurred during status check processing',
			{
				jobData: job.data,
				errorMessage: error.message
			}
		)

		// Call the 'done' method with the error to indicate processing failure
		done(error)
	}
})

statusCheckQueue.on('failed', async (job, error) => {
	// Check if the attempts made are more than 1
	if (job.attemptsMade > 1) {
		try {
			// Destructure the job data
			const carousellId = job.data.carousellListing.carousellId

			// Mark the listing as 'deleted'
			await CarousellListing.setStatus(carousellId, 'deleted')
		} catch (error) {
			// Log the error using Winston
			winston.log(
				'error',
				'An error occurred during status check failure processing',
				{
					jobData: job.data,
					errorMessage: error.message
				}
			)
		}
	}
})

module.exports = statusCheckQueue
