// const cheerio = require('cheerio')
// const axios = require('axios')
// const Queue = require('bull')
// const Notifier = require('../class/Notifier')
//
// class CarousellStatus {
// 	static statusQueue = new Queue('status', {
// 		limiter: {
// 			max: 1,
// 			duration: 1000
// 		}
// 	})
// 	static notifier = Notifier
// 	static jobName = 'get-status'
// 	static delay = 6 * 60 * 60 * 1000
//
// 	static async isSold(url) {
// 		const response = await axios.get(url)
// 		const $ = cheerio.load(response.data)
// 		const isSold = $('*:contains(\'Listing sold\')').length
// 		if (isSold) {
// 			return {
// 				priceSold: $('meta[name="twitter:data1"]').attr('content')
// 			}
// 		}
// 		return {}
// 	}
//
// 	static async addToQueue(url, postedDate, title, imageUrl, chatId) {
// 		const job = await this.statusQueue.getJob(url)
// 		const data = {
// 			url,
// 			postedDate,
// 			title,
// 			imageUrl,
// 			chatIds: [chatId],
// 			tries: 0
// 		}
// 		if (job) {
// 			data.chatIds.push(...job.data.chatIds)
// 			await this.statusQueue.remove(url)
// 		}
// 		return await this.statusQueue.add(this.jobName, data, { delay: this.delay, jobId: url })
//
// 		// const jobArray = await this.statusQueue.getRepeatableJobs()
// 		// const jobInfo = jobArray.find(job => job.key === url)
// 		// let job = { url, postedDate, title, imageUrl, chatIds: [chatId] }
// 		// if (jobInfo) {
// 		// 	const jobs = await this.statusQueue.getJobs()
// 		// 	job = jobs.find(job => job.data.url === jobInfo.id)
// 		//
// 		// 	job.data.chatIds.push(chatId)
// 		// 	await this.statusQueue.removeRepeatable(this.jobName, this.repeatOptions, job.id)
// 		//
// 		// }
// 		//
// 		// return await this.statusQueue.add(this.jobName, { url, postedDate, title, imageUrl, chatIds: [chatId] },
// 		// 	{ repeat: this.repeatOptions, jobId: url, })
// 	}
//
// 	static addProcess() {
// 		this.statusQueue.process(async (job, done) => {
// 			const { url } = job.data
// 			const isSold = await this.isSold(url)
// 			if (!isSold) {
// 				job.data += 1
// 				await this.statusQueue.add(this.jobName, job.data, { delay: this.delay, jobId: url })
// 				return done()
// 			}
// 			await this.notifier.sendSoldListings(job.data, isSold.priceSold)
// 			await this.removeFromQueue(url)
// 			done()
// 		})
// 	}
//
// 	static async removeFromQueue(url) {
// 		await this.statusQueue.remove(url)
// 	}
// }
//
// module.exports = CarousellStatus
