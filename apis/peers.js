// services/peers.js
const apiClient = require('../utils/apiClient');

async function getPeers(fincode, mode = 'S', peercount = 10) {
  try {
    console.log('Fetching peer data for fincode:', fincode);
    const url = `/peers.ashx?fincode=${fincode}&mode=${mode}&peercount=${peercount}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching peer data:', error.message);
    return null;
  }
}

module.exports = { getPeers };
