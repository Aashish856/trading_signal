// services/volume.js
const apiClient = require('../utils/apiClient');

async function getVolumeData({ fincode, scripcode, symbol, stk = 'BSE', type = 'Y', count = 1 }) {
  try {
    const url = `/GetVolume.ashx?fincode=${fincode}&scripcode=${scripcode}&symbol=${symbol}&stk=${stk}&type=${type}&count=${count}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching volume data:', error.message);
    return null;
  }
}

module.exports = { getVolumeData };
