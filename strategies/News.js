const watchlist = require('../stocks/watchlist.json');
const config = require('../utils/frequencies');
const fincode = require('../stocks/fincode.json');
const stockCodeGroww = require('../stocks/stock_code_groww.json');
const { getFinologyNewsList, getGrowwNews } = require('../apis/news');
const { getPeers } = require('../apis/peers');
const { analyzeNewsWithContext } = require('../utils/llm');

const inLast = 6000;
function isPublishedInLastMin(dateObj) {
    const now = new Date();
    const threshold = new Date(now.getTime() - inLast * 60 * 1000);
    return dateObj >= threshold && dateObj <= now;
}
function parseFinologyNewsDate(newsDate, newsTime) {
    return new Date(`${newsDate.split('T')[0]}T${newsTime}:00`);
}
function parseGrowwNewsDate(pubDate) {
    return new Date(pubDate);
}
async function analyzeNewsStrategy() {
    for (const stock of watchlist) {
        const fincodeValue = fincode[stock];
        const stockCodeGrowwValue = stockCodeGroww[stock];
        if (!fincodeValue || !stockCodeGrowwValue) {
            console.warn(`⚠️ Skipping ${stock}: Missing fincode or stock code`);
            continue;
        }
        try {
            const finologyNewsList = await getFinologyNewsList(fincodeValue);
            const growwNews = await getGrowwNews(stockCodeGrowwValue);
            const recentFinologyNews = finologyNewsList?.filter(item => {
                const dateObj = parseFinologyNewsDate(item.Newsdate, item.NewsTime);
                return isPublishedInLastMin(dateObj);
            });
            const recentGrowwNews = growwNews?.filter(item => {
                const dateObj = parseGrowwNewsDate(item.pubDate);
                return isPublishedInLastMin(dateObj);
            });
            if ((recentFinologyNews?.length ?? 0) === 0 && (recentGrowwNews?.length ?? 0) === 0) {
                console.log(`📄 No recent news for ${stock} in the last ${inLast} minutes.`);
                continue;
            }
            const fundamentals = await getPeers(fincodeValue);
            const finologyText = recentFinologyNews.map(item => item.Details).join('\n\n');
            const growwText = recentGrowwNews.map(item => item.summary).join('\n\n');
            const combinedNews = [finologyText, growwText].filter(Boolean).join('\n\n');
            const result = {
                stock,
                recent_news: combinedNews,
                fundamental: fundamentals[0],
                fundamentals_peers: fundamentals.slice(1),
            };
            void analyzeNewsWithContext(result);
        } catch (error) {
            console.error(`❌ Error processing ${stock}:`, error);
            continue;
        }
    }
}

module.exports = { analyzeNewsStrategy };
