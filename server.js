const express = require('express')
require('dotenv').config()
const { connectToDb } = require('./database/database')
const scrapingQueue = require('./Queue/ScrapingQueue')
const serverAdapter = require('./router/bull.router')
const winston = require('./winston')
const Keyword = require('./class/Keyword')

// Initiate app
const app = express()

// Initialize
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
require('./class/TelegramBot')
const Scraper = require("./class/Scraper");

// Use the bull board router
app.use('/admin/queues', serverAdapter.getRouter())
// Register the main router
app.use('/', require('./router/main.router'))

// App listen
app.listen(process.env.PORT || 3000, async () => {
	winston.log(
		'info',
		`Server is listening to PORT ${process.env.PORT || 3000}`
	)
	await connectToDb()

	// Empty the queue
	await scrapingQueue.empty()

	// Clean all completed jobs from queue
	await scrapingQueue.clean(0, 'completed')

	// Clean all failed jobs from queue
	await scrapingQueue.clean(0, 'failed')

	// Clean all delayed jobs from queue
	await scrapingQueue.clean(0, 'delayed')

	// Clean all active jobs from queue
	await scrapingQueue.clean(0, 'active')

	await Keyword.addAllKeywordsToQueue()
})
