const apiClient = require('../utils/apiClient');
const axios = require('axios');
async function getFinologyNewsList(fincode) {
  try {
    const url = `/News.ashx?v=4.0&mode=list&fincode=${fincode}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Finology news list:', error.message);
    return null;
  }
}
async function getFinologyNewsDetails(fincode, newsId) {
  try {
    const url = `/News.ashx?v=4.0&mode=details&fincode=${fincode}&NewsID=${newsId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Finology news details:', error.message);
    return null;
  }
}
async function getGrowwNews(stockCodeGroww, size = 2) {
  try {
    const url = `https://groww.in/v1/api/groww-news/v2/stocks/news/${stockCodeGroww}?page=0&size=${size}`;
    const response = await axios.get(url);
    return response.data["results"];
  } catch (error) {
    console.error('❌ Error fetching Groww news:', error.message);
    return null;
  }
}
module.exports = {
  getFinologyNewsList,
  getFinologyNewsDetails,
  getGrowwNews,
};
