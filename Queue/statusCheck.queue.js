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
				const listingId = job.data.carousellListing._id
				const statusCheckCount = job.data.carousellListing.statusCheckCount

				// Create a ListingStatus object for the provided URL
				const listingStatusChecker = new ListingStatus(listingUrl)

				// Get the status of the Carousell listing
				const status = await listingStatusChecker.getStatus()

				if (status !== 'active') {
						// Set the status if not active
						await CarousellListing.setStatus(listingId, status)
				} else {
						if (statusCheckCount > 200) {
								done()
								return
						}

						// Increase the status check count if still active
						const carousellListing =
							await CarousellListing.increaseStatusCheckCount(
								listingId,
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
		try {
				// Destructure the job data
				const listingId = job.data.carousellListing._id

				// Mark the listing as 'sold'
				await CarousellListing.setStatus(listingId, 'sold')
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
})

module.exports = statusCheckQueue