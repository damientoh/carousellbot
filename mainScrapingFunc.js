const mongoose = require('mongoose')
const Scraper = require('./class/Scraper')
const KeywordModel = require('./model/KeywordModel')
const { connectToDb } = require('./database/database') // Adjust the path based on your project structure
require('dotenv').config()
const bot = require('./class/TelegramBot')

/**
 * Main function to scrape all keywords and log the listings.
 */
async function mainScrapingFunc() {
	try {
		await connectToDb()
		console.log('Starting mainScrapingFunc...')

		// Find all keywords in the database
		console.log('Fetching all keywords from the database...')
		const keywords = await KeywordModel.find().exec()
		console.log('Found keywords:', keywords.length)

		// Iterate over each keyword and perform scraping
		for (const keyword of keywords) {
			console.log(
				`Processing keyword: ${keyword.keyword}, link: ${keyword.link}`
			)

			const scraper = new Scraper(
				keyword.link,
				keyword.keyword,
				keyword._id
			)
			console.log('Scraper instance created:', scraper)

			// Perform the scraping
			console.log('Starting scrape...')
			await scraper.scrape()
			console.log(
				'Scrape completed. Listings found:',
				scraper.listings.length
			)

			// Process the listings
			await scraper.processListings()
			console.log('Listings processed.')

			// Send listings to the Telegram channel if any
			if (scraper.listings.length > 0) {
				console.log(`Listings for keyword "${keyword.keyword}":`)

				for (const listing of scraper.listings) {
					console.log('Sending listing to Telegram:', listing)

					// Compose the message
					const message = `<b>${listing.title}</b>\n${listing.price}\n${listing.postedDate}`

					// Send the message with the image and a "View Listing" button to the Telegram channel
					await bot.sendPhoto(
						'-1002237927569', // Replace with your actual channel username or ID
						listing.imageUrl,
						{
							caption: message,
							parse_mode: 'HTML',
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: 'View Listing',
											url: listing.listingUrl
										}
									]
								]
							}
						}
					)

					console.log(
						'Listing sent to Telegram channel:',
						listing.title
					)
				}
			} else {
				console.log(
					`No new listings found for keyword "${keyword.keyword}".`
				)
			}

			console.log(`Finished processing keyword: ${keyword.keyword}`)
		}

		console.log('Scraping completed for all keywords.')
	} catch (error) {
		console.error('Error in mainScrapingFunc:', error)

		// Send error message to Telegram
		await bot.sendMessage(
			'-1002237927569', // Replace with your actual channel username or ID
			`ERROR: ${error.message}`
		)
	}
}

module.exports = mainScrapingFunc
