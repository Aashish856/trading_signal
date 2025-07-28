
const config = require('../utils/frequencies');
const data = require("../stocks/data.json")
const { getFinologyNewsList, getGrowwNews } = require('../apis/news');
const { getPeers } = require('../apis/peers');
const { analyzeNewsWithContext } = require('../utils/llm');

var inLast = 10;
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
async function analyzeNewsStrategy(gap) {
    inLast = gap;
    var index = 0;
    for (const stock of data) {
        if(index >= 50){
            break
        }
        index++;
        const stockSymbol = stock.symbol;
        const stockCodeGrowwValue = stock.growwCompanyId
        const fincodeValue = stock.fincode
        if (!fincodeValue || !stockCodeGrowwValue) {
            continue;
        }
        console.log(`🔍 Analyzing news for ${stockSymbol}...`);
        try {
            const finologyNewsList = await getFinologyNewsList(fincodeValue);
            const growwNews = await getGrowwNews(stockCodeGrowwValue);
            const recentGrowwNews = growwNews?.filter(item => {
                const dateObj = parseGrowwNewsDate(item.pubDate);
                return isPublishedInLastMin(dateObj);
            });
            // console.log("groww news", recentGrowwNews)
            if(recentGrowwNews?.length === 0) {
                // console.warn(`⚠️ No recent news found for ${stockSymbol}`);
                continue;
            }
            console.log("Recent Groww News for", stockSymbol, ":", recentGrowwNews);
            const recentFinologyNews = finologyNewsList?.filter(item => {
                const dateObj = parseFinologyNewsDate(item.Newsdate, item.NewsTime);
                return isPublishedInLastMin(dateObj);
            });
            if ((recentFinologyNews?.length ?? 0) === 0 && (recentGrowwNews?.length ?? 0) === 0) {
                continue;
            }
            const fundamentals = await getPeers(fincodeValue);
            const finologyText = recentFinologyNews.map(item => item.Details).join('\n\n');
            const growwText = recentGrowwNews.map(item => item.summary).join('\n\n');
            const combinedNews = [finologyText, growwText].filter(Boolean).join('\n\n');
            const result = {
                stockSymbol,
                recent_news: combinedNews,
                fundamental: fundamentals[0],
                fundamentals_peers: fundamentals.slice(1),
            };
            void analyzeNewsWithContext(result);
        } catch (error) {
            console.error(`❌ Error processing ${stockSymbol}:`, error);
            continue;
        }
    }
}

module.exports = { analyzeNewsStrategy };
