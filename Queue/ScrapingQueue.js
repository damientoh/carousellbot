const Queue = require('bull')
const Scraper = require('../class/Scraper')
const Keyword = require('../class/Keyword')
const imageRetrievalQueue = require('./ImageRetrievalQueue')

const scrapingQueue = new Queue('scraping')

// Process scraping jobs.
scrapingQueue.process(async (job, done) => {
	try {
		const scraper = new Scraper(
			job.data.link,
			job.data.keyword,
			job.data.keywordId
		)
		const chatIds = await Keyword.getChatIds(job.data.keywordId)

		if (chatIds.length === 0) {
			done()
			return
		}

		await scraper.scrape()

		// Re-add the job to the queue
		await scrapingQueue.add(job.data)

		// When a scraping job finishes, add a job to the image retrieval queue for each listing.
		for (const listing of scraper.listings) {
			await imageRetrievalQueue.add({ listing, chatIds })
		}

		// Delay before finishing this job and moving on to the next
		await new Promise(resolve => setTimeout(resolve, 120 * 1000))

		done()
	} catch (err) {
		done(err)
	}
})

module.exports = scrapingQueue
