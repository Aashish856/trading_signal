// config/frequencies.js
module.exports = {
  // Frequencies (in cron format for node-cron; e.g., '0 0 * * 0' = every Sunday at midnight)
  news: '*/5 * * * *',  // Every 5 minutes
  volume: '0 0 */2 * *',      // Every 2 days at midnight
  pePb: '0 0 * * 0',          // Weekly (Sundays)
  shareholding: '0 0 1 * *',  // Monthly (1st of the month)
  peers: '0 0 1 * *',         // Monthly (1st of the month)

  // Thresholds for signals (tweak based on backtesting)
  thresholds: {
    peUndervalued: 0.8,       // PE < 80% of 52-week avg = undervalued
    peOvervalued: 1.2,        // PE > 120% of 52-week avg = overvalued
    pbSpike: 1.3,             // PB > 130% of avg = sell signal
    volumeSpike: 1.5,         // Volume > 150% of 10-day avg = flag
    fiiIncrease: 1.1,         // FII holding > 110% of previous = positive
    newsSentimentThreshold: 0.5, // LLM sentiment score >0.5 positive, < -0.5 negative
  },

  // Other configs
  watchlistRefresh: '0 0 1 */3 *', // Quarterly watchlist review (1st of every 3rd month)
  apiParams: {
    pePbTop: 1,
    volumeCount: 1,
    peerCount: 10,
    recentNewsWindow: 5
  }
};
