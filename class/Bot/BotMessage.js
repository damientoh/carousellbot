const BotMessage = {
	welcomeMessage:
		'Welcome to CarousellScraper.com bot. Please choose an action from the keyboard!',
	enterKeyword: 'Please enter a keyword.',
	keywordExists: 'This keyword already exists.',
	keywordAddedSuccessfully:
		'Keyword added successfully! You will see new listings from now on.',
	keyboardClosed: 'Closed successfully. Press /start to see keyboard again.',
	noKeyword:
		'There is no keywords registered under this chat. Please add a keyword.',
	indexToDelete: 'Please type the keyword # to delete.',
	invalidUrlOrImage:
		'Invalid listing URL and image URL when sending a listing.',
	listignError: 'Listsing error!',
	invalidKeywordNumber: 'You entered a invalid keyword number',
	numOfKeyword(number) {
		return 'There is a total of ' + number + ' keyword(s).'
	},
	unrecognisedCommand: 'Unrecognised command. Press /start to access the menu.',
	keywordDeleted(keyword) {
		return keyword + ' has been deleted successfully!'
	},
}

module.exports = BotMessage
