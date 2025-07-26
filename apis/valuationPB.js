// services/pbChart.js
const apiClient = require('../utils/apiClient');

async function getPBChart(fincode, exchange = 'BSE', top = 1, type = 'Y') {
  try {
    const url = `/GetPBChart.ashx?fincode=${fincode}&exc=${exchange}&top=${top}&type=${type}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching PB chart:', error.message);
    return null;
  }
}

module.exports = { getPBChart };
