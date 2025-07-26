const { analyzeNewsStrategy } = require('./strategies/News');

let lastRunTime = new Date(Date.now() - 60 * 60 * 1000); // pretend it ran 60 mins ago

function isWeekday(d) {
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  return day >= 1 && day <= 5;
}

function isMarketHours(d) {
  const hour = d.getHours();
  return isWeekday(d) && hour >= 9 && hour < 16;
}

function getNextRunTime(now) {
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  if (isMarketHours(now)) {
    // Case 1: Market hours → run again in 10 minutes
    return new Date(now.getTime() + 10 * 60 * 1000);
  }

  if (isWeekday(in3Hours) && in3Hours.getHours() >= 9 && in3Hours.getHours() < 16) {
    // Case 2: 3 hours later lands in market → next run = today 9 AM
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 0, 0, 0);

    if (now < marketOpen) {
      return marketOpen;
    }
  }
  return in3Hours;
}

async function runStrategyLoop() {
  const now = new Date();
  const gapInMinutes = Math.round((now - lastRunTime) / (60 * 1000));

  console.log(`⏱ Running at ${now.toLocaleTimeString()} | gap = ${gapInMinutes} min`);

  try {
    analyzeNewsStrategy(gapInMinutes);
  } catch (err) {
    console.error('❌ analyzeNewsStrategy failed:', err);
  }

  lastRunTime = now;

  const nextRunTime = getNextRunTime(now);
  const delayMs = nextRunTime - new Date();

  console.log(`🕒 Next run scheduled at ${nextRunTime.toLocaleTimeString()}`);
  setTimeout(runStrategyLoop, delayMs);
}

// Start
runStrategyLoop();
