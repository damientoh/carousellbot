const CarousellStatus = require('../class/CarousellStatus')

describe('CarousellStatus', () => {
	test('isSold', async () => {
		const sold = await CarousellStatus.isSold('https://www.carousell.sg/p/ping-g425-max-driver-for-sale-1111874176/')
		expect(sold).toBeTruthy()
		const notSold = await CarousellStatus.isSold('https://www.carousell.sg/p/ping-g425-sft-10-5°-driver-head-only-golf-1210606105/')
		expect(Object.keys(notSold).length).toBe(0)
	})

	test('addToQueue', async () => {
		const listing1 = {
			url: 'testUrl1',
			postedDate: 'testPostedDate1',
			title: 'testTitle1',
			imageUrl: 'testImageUrl1',
			chatId: 'testChatId1',
		}
		const listing2 = {
			url: 'testUrl2',
			postedDate: 'testPostedDate2',
			title: 'testTitle2',
			imageUrl: 'testImageUrl2',
			chatId: 'testChatId2',
		}
		CarousellStatus.addProcess()
		// await CarousellStatus.addToQueue(listing1.url, listing1.postedDate, listing1.title, listing1.imageUrl,
		// listing1.chatId) await CarousellStatus.addToQueue(listing2.url, listing2.postedDate, listing2.title,
		// listing2.imageUrl, listing2.chatId) let allJobs = await CarousellStatus.statusQueue.getRepeatableJobs()
		// await CarousellStatus.addToQueue(listing2.url, listing2.postedDate, listing2.title, listing2.imageUrl,
		// 'chatId3') allJobs = await CarousellStatus.statusQueue.getJobs() console.log(allJobs)

		// listing1.chatId) await CarousellStatus.addToQueue(listing2.url, listing2.postedDate, listing2.title,
		// listing2.imageUrl, listing2.chatId)
	})
})
