const watchlist = require('../stocks/watchlist.json');
const config = require('../utils/frequencies');
const { getShareholding } = require('../apis/shareholding');
const { getPBChart } = require('../apis/valuationPB');
const { getNewsList } = require('../apis/news');
const { getPeers } = require('../apis/peers');
const { getVolumeData } = require('../apis/volume');
const { getPERatio } = require('../apis/valuationPE');

// Uncomment these when ready to use
const { analyzeNewsWithContext } = require('../utils/llm');
// const { sendEmail } = require('../utils/email');

function extractShareholdingSummary(data) {
  if (!data || data.length < 2) return 'Insufficient shareholding data';
  const latest = data[0];
  const previous = data[1];

  return {
    fiiChange: (latest.FII - previous.FII).toFixed(2),
    diiChange: (latest.DII - previous.DII).toFixed(2),
    promoterChange: (latest.Promoter - previous.Promoter).toFixed(2)
  };
}

function extractPeerSummary(peers) {
  if (!peers || peers.length === 0) return 'No peer data available';

  const avgPE = peers.reduce((sum, p) => sum + (p.PE || 0), 0) / peers.length;
  const avgPB = peers.reduce((sum, p) => sum + (p.PB || 0), 0) / peers.length;

  return {
    peerAvgPE: Number(avgPE.toFixed(2)),
    peerAvgPB: Number(avgPB.toFixed(2))
  };
}

async function analyzeNewsStrategy(stock, signal) {
  const newsList = await getNewsList(stock.fincode);
  const now = new Date();

  const recentNews = newsList.filter(news => {
    const newsDate = new Date(news.Date);
    return (now - newsDate) / (1000 * 60) <= config.apiParams.recentNewsWindow;
  });

  if (recentNews.length === 0) return;

  const [peData, pbData, volumeData, shareholding, peers] = await Promise.all([
    getPERatio({ fincode: stock.fincode, top: config.apiParams.pePbTop }),
    getPBChart({ fincode: stock.fincode, top: config.apiParams.pePbTop }),
    getVolumeData({ ...stock, type: 'Y', count: config.apiParams.volumeCount }),
    getShareholding(stock.fincode),
    getPeers({ fincode: stock.fincode, peercount: config.apiParams.peerCount })
  ]);

  const avgPE = peData.reduce((sum, d) => sum + d.PE, 0) / peData.length;
  const currentPE = peData[0].PE;

  const avgPB = pbData.reduce((sum, d) => sum + d.PB, 0) / pbData.length;
  const currentPB = pbData[0].PB;

  const volumeList = volumeData.Price;
  const avgVolume = volumeList.slice(1).reduce((sum, v) => sum + v, 0) / (volumeList.length - 1);
  const volumeSpikePercent = ((volumeList[0] - avgVolume) / avgVolume) * 100;

  const summaryContext = {
    pe: { current: currentPE, average: avgPE },
    pb: { current: currentPB, average: avgPB },
    volumeSpikePercent: Number(volumeSpikePercent.toFixed(2)),
    shareholdingSummary: extractShareholdingSummary(shareholding),
    peerSummary: extractPeerSummary(peers)
  };

  const analysis = await analyzeNewsWithContext(recentNews, summaryContext);

  signal.reasons.push(`News Sentiment: ${analysis.sentiment}`);
  if (analysis.recommendation === 'buy') signal.buy = true;
  if (analysis.recommendation === 'sell') signal.sell = true;

    const body = `Stock: ${stock.name || stock.fincode}
    Sentiment: ${analysis.sentiment}
    Insights: ${analysis.insights.join(', ')}
    Recommendation: ${analysis.recommendation}`;

//   await sendEmail(`Breaking News Alert for ${stock.symbol}`, body);
}

async function analyzeVolumeStrategy(stock, signal) {
  const volume = await getVolumeData({ ...stock, type: 'Y', count: config.apiParams.volumeCount });
  const avgVolume = volume.Price.slice(1).reduce((sum, v) => sum + v, 0) / (volume.Price.length - 1);

  if (volume.Price[0] > avgVolume * config.thresholds.volumeSpike) {
    signal.reasons.push('Volume spike detected');
    signal.buy = true;
  }
}

