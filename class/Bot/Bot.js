const BotMessage = require('./BotMessage')
const SendOption = require('./SendOption')
const Notification = require('../../model/Notification/Notification')
const TelegramBot = require('node-telegram-bot-api')
const ListingScraper = require('../../model/ListingScraper/ListingScraper')

class Bot {
	bot
	botMessage
	sendOption
	isDebug

	constructor() {
		this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
			polling: true,
		})
		this.botMessage = BotMessage
		this.sendOption = SendOption
		this.isDebug = true
	}

	async startBot() {
		// this.bot.on('message', await this.doMessage.bind(this))
		this.bot.onText(/\/start/, this.doStart.bind(this))
		this.bot.onText(/\/addkeyword/, await this.doAddNewKeyword.bind(this))
		this.bot.onText(/\/seekeywords/, await this.doSeeAllKeywords.bind(this))
		this.bot.onText(/\/deletekeyword/, await this.doDeleteKeywords.bind(this))
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
			const notification = new Notification({chatId})
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
		const formattedKeywords = await this.getFormattedKeywords(chatId)
		await this.sendMessage(chatId, formattedKeywords, this.sendOption.standard)
	}

	async doDeleteKeywords(msg) {
		await this.validateChat(msg)

		const chatId = msg.chat.id
		const formattedKeywords = await this.getFormattedKeywords(chatId)
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
				const allKeywords = await notification.getKeywords()

				if (Number.isNaN(index) || !(index < allKeywords.length) || index < 0) {
					return await this.sendMessage(
						chatId,
						BotMessage.invalidKeywordNumber
					)
				}

				await notification.deleteKeywordByIndex(index)
				
				await this.sendMessage(
					chatId,
					BotMessage.keywordDeleted(allKeywords[index]),
					this.sendOption.standard
				)
			}.bind(this)
		)
	}

	async doAddNewKeyword(msg) {
		await this.validateChat(msg)

		const chatId = msg.chat.id
		const keywordPrompt = await this.sendMessage(
			chatId,
			BotMessage.enterKeyword,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			keywordPrompt.message_id,
			(async keywordMessage => {
				const keyword = keywordMessage.text
				if (await Notification.hasKeyword(chatId, keyword)) {
					await this.sendMessage(
						chatId,
						this.botMessage.keywordExists(keyword),
						this.sendOption.standard
					)
				} else {
					await Notification.addKeyword(chatId, keyword)
					await this.sendMessage(
						chatId,
						this.botMessage.keywordAddedSuccessfully(keyword),
						this.sendOption.standard
					)
					await this.sendMessage(
						chatId,
						await this.getFormattedKeywords(chatId),
						this.sendOption.standard
					)
				}
			}).bind(this)
		)
	}

	doHideKeyboard(msg) {
		const chatId = msg.chat.id
		return this.sendMessage(
			chatId,
			this.botMessage.keyboardClosed,
			this.sendOption.hideKeyboard
		)
	}

	async getFormattedKeywords(chatId) {
		const notification = await Notification.findByChatId(chatId)
		const allKeywords = await notification.getKeywords()
		return this.formatKeywords(allKeywords)
	}

	formatKeywords(allKeywords) {
		let result = ''

		if (!allKeywords) {
			return this.botMessage.noKeyword
		}

		allKeywords.forEach((keyword, index) => {
			index++
			result += index + '. ' + keyword
			result += '\n'
		})

		result += '\n'
		result += this.botMessage.numOfKeyword(allKeywords.length)

		return result
	}

	formatListing(listing, keyword) {
		if (listing) {
			let result = ''
			result += '(' + keyword + ') '
			result += listing.title + '\n'
			result += '<strong>' + listing.price + '</strong>\n'
			result += listing.postedDate

			return result
		}

		return BotMessage.listingError
	}

	async sendSingleListing(chatId, listing, keyword) {
		if (listing) {
			try {
				if (!listing.listingUrl || !listing.imageUrl) {
					throw new Error(this.botMessage.invalidUrlOrImage)
				}
				await this.sendMessageWithPhoto(
					chatId,
					listing.imageUrl,
					this.sendOption.singleListing(
						this.formatListing(listing, keyword),
						listing.listingUrl
					)
				)
			} catch (error) {
				throw error
			}
		}
	}

	async sendManyListings(chatId, manyListings, keyword) {
		if (manyListings) {
			for (const listing of manyListings) {
				try {
					const imageUrl = await ListingScraper.getImageUrl(listing.listingUrl)
					listing.imageUrl = imageUrl
					await this.sendSingleListing(chatId, listing, keyword)
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
}

module.exports = Bot
