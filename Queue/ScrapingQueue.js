const Queue = require('bull')
const Scraper = require('../class/Scraper')
const Keyword = require('../class/Keyword')
const imageRetrievalQueue = require('./ImageRetrievalQueue')
const winston = require('../winston')

/**
 * Represents a job queue for web scraping tasks.
 * @type {Queue}
 * @const
 */
const scrapingQueue = new Queue('scraping')

// Process scraping jobs.
scrapingQueue.process(async (job, done) => {
	try {
		winston.log('info', 'Start processing scraping job', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		const scraper = new Scraper(
			job.data.link,
			job.data.keyword,
			job.data.keywordId
		)

		winston.log('info', 'Initialized scraper', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		const chatIds = await Keyword.getChatIds(job.data.keywordId)
		winston.log('info', 'Retrieved chatIds', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			chatIds,
			jobData: job.data
		})

		if (chatIds.length === 0) {
			winston.log('info', 'No chatIds found', {
				jobId: job.id,
				keywordId: job.data.keywordId,
				jobData: job.data
			})
			done()
			return
		}

		await scraper.scrape()
		winston.log('info', 'Scraping completed', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		if (scraper.listings.length === 0) {
			winston.log('info', 'Deleted invalid url job from scraping queue', {
				jobId: job.id,
				keywordId: job.data.keywordId,
				jobData: job.data
			})
			done()
		}

		await scraper.processListings()
		winston.log('info', 'Listings processed', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		await scrapingQueue.add(job.data, {
			attempts: 2,
			removeOnComplete: true
		})
		winston.log('info', 'Added job back to scraping queue', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		// When a scraping job finishes, add a job to the image retrieval queue for each listing.
		for (const listing of scraper.listings) {
			await imageRetrievalQueue.add(
				{ listing, chatIds },
				{
					attempts: 2,
					removeOnComplete: true
				}
			)
			winston.log('info', 'Added job to image retrieval queue', {
				jobId: job.id,
				keywordId: job.data.keywordId,
				listing,
				chatIds,
				jobData: job.data
			})
		}

		// Delay before finishing this job and moving on to the next
		await new Promise(resolve => setTimeout(resolve, 10 * 1000))
		winston.log('info', 'Finished processing scraping job', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data
		})

		done()
	} catch (err) {
		winston.log('error', 'Unable to scrape listing', {
			jobId: job.id,
			keywordId: job.data.keywordId,
			jobData: job.data,
			error: err.message
		})
		// Retry
		await scrapingQueue.add(job.data.keywordId, job.data, { attempts: 2 })
		done(err)
	}
})

module.exports = scrapingQueue
