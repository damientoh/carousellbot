const crypto = require('crypto')
const LoginCode = require('../model/LoginCode/LoginCode')

class Login {
	static codeSize = 8

	static async initialize(chatId) {
		if (await this.hasCode(chatId)) {
			await this.deleteCode(chatId)
		}
		const loginCode = this.generateLoginCode()
		await this.saveCode(loginCode, chatId)
		return loginCode
	}

	static async hasCode(chatId) {
		return LoginCode.exists({ chatId })
	}

	static async deleteCode(chatId) {
		return LoginCode.findOneAndDelete({ chatId })
	}

	static generateLoginCode() {
		return crypto.randomBytes(this.codeSize / 2).toString('hex')
	}

	static async saveCode(loginCode, chatId) {
		const loginInfo = new LoginCode({
			loginCode,
			chatId,
		})
		await loginInfo.save()
	}

	// static async isValidCode(loginCode, chatId) {
	// 	const loginInfo = await LoginCode.findOne({ chatId })
	// 	return loginInfo.loginCode === loginCode
	// }
}

module.exports = Login
