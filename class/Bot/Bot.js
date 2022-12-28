const BotMessage = require('./BotMessage')
const SendOption = require('./SendOption')
const Notification = require('../../model/Notification/Notification')
const TelegramBot = require('node-telegram-bot-api')
const ListingScraper = require('../../model/ListingScraper/ListingScraper')

class Bot {
	bot
	botMessage
	sendOption

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

	async doMessage(msg) {
		console.log(msg)
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

	async valdiateChat(msg) {
		const chatId = msg.chat.id
		if (!(await Notification.chatExists(chatId))) {
			const notification = new Notification({ chatId })
			await notification.save()
		}
	}

	doStart(msg) {
		const chatId = msg.chat.id
		this.sendMessage(
			chatId,
			this.botMessage.welcomeMessage,
			this.sendOption.standard
		)
	}

	async doSeeAllKeywords(msg) {
		await this.valdiateChat(msg)

		const chatId = msg.chat.id
		const formattedKeywords = await this.getFormattedKeywords(chatId)
		this.sendMessage(chatId, formattedKeywords, this.sendOption.standard)
	}

	async doDeleteKeywords(msg) {
		await this.valdiateChat(msg)

		const chatId = msg.chat.id
		const formattedKeywords = await this.getFormattedKeywords(chatId)
		this.sendMessage(chatId, formattedKeywords)

		const indexPrompt = await this.sendMessage(
			chatId,
			this.botMessage.indexToDelete,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			indexPrompt.message_id,
			(async indexMessage => {
				const index = -1 + parseInt(indexMessage.text)
				const notification = await Notification.findByChatId(chatId)
				const allKeywords = await notification.getKeywords()

				if (Number.isNaN(index) || !(index < allKeywords.length) || index < 0) {
					return this.bot.sendMessage(
						chatId,
						this.botMessage.invalidKeywordNumber
					)
				}

				await notification.deleteKeywordByIndex(index)
				this.bot.sendMessage(
					chatId,
					this.botMessage.keywordDeleted(allKeywords[index]),
					this.sendOption.standard
				)
			}).bind(this)
		)
	}

	async doAddNewKeyword(msg) {
		await this.valdiateChat(msg)

		const chatId = msg.chat.id
		const keywordPrompt = await this.sendMessage(
			chatId,
			this.botMessage.enterKeyword,
			this.sendOption.forceReply
		)

		this.bot.onReplyToMessage(
			chatId,
			keywordPrompt.message_id,
			(async keywordMessage => {
				const keyword = keywordMessage.text
				if (await Notification.hasKeyword(chatId, keyword)) {
					this.bot.sendMessage(
						chatId,
						this.botMessage.keywordExists(keyword),
						this.sendOption.standard
					)
				} else {
					await Notification.addKeyword(chatId, keyword)
					this.bot.sendMessage(
						chatId,
						this.botMessage.keywordAddedSuccessfully(keyword),
						this.sendOption.standard
					)
					this.bot.sendMessage(
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
		return this.bot.sendMessage(
			chatId,
			this.botMessage.keyboardClosed,
			this.sendOption.hideKeyboard
		)
	}

	async getFormattedKeywords(chatId) {
		const notification = await Notification.findByChatId(chatId)
		const allKeywords = await notification.getKeywords()
		const formattedKeywords = this.formatKeywords(allKeywords)

		return formattedKeywords
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

		return this.botMessage.listingError
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
