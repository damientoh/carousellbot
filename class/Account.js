const Notification = require('../model/Notification/Notification')

class Account {
	static keywordMax = 2
	static premiumKeywordMax = 15

	static async upgrade(chatId) {
		
	}

	static async downgrade(chatId) {

	}

	static async canAddKeyWord(chatId) {
		const notification = await this.getNotification(chatId)
		const isPremium = notification.isPremium
		const numOfKeywords = notification.listingScraper.length
		if (isPremium) {
			return numOfKeywords < this.premiumKeywordMax
		}
		return notification.listingScraper.length < this.keywordMax
	}

	static async getNotification(chatId) {
		return Notification.findByChatId(chatId)
	}

}
