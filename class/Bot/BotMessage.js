const BotMessage = {
	welcomeMessage:
		'Welcome to Carousell Bot. Please select an option from the menu.',
	enterKeyword: 'Please enter a keyword.',
	keywordExists(keyword) {
		return 'The keyword ' + keyword + ' is already being tracked'
	},
	keywordAddedSuccessfully(keyword) {
		return 'The keyword ' + keyword + ' has been added and will now be tracked.'
	},
	keyboardClosed: 'Closed successfully. Press /start to see keyboard again.',
	noKeyword:
		'There is no keywords registered under this chat. Please add a keyword.',
	indexToDelete: 'Please type the keyword # to delete.',
	invalidUrlOrImage:
		'The listing URL and image URL are invalid. Please check and try again.',
	listingError: 'There was an error with the listing. Please try again.',
	invalidKeywordNumber:
		'The keyword number you entered is invalid. Please enter a valid number.',
	numOfKeyword(number) {
		return 'There is a total of ' + number + ' keyword(s).'
	},
	unrecognisedCommand: 'I\'m sorry, I don\'t understand that command.',
	keywordDeleted(keyword) {
		return keyword + ' has been deleted successfully!'
	},
	selectParentCategory: 'Please select a parent category.',
	selectSubCategory: 'Please select a sub category.',
	invalidParentCategoryNumber: 'The parent category number you entered is invalid.',
	invalidKeyword: 'The keyword you entered is invalid.',
	invalidSubCategoryNumber: 'The sub category number you entered is invalid.',
	selectCategory: 'Please select a category.',
	invalidCategory: 'The category you entered is invalid.',
}

module.exports = BotMessage
