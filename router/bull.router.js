const QueueMQ = require('bullmq')
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const scrapingQueue = require('../Queue/ScrapingQueue')

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
	queues: [new BullAdapter(scrapingQueue)],
	serverAdapter: serverAdapter
})

module.exports = serverAdapter
