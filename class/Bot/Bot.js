const BotMessage = require('./BotMessage')
const SendOption = require('./SendOption')
const Notification = require('../../model/Notification/Notification')
const TelegramBot = require('node-telegram-bot-api')
const ListingScraper = require('../../model/ListingScraper/ListingScraper')
const carousellCategories = require('../../static/carousellCategories')
const validator = require('validator')
const Login = require('../Login')

class Bot {
	botMessage = BotMessage
	sendOption = SendOption
	isDebug

	constructor() {
		this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
			polling: true,
		})
		this.botMessage = BotMessage
		this.sendOption = SendOption
		this.categories = carousellCategories
		this.isDebug = true
	}

	async startBot() {
		// this.bot.on('message', await this.doMessage.bind(this))
		this.bot.onText(/\/start/, this.doStart.bind(this))
		this.bot.onText(/\/addkeyword/, await this.doAddNewKeyword.bind(this))
		this.bot.onText(/\/seekeywords/, await this.doSeeAllKeywords.bind(this))
		this.bot.onText(/\/deletekeyword/, await this.doDeleteKeywords.bind(this))
		this.bot.onText(/\/getlogincode/, this.doLogin.bind(this))
		this.bot.onText(/\/closekeyboard/, this.doHideKeyboard.bind(this))
		// this.bot.on('callback_query', await this.doCallbackQuery.bind(this))
		this.startDebug()
	}

	startDebug() {
		if (this.isDebug) {
			this.bot.on('polling_error', error => {
				console.error(error)
			})
		}
	}

	async delay(time) {
		return new Promise(resolve => {
			setTimeout(resolve, time)
		})
	}

	async validateChat(msg) {
		const chatId = msg.chat.id
		if (!(await Notification.chatExists(chatId))) {
			const notification = new Notification({ chatId })
			await notification.save()
		}
	}

	async doStart(msg) {
		const chatId = msg.chat.id
		await this.sendMessage(
			chatId,
			BotMessage.welcomeMessage,
			this.sendOption.standard
		)
	}

	async doSeeAllKeywords(msg) {
		await this.validateChat(msg)

		const chatId = msg.chat.id
		const formattedKeywords = await this.getFormattedScrapers(chatId)
		await this.sendMessage(chatId, formattedKeywords, this.sendOption.standard)
	}

	async doDeleteKeywords(msg) {
		await this.validateChat(msg)

		const chatId = msg.chat.id
		const formattedKeywords = await this.getFormattedScrapers(chatId)
		await this.sendMessage(chatId, formattedKeywords)

		const indexPrompt = await this.sendMessage(
			chatId,
			BotMessage.indexToDelete,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			indexPrompt.message_id,
			async function (indexMessage) {
				const index = -1 + parseInt(indexMessage.text)
				const notification = await Notification.findByChatId(chatId)
				const allKeywords = await notification.getKeywordsWithCategory()

				if (Number.isNaN(index) || !(index < allKeywords.length) || index < 0) {
					return await this.sendMessage(
						chatId,
						BotMessage.invalidKeywordNumber
					)
				}

				await notification.deleteKeywordByIndex(index)

				await this.sendMessage(
					chatId,
					BotMessage.keywordDeleted(allKeywords[index].keyword),
					this.sendOption.standard
				)
			}.bind(this)
		)
	}

	async doAddNewKeyword(msg) {
		await this.validateChat(msg)
		const chatId = msg.chat.id
		await this.requestCategory(chatId)
	}

	async doLogin(msg) {
		await this.validateChat(msg)
		const chatId = msg.chat.id
		const loginCode = await Login.initialize(chatId)

		await this.sendMessage(chatId, this.botMessage.login(loginCode), this.sendOption.standard)
	}

	async requestKeyword(chatId, categoryIndex) {
		const keywordPrompt = await this.sendMessage(
			chatId,
			BotMessage.enterKeyword,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			keywordPrompt.message_id,
			async function (keywordMessage) {
				const keyword = this.beautifyKeyword(keywordMessage.text)
				if (!this.isValidKeyword(keyword)) {
					return await this.sendMessage(chatId, BotMessage.invalidKeyword, this.sendOption.standard)
				}

				const category = this.getCategoryNameByIndex(categoryIndex)
				const categoryUrl = this.categories[this.getCategoryNameByIndex(categoryIndex)]

				if (await Notification.hasKeyword(chatId, keyword, categoryUrl)) {
					return await this.sendMessage(
						chatId,
						this.botMessage.keywordExists(keyword),
						this.sendOption.standard
					)
				}

				await Notification.addKeyword(chatId, keyword, category, categoryUrl)
				await this.sendMessage(
					chatId,
					this.botMessage.keywordAddedSuccessfully(keyword),
					this.sendOption.standard
				)
				await this.sendMessage(
					chatId,
					await this.getFormattedScrapers(chatId),
					this.sendOption.standard
				)

			}.bind(this)
		)
	}

	beautifyKeyword(keyword) {
		return keyword.trim().toLowerCase()
	}

	isValidKeyword(keyword) {
		keyword = this.beautifyKeyword(keyword)
		return validator.isAlphanumeric(keyword) || keyword === '*'
	}

	async requestCategory(chatId) {
		await this.sendMessage(chatId, this.formatCategories(), this.sendOption.standard)

		const categoryPrompt = await this.sendMessage(
			chatId,
			BotMessage.selectCategory,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			categoryPrompt.message_id,
			async function (categoryMessage) {
				const categoryIndex = parseInt(categoryMessage.text) - 1
				if (!this.isValidCategoryIndex(categoryIndex)) {
					return await this.sendMessage(chatId, this.botMessage.invalidCategory, this.sendOption.standard)
				}
				await this.requestKeyword(chatId, categoryIndex)
			}.bind(this)
		)
	}

	getCategoryNameByIndex(index) {
		return Object.keys(this.categories)[index]
	}

	isValidCategoryIndex(categoryIndex) {
		return Number.isInteger(categoryIndex) && categoryIndex >= 0 && categoryIndex < Object.keys(this.categories).length
	}

	doHideKeyboard(msg) {
		const chatId = msg.chat.id
		return this.sendMessage(
			chatId,
			this.botMessage.keyboardClosed,
			this.sendOption.hideKeyboard
		)
	}

	async getFormattedScrapers(chatId) {
		const notification = await Notification.findByChatId(chatId)
		const allScrapers = await notification.getKeywordsWithCategory()
		return this.formatScrapers(allScrapers)
	}

	formatScrapers(allScrapers) {
		let result = ''

		if (!allScrapers) {
			return this.botMessage.noKeyword
		}

		allScrapers.forEach((scraper, index) => {
			index++
			result += index + '. ' + scraper.keyword + ' in ' + scraper.category + '\n'
		})

		result += '\n'
		result += this.botMessage.numOfKeyword(allScrapers.length)

		return result
	}

	formatListing(listing, keyword, category) {
		if (listing) {
			let result = ''
			result += '(' + keyword + ' in ' + category + ') '
			result += listing.title + '\n'
			result += '<strong>' + listing.price + '</strong>\n'
			result += listing.postedDate

			return result
		}

		return BotMessage.listingError
	}

	async sendSingleListing(chatId, listing, keyword, category) {
		if (listing) {
			try {
				if (!listing.listingUrl || !listing.imageUrl) {
					throw new Error(this.botMessage.invalidUrlOrImage)
				}
				await this.sendMessageWithPhoto(
					chatId,
					listing.imageUrl,
					this.sendOption.singleListing(
						this.formatListing(listing, keyword, category),
						listing.listingUrl
					)
				)
			} catch (error) {
				throw error
			}
		}
	}

	async sendManyListings(chatId, manyListings, keyword, category) {
		if (manyListings) {
			for (const listing of manyListings) {
				try {
					listing.imageUrl = await ListingScraper.getImageUrl(listing.listingUrl)
					await this.sendSingleListing(chatId, listing, keyword, category)
					await this.delay(1000)
				} catch (error) {
					throw error
				}
			}
		}
	}

	async sendMessage(chatId, message, options) {
		return await this.bot.sendMessage(chatId, message, options)
	}

	async sendMessageWithPhoto(chatId, imageUrl, options) {
		try {
			return await this.bot.sendPhoto(chatId, imageUrl, options)
		} catch (error) {
			throw error
		}
	}

	formatCategories() {
		let result = ''
		let index = 1
		for (const category in this.categories) {
			result += index + '. ' + category + '\n'
			index++
		}
		return result
	}

	// TODO work on this send sold listing
	async sendSoldListing(data, priceSold, chatId) {
		const options = this.sendOption.singleListing(this.formatSoldListing(data.title, data.postedDate, priceSold),
		                                              data.url)
		await this.sendMessageWithPhoto(chatId, data.imageUrl, options)
	}

	formatSoldListing(title, postedDate, priceSold) {
		const differenceInCalendarDays = require('date-fns/differenceInCalendarDays')
		const days = differenceInCalendarDays(new Date(postedDate), Date.now())
		return 'SOLD: ' + title + '\n' + 'Sold in ' + days + '\n' + ' @ ' + priceSold
	}

}

module.exports = Bot
