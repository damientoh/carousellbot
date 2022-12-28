const mongoose = require('mongoose')

exports.connectToDb = async () => {
	try {
		mongoose.set('strictQuery', true)
		await mongoose.connect(process.env.DBURL, { sslValidate: false })
	} catch (error) {
		throw error
	}
}
