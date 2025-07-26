const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const BASE_URL = 'https://ticker.finology.in/company/';

async function getFincode(symbol) {
  const url = `${BASE_URL}${symbol}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const html = response.data;

    // Extract the fincode using regex
    const match = html.match(/var\s+fincode\s*=\s*(\d+);/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    } else {
      console.warn(`⚠️ fincode not found for ${symbol}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Failed for ${symbol}:`, err.response?.status || err.message);
    return null;
  }
}
async function run() {
  const raw = await fs.readFile('../groww_scrapper/groww_company_ids.json', 'utf-8');
  const companies = JSON.parse(raw);
  const ticker_result = [];
  const result = []
  var index = 0;
  for (const c of companies) {
    if(index >= 100){
        break
    }
    index++;
    console.log(`🔍 Fetching fincode for ${c.bseTradingSymbol}...`);
    const symbol = c.bseTradingSymbol;
    if (!symbol) continue;
    const fincode = await getFincode(symbol);
    if (fincode !== null) {
      ticker_result.push({ symbol, fincode });
      result.push({symbol, fincode, bseScriptCode: c.bseScriptCode, nseScriptCode: c.nseScriptCode, growwCompanyId: c.growwCompanyId});
    }
  }
  await fs.writeFile('fincode_data.json', JSON.stringify(ticker_result, null, 2));
  console.log('✅ Saved to fincode_data.json');
  await fs.writeFile('../data.json', JSON.stringify(result, null, 2));
  console.log('✅ Saved to data.json');
}

run();