// In strategies/fundamental.js (add or integrate this function)

// Helper function for PE/PB analysis (called within runStrategy for 'pePb' type)
async function analyzePePbStrategy(stock, signal) {
  try {
    const peData = await getPERatio({ fincode: stock.fincode, top: config.apiParams.pePbTop });
    const pbData = await getPBChart({ fincode: stock.fincode, top: config.apiParams.pePbTop });

    // Handle empty data gracefully
    if (peData.length === 0 || pbData.length === 0) {
      signal.reasons.push('Insufficient PE/PB data for analysis');
      return; // Exit early if no data
    }

    // PE Calculations
    const avgPE = peData.reduce((sum, d) => sum + d.PE, 0) / peData.length;
    const currentPE = peData[0].PE;
    signal.reasons.push(`PE: ${currentPE.toFixed(2)} vs Avg: ${avgPE.toFixed(2)}`);

    if (currentPE < avgPE * config.thresholds.peUndervalued) {
      signal.buy = true;
      signal.reasons.push('Undervalued based on PE');
    }
    if (currentPE > avgPE * config.thresholds.peOvervalued) {
      signal.sell = true;
      signal.reasons.push('Overvalued based on PE');
    }
    // PB Calculations (mirroring PE logic; adjust thresholds if needed)
    const avgPB = pbData.reduce((sum, d) => sum + d.PB, 0) / pbData.length;
    const currentPB = pbData[0].PB;
    signal.reasons.push(`PB: ${currentPB.toFixed(2)} vs Avg: ${avgPB.toFixed(2)}`);
    // Assuming symmetric thresholds; you can add pbUndervalued to config if not present
    const pbUndervalued = config.thresholds.peUndervalued; // Reuse or define new (e.g., 0.8)
    const pbOvervalued = config.thresholds.pbSpike || config.thresholds.peOvervalued; // Use pbSpike if defined
    if (currentPB < avgPB * pbUndervalued) {
      signal.buy = true;
      signal.reasons.push('Undervalued based on PB');
    }
    if (currentPB > avgPB * pbOvervalued) {
      signal.sell = true;
      signal.reasons.push('Overvalued based on PB (spike detected)');
    }
  } catch (error) {
    console.error(`Error analyzing PE/PB for ${stock.fincode}:`, error);
    signal.reasons.push('Error fetching PE/PB data');
  }
}


async function analyzeShareholdingStrategy(stock, signal) {
  const shareholding = await getShareholding(stock.fincode);
  const summary = extractShareholdingSummary(shareholding);

  if (typeof summary === 'string') {
    signal.reasons.push(summary);
  } else {
    signal.reasons.push(`FII change: ${summary.fiiChange}%, DII change: ${summary.diiChange}%, Promoter: ${summary.promoterChange}%`);
  }
}

async function analyzePeersStrategy(stock, signal) {
  const peers = await getPeers({ fincode: stock.fincode, peercount: config.apiParams.peerCount });
  const summary = extractPeerSummary(peers);

  if (typeof summary === 'string') {
    signal.reasons.push(summary);
  } else {
    signal.reasons.push(`Compared to peers — Avg PE: ${summary.peerAvgPE}, Avg PB: ${summary.peerAvgPB}`);
  }
}

async function runStrategy(type) {
  const signals = [];

  for (const stock of watchlist) {
    const signal = {
      stock: stock.name || stock.fincode,
      buy: false,
      sell: false,
      hold: true,
      reasons: []
    };

    try {
      if (type === 'news') await analyzeNewsStrategy(stock, signal);
      if (type === 'volume') await analyzeVolumeStrategy(stock, signal);
      if (type === 'pePb') await analyzePePbStrategy(stock, signal);
      if (type === 'shareholding') await analyzeShareholdingStrategy(stock, signal);
      if (type === 'peers') await analyzePeersStrategy(stock, signal);

      if (signal.buy && !signal.sell) signal.hold = false;
    } catch (err) {
      signal.reasons.push(`Error in ${type} strategy: ${err.message}`);
    }

    signals.push(signal);
  }

  return signals;
}

module.exports = { runStrategy };
