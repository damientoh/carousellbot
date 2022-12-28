const mongoose = require('mongoose')

exports.connectToDb = async () => {
	try {
		mongoose.set('strictQuery', true)
		await mongoose.connect(process.env.DBURL)
	} catch (error) {
		throw error
	}
}
