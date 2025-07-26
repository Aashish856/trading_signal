const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://groww.in';
const START_PAGE = 0;
const END_PAGE = 20;

async function scrapeGroww() {
  const results = [];

  for (let page = START_PAGE; page <= END_PAGE; page++) {
    const url = `https://groww.in/stocks/filter?closePriceHigh=100000&closePriceLow=0&marketCapHigh=3000000&marketCapLow=0&page=${page}&size=15&sortBy=MARKET_CAP&sortType=DESC`;

    console.log(`Scraping page ${page}...`);
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const $ = cheerio.load(response.data);

      $('table.tb10Table.borderPrimary tbody tr').each((i, row) => {
        const cell = $(row).find('td a.cur-po.contentPrimary');
        const href = cell.attr('href');
        const name = cell.find('span.st76SymbolName').text();

        if (href && name) {
          const slug = href.split('/').pop();
          results.push({
            href: BASE_URL + href,
            slug: slug,
            name: name.trim(),
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping page ${page}:`, error.message);
    }
  }

  fs.writeFileSync('groww_stocks.json', JSON.stringify(results, null, 2));
  console.log('✅ Data saved to groww_stocks.json');
}

scrapeGroww();
