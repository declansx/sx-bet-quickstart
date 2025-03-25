// src/services/tradeService.js
const apiClient = require('../api/client');

async function fetchTrades(marketHash) {
  const result = await apiClient.get('/trades', {
    marketHashes: marketHash,
    maker: false, // Fetch only taker trades
    chainVersion: "SXR", // SX Rollup trades
    tradeStatus: "SUCCESS", // Only successful trades
    pageSize: 100
  });

  return result?.trades || [];
}

module.exports = {
  fetchTrades
};