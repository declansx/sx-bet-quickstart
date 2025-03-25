// src/services/orderService.js
const apiClient = require('../api/client');

async function fetchOrders(marketHash) {
  return await apiClient.get('/orders', { marketHashes: marketHash }) || [];
}

module.exports = {
  fetchOrders
};