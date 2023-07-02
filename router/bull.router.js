const QueueMQ = require('bullmq')
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const scrapingQueue = require('../Queue/ScrapingQueue')
const imageRetrievalQueue = require('../Queue/ImageRetrievalQueue')
const messagingQueue = require('../Queue/MessagingQueue')
const statusCheck = require('../Queue/statusCheck.queue')

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
	queues: [
		new BullAdapter(scrapingQueue),
		new BullAdapter(imageRetrievalQueue),
		new BullAdapter(messagingQueue),
		new BullAdapter(statusCheck)
	],
	serverAdapter: serverAdapter
})

module.exports = serverAdapter
