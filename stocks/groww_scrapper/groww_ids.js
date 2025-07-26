const axios = require('axios');
const fs = require('fs').promises;

const BASE_API = 'https://groww.in/v1/api/stocks_data/v1/company/search_id/';
const FIELDS = '?fields=COMPANY_HEADER&page=0&size=10';

async function fetchCompanyInfo(slug) {
  try {
    const res = await axios.get(`${BASE_API}${slug}${FIELDS}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const h = res.data?.header;
    if (!h) return null;

    return {
      searchId: h.searchId,
      growwCompanyId: h.growwCompanyId,
      nseScriptCode: h.nseScriptCode,
      bseScriptCode: h.bseScriptCode,
      nseTradingSymbol: h.nseTradingSymbol,
      bseTradingSymbol: h.bseTradingSymbol,
    };
  } catch (err) {
    console.error(`❌ Failed for ${slug}:`, err.response?.status || err.message);
    return null;
  }
}

async function run() {
  const raw = await fs.readFile('groww_stocks.json', 'utf-8');
  const stocks = JSON.parse(raw);
  const results = [];

  for (const stock of stocks) {
    console.log(`🔍 Fetching info for ${stock.name} (${stock.slug})...`);
    const info = await fetchCompanyInfo(stock.slug);
    if (info) results.push(info);

    // Optional: wait to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200)); 
  }

  await fs.writeFile('groww_company_ids.json', JSON.stringify(results, null, 2));
  console.log('✅ Saved to groww_company_ids.json');
}

run();
