// services/shareholding.js
const apiClient = require('../utils/apiClient');

async function getShareholding(fincode) {
  try {
    const response = await apiClient.get(`/GetShares.ashx?v=4.0&fincode=${fincode}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching shareholding data:', error.message);
    return null;
  }
}

module.exports = { getShareholding };
