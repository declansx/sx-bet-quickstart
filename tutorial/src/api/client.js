// src/api/client.js
const axios = require('axios');

const API_BASE_URL = 'https://api.sx.bet';

async function get(endpoint, params = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error.message);
    return Array.isArray(response?.data?.data) ? [] : null;
  }
}

module.exports = {
  get
};