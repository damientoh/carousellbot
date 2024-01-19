const axios = require('axios');

const options = {
    method: 'GET',
    url: 'https://cloudflare-bypass2.p.rapidapi.com/',
    params: {
        url: 'https://www.carousell.sg/categories/sports-equipment-10/sports-games-249/golf-5970/?sort_by=3'
    },
    headers: {
        'X-RapidAPI-Key': '92d8ad7343mshf3835640917dfd6p17af1ajsnb31edae7dc02',
        'X-RapidAPI-Host': 'cloudflare-bypass2.p.rapidapi.com'
    }
};

(async () => {
    try {
        const response = await axios.request(options);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
})();
