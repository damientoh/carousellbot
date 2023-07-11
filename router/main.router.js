const express = require('express')
const router = express.Router()
const CarousellListing = require('../class/CarousellListing')
const winston = require('../winston')
const mongoose = require('mongoose')

// Define your routes
router.get('/', async (req, res) => {
	try {
		// Initialize the page number, defaulting to 1 if no query parameter is provided
		const page = parseInt(req.query.page) || 1

		// Initialize the page limit, defaulting to 10 if no query parameter is provided
		const limit = parseInt(req.query.limit) || 20

		// Initialize sort object with default values
		let sort = { createdAt: -1 } // -1 corresponds to 'desc' order

		// Initialize the query object, which will hold the filtering criteria
		const query = {}

		// If a name is provided in the request query, add a filtering criteria for title using a
		// case-insensitive regex
		if (req.query.keyword) {
			query.title = { $regex: new RegExp(req.query.keyword, 'i') }
		}

		// If an owner URL is provided in the request query, add a filtering criteria for ownerProfileUrl using
		// a case-insensitive regex
		if (req.query.owner) {
			query.ownerProfileUrl = { $regex: new RegExp(req.query.owner, 'i') }
		}

		// If a status is provided in the request query, add a filtering criteria for status using a
		// case-insensitive regex
		if (req.query.status) {
			if (typeof req.query.status === 'string') {
				req.query.status = req.query.status.split(',')
			}
			query.status = { $in: req.query.status }
		}

		// If a sort is provided in the request query, parse the sorting field and direction and add them to
		// the sort object
		if (req.query.sort) {
			// Reset sort object
			sort = {}

			const [field, order] = req.query.sort.split('_')
			sort[field] = order === 'desc' ? -1 : 1
		}

		// If a createdAt is provided in the request query, add a filtering criteria for createdAt
		if (req.query.createdAt) {
			const [createdAtStart, createdAtEnd] =
				req.query.createdAt.split(' - ')
			query.createdAt = {
				$gte: new Date(createdAtStart),
				$lte: new Date(createdAtEnd)
			}
		}

		// If a statusChangeAt is provided in the request query, add a filtering criteria for statusChangeAt
		if (req.query.statusChangeAt) {
			const [statusChangeAtStart, statusChangeAtEnd] =
				req.query.statusChangeAt.split(' - ')
			query.statusChangeAt = {
				$gte: new Date(statusChangeAtStart),
				$lte: new Date(statusChangeAtEnd)
			}
		}

		// If a keyword ID is provided in the request query, add a filtering criteria for keyword
		if (req.query.keywordId) {
			// We need to convert the string to a MongoDB ObjectId
			let keywordId
			try {
				keywordId = mongoose.Types.ObjectId(req.query.keywordId)
			} catch (error) {
				// Log error and handle invalid ObjectId format
				winston.log('error', 'Invalid keyword ID provided', {
					errorMessage: error.message
				})
			}
			if (keywordId) {
				query.keyword = keywordId
			}
		}

		// Fetch paginated listings from the database using the filtering criteria and sorting from the query
		// parameters
		const listings = await CarousellListing.getPaginatedListings(
			query,
			page,
			limit,
			sort
		)

		const { formatDistance, parseISO } = require('date-fns')

		// Render the index view with the paginated listings and other pagination details
		res.render('index', {
			pageTitle: 'Home',
			listings: listings.docs,
			currentPage: page,
			nextPage: listings.hasNextPage ? page + 1 : null,
			prevPage: listings.hasPrevPage ? page - 1 : null,
			totalPages: listings.totalPages,
			formatDistance,
			parseISO,
			req
		})
	} catch (error) {
		// Log any error that occurs during the handling of the GET request, including all relevant variables
		winston.log(
			'error',
			'An error occurred during the GET request handling process',
			{
				req
			}
		)
	}
})

// Export the router
module.exports = router
