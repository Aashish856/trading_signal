const { analyzeNewsStrategy } = require('./strategies/News');

// Run immediately once
analyzeNewsStrategy();

// Then run every 10 minutes (600,000 ms)
setInterval(() => {
  console.log('⏱ Running analyzeNewsStrategy...');
  analyzeNewsStrategy();
}, 10 * 60 * 1000);
