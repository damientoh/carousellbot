// Import necessary modules
const express = require('express');
require('dotenv').config();
const { connectToDb } = require('./database/database');
const scrapingQueue = require('./Queue/ScrapingQueue');
const serverAdapter = require('./router/bull.router');
const winston = require('./winston');
const Keyword = require('./class/Keyword');
require('./class/TelegramBot');
const KeywordModel = require('./model/KeywordModel');

// Initiate app
const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));

// Use the bull board router
app.use('/q', serverAdapter.getRouter());

// Register the main router
app.use('/', require('./router/main.router'));

// App listen
app.listen(process.env.PORT || 3000, async () => {
  console.log(`Server is listening to PORT ${process.env.PORT || 3000}`);

  await connectToDb();

  // Empty and clean the queue
  await Promise.all([
    scrapingQueue.empty(),
    scrapingQueue.clean(0, 'completed'),
    scrapingQueue.clean(0, 'failed'),
    scrapingQueue.clean(0, 'delayed'),
    scrapingQueue.clean(0, 'active')
  ]);

  winston.log('info', 'ScrapingQueue has been emptied');

  // Delete all existing keywords and add a new one with the specified link and keyword
  await KeywordModel.deleteMany({});
  const newKeyword = new KeywordModel({
    link: 'https://www.carousell.sg/categories/golf-5970/?sort_by=3',
    keyword: '*'
  });
  await newKeyword.save();

  // Add all keywords to the queue
  await Keyword.addAllKeywordsToQueue();
  console.log('All keywords added to the queue');
});
