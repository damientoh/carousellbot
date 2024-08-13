const TelegramBot = require('node-telegram-bot-api')
const TelegramAction = require('../class/TelegramAction')

/**
 * @type {TelegramBot}
 */
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
	polling: true
})

// bot.onText(/\/start/, TelegramAction.start)
// bot.onText(/\/seekeywords/, TelegramAction.seeKeywords)
// bot.onText(/\/addkeyword/, TelegramAction.addKeyword)
// bot.onText(/\/deletekeyword/, TelegramAction.deleteKeyword)

// New command: respond to "ping" with "pong"
bot.onText(/ping/, (msg) => {
    console.log('Received a message that matches "ping" pattern:')
    console.log('Message Object:', JSON.stringify(msg, null, 2)) // Added detailed message logging

    const chatId = msg.chat.id
    console.log('Extracted chat ID:', chatId)

    const messageText = msg.text.toLowerCase()
    console.log('Message text converted to lowercase:', messageText)

    if (messageText === 'ping') {
        console.log('Message text is exactly "ping". Preparing to send "pong"...')
        bot.sendMessage(chatId, 'pong')
            .then(() => {
                console.log(`Successfully sent "pong" to chat ID: ${chatId}`)
            })
            .catch((error) => {
                console.error(`Failed to send "pong" to chat ID: ${chatId}`)
                console.error('Error:', error)
            })
    } else {
        console.log('Message text is not exactly "ping". No response will be sent.')
    }
})

bot.on('polling_error', msg => console.log(msg))

module.exports = bot
