const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const sendEmail = require('./mailer'); // assuming the email file is named sendEmail.js
require('dotenv').config();
const sendTelegramMessage = require('./tg_notification'); // assuming the Telegram notification file is named tg_notification.js

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const MODEL_ID = 'meta.llama3-70b-instruct-v1:0';

function extractJSONBlock(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/); // matches the first {...} block
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('❌ Failed to parse extracted JSON block:', err);
    }
  }
  return { sentiment: 'neutral', insights: [], recommendation: 'hold' };
}

async function analyzeNewsWithContext(content) {
  const systemPrompt = `
You are a top-tier financial analyst and investment advisor.
Your task is to critically analyze a company's **recent news** in the context of its **financial fundamentals** and **peer performance** to provide clear, actionable insights for traders and investors.
Focus on how the **news impacts the company's outlook**, and support your opinion with financial data **only as necessary** to strengthen or challenge the news narrative.
Structure your output as a JSON object like this:
{
  "insights": ["Key observation 1", "Key observation 2", "..."],
  "sentiment": "positive | negative | neutral",
  "recommendation": "strong_buy | buy | hold | sell | strong_sell"
}
 Guidelines:
- Begin your analysis by interpreting the recent news — what happened, why it matters, and how it might affect the stock.
- Use fundamentals and peer comparison only to **support or contradict** the impact of the news — not to summarize them.
- Be concise, insightful, and avoid generic statements.
- Favor interpretation and judgment over repeating raw numbers.
Only return the JSON output. Do not include any additional explanation.

`;

  const userPrompt = `
Here is the data for analysis:

**Company Name**: ${content.fundamental.COMPNAME}
**Symbol**: ${content.fundamental.SYMBOL}

**Recent News**:
${content.recent_news}

**Fundamentals**:
- Market Cap: ₹${content.fundamental.mcap.toFixed(2)} Cr
- Close Price: ₹${content.fundamental.CLOSE_PRICE}
- 52 Week High/Low: ₹${content.fundamental["52WeekHigh"]} / ₹${content.fundamental["52WeekLow"]}
- PE Ratio: ${content.fundamental.PE}
- PB Ratio: ${content.fundamental.PB}
- EPS: ${content.fundamental.EPS}
- ROE: ${content.fundamental.ROE}%
- ROCE: ${content.fundamental.ROCE}%
- EV/EBITDA: ${content.fundamental.EV_EBITDA}
- Net Sales Growth: ${content.fundamental.net_sales}%

**Peer Comparison**:
${content.fundamentals_peers.slice(0, 2).map((peer, i) => {
  return `Peer ${i + 1} - ${peer.COMPNAME} (${peer.SYMBOL})
  - PE: ${peer.PE}
  - PB: ${peer.PB}
  - ROE: ${peer.ROE}%
  - ROCE: ${peer.ROCE}%
  - EV/EBITDA: ${peer.EV_EBITDA}
  - Net Sales: ${peer.net_sales}%`;
}).join('\n\n')}
`;
  const formattedPrompt = `
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${systemPrompt.trim()}
<|eot_id|><|start_header_id|>user<|end_header_id|>
${userPrompt.trim()}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
  const params = {
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      prompt: formattedPrompt,
      max_gen_len: 2042,
      temperature: 0.4,
      top_p: 0.9
    })
  };
  try {
    const command = new InvokeModelCommand(params);
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const generation = responseBody.generation;
    const result = extractJSONBlock(generation);

   if (result.recommendation !== 'hold') {
    const recommendationEmoji = {
        'buy': '🟢',
        'sell': '🔴',
        'strong_buy': '💚',
        'strong_sell': '❤️'
    };

    const emoji = recommendationEmoji[result.recommendation.toLowerCase()] || '📊';
    
    const message = `
        ${emoji} <b>${content.fundamental.SYMBOL} - ${result.recommendation.toUpperCase()}</b>

        <b>💭 Sentiment:</b> ${result.sentiment}

        <b>🔍 Key Insights:</b>
        ${result.insights.map(insight => `  • ${insight}`).join('\n')}

        <b>🏢 Company:</b> ${content.fundamental.COMPNAME}
        <b>💰 Current Price:</b> ₹${content.fundamental.CLOSE_PRICE}

        <i>Generated at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</i>
            `.trim();
    await sendTelegramMessage(message);
}
  } catch (error) {
    console.error('❌ Bedrock Error:', error);
  }
}
module.exports = { analyzeNewsWithContext };