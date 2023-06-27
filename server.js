const express = require('express')
require('dotenv').config()
const { connectToDb } = require('./database/database')
require('./Queue/ScrapingQueue')

// Initiate app
const app = express()

// Initialize
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))
require('./class/TelegramBot')

// App listen
app.listen(process.env.PORT || 3000, async () => {
	console.log(`Server is listening to PORT ${process.env.PORT || 3000}`)
	await connectToDb()
})
