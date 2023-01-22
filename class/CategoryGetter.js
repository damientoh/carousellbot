const puppeteer = require('puppeteer')
const { pageExtend } = require('puppeteer-jquery')

class CategoryGetter {
	static carousellUrl = 'https://www.carousell.sg/'
	static categories

	static async refreshCategories() {
		// const browser = await puppeteer.launch()
		// const page = await browser.newPage()
		//
		// await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
		// await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
		// Chrome/108.0.0.0 Safari/537.36 OPR/94.0.0.0') await page.goto(this.carousellUrl)  const result = await
		// page.evaluate(() => {  const xpath = '//p[text()=\'All Categories\']' const allCategoriesButton =
		// document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
		// allCategoriesButton.click()  const categories = {}  const sidebar =
		// document.querySelector('#ReactModalPortal-CategoriesSidebar')
		// sidebar.querySelectorAll('[data-category-id]').forEach(categoryHeader => { categoryHeader.click()  const
		// parentCategory = categoryHeader.parentNode.firstChild.querySelector('p').innerText const categoryInfo = {}
		// categoryInfo.parentUrl = categoryHeader.parentNode.firstChild.getAttribute('href').split('?')[0]
		// categoryInfo.childCategories = {}  let next = categoryHeader.parentNode.nextElementSibling while
		// (next.tagName === 'A') { categoryInfo.childCategories[next.innerText] = next.getAttribute('href').split('?')[0] next = next.nextElementSibling }  categories[parentCategory] = categoryInfo })  return categories })  await browser.close() this.categories = result
	}

	static getParentCategories() {
		const parentCategories = Object.keys(this.categories)
		return parentCategories.map((parentCategory) => {
			return {
				name: parentCategory,
				url: this.categories[parentCategory].parentUrl
			}
		})
	}

	static getSubCategories(parentCategory) {
		const childCategories = Object.keys(this.categories[parentCategory].childCategories)
		return childCategories.map(childCategory => {
			return {
				name: childCategory,
				url: this.categories[parentCategory].childCategories[childCategory]
			}
		})
	}

	static async delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

}

module.exports = CategoryGetter
