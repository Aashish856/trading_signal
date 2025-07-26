// services/valuation.js
const apiClient = require('../utils/apiClient');

async function getPERatio({ fincode, exc = 'BSE', top = 1, type = 'Y' }) {
  try {
    const url = `/GetValuation.ashx?fincode=${fincode}&exc=${exc}&top=${top}&type=${type}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching PE Ratio:', error.message);
    return null;
  }
}

module.exports = { getPERatio };
