const ListingScraper = require('./ListingScraperMethod')

ListingScraper.LISTING_SELECTOR = 'div.D_rN.D_vT'
ListingScraper.TITLE_SELECTOR = 'p.D_qk.D_pP.D_ql.D_qo.D_qr.D_qu.D_qw.D_qs.D_rB'
ListingScraper.PRICE_SELECTOR = 'p.D_qk.D_pP.D_ql.D_qo.D_qq.D_qu.D_qx.D_rA'
ListingScraper.CONDITION_SELECTOR = 'p.D_qk.D_pN.D_ql.D_qo.D_qq.D_qu.D_qw.D_rB'
ListingScraper.PROFILE_LINK_SELECTOR = 'a:nth-child(1)'
ListingScraper.LINK_SELECTOR = 'a:nth-child(2)'
ListingScraper.POSTED_DATE_SELECTOR =
	'p.D_qk.D_pN.D_ql.D_qo.D_qq.D_qu.D_qw.D_wt.D_rC'
ListingScraper.LISTING_ID_SELECTOR = 'div.D_wb'
ListingScraper.CAROUSELL_URL = 'https://carousell.sg'
ListingScraper.CAROUSELL_SEARCH_URL = 'https://www.carousell.sg/search/'
ListingScraper.CAROUSELL_SEARCH_EXTENSION =
	'?addRecent=false&canChangeKeyword=false&includeSuggestions=false&sort_by=3'
ListingScraper.IMAGE_URL_SELECTOR = 'img.D_xm.D_xj.D_SH'

module.exports = ListingScraper
