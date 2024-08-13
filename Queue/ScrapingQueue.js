// const Queue = require('bull')
// const Scraper = require('../class/Scraper')
// const Keyword = require('../class/Keyword')
// const imageRetrievalQueue = require('./ImageRetrievalQueue')
// const winston = require('../winston')
//
// /**
//  * Represents a job queue for web scraping tasks.
//  * @type {Queue}
//  * @const
//  */
// const scrapingQueue = new Queue('scraping', process.env.REDISURL)
//
// // Process scraping jobs.
// scrapingQueue.process(async (job, done) => {
// 	try {
// 		const scraper = new Scraper(
// 			job.data.link,
// 			job.data.keyword,
// 			job.data.keywordId
// 		)
//
// 		// const telegramChats = await Keyword.getAllTelegramChats(
// 		// 	job.data.keywordId
// 		// )
// 		// const chatIds = telegramChats.map(telegramChat => telegramChat.chatId)
// 		//
// 		// if (chatIds.length === 0) {
// 		// 	done()
// 		// 	return
// 		// }
//
// 		await scraper.scrape()
//
// 		if (scraper.listings.length === 0) {
// 			done()
// 		}
//
// 		await scraper.processListings()
//
// 		await scrapingQueue.add(job.data, {
// 			attempts: 2,
// 			removeOnComplete: true
// 		})
//
// 		// When a scraping job finishes, add a job to the image retrieval queue for each listing.
// 		for (const listing of scraper.listings) {
// 			await imageRetrievalQueue.add(
// 				{
// 					listing,
// 					chatIds,
// 					telegramChats,
// 					keywordId: job.data.keywordId
// 				},
// 				{
// 					attempts: 2,
// 					removeOnComplete: true
// 				}
// 			)
// 		}
//
// 		// Delay before finishing this job and moving on to the next
// 		await new Promise(resolve => setTimeout(resolve, 60 * 1000))
// 		done()
// 	} catch (err) {
// 		done(err)
// 	}
// })
//
// module.exports = scrapingQueue
