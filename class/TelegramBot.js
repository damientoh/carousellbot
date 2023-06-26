const TelegramBot = require('node-telegram-bot-api')
const TelegramAction = require('../class/TelegramAction')

/**
 * @type {TelegramBot}
 */
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
	polling: true
})

bot.onText(/\/start/, TelegramAction.start)
bot.onText(/\/seekeywords/, TelegramAction.seeKeywords)
bot.onText(/\/addkeyword/, TelegramAction.addKeyword)
bot.onText(/\/deletekeyword/, TelegramAction.deleteKeyword)

module.exports = bot
