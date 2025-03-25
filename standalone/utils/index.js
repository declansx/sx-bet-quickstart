import axios from 'axios';

// Constants
const API_BASE_URL = 'https://api.sx.bet';

/**
 * Calculates the taker odds from percentage odds
 * @param {string|number} percentageOdds The odds in percentage format (10^20 precision)
 * @returns {string} Formatted odds string
 */
function calculateTakerOdds(percentageOdds) {
  const impliedOdds = 1 - percentageOdds / 1e20;
  return impliedOdds > 0 ? (1 / impliedOdds).toFixed(2) : "N/A";
}

/**
 * Converts an amount from base units to nominal units
 * @param {string|number} ethereumAmount The amount in base units
 * @param {number} [decimals=6] Number of decimal places
 * @returns {string} Formatted amount in nominal units
 */
function convertToNominalUnits(ethereumAmount, decimals = 6) {
  return (ethereumAmount / Math.pow(10, decimals)).toFixed(2);
}

/**
 * Calculates the remaining taker space for an order
 * @param {Object} order The order object
 * @param {string} order.totalBetSize Total bet size
 * @param {string} order.fillAmount Amount filled
 * @param {string} order.percentageOdds Odds in percentage format
 * @returns {string} Remaining taker space in nominal units
 */
function calculateRemainingTakerSpace(order) {
  const totalBetSize = BigInt(order.totalBetSize);
  const fillAmount = BigInt(order.fillAmount);
  const percentageOdds = BigInt(order.percentageOdds);

  const remaining = (totalBetSize - fillAmount) * BigInt(1e20) / percentageOdds - (totalBetSize - fillAmount);
  return convertToNominalUnits(Number(remaining));
}

/**
 * Makes a GET request to the SX Bet API
 * @param {string} endpoint API endpoint
 * @param {Object} [params={}] Query parameters
 * @param {Object} [options={}] Request options
 * @param {string} [options.apiKey] API key for authenticated endpoints
 * @returns {Promise<any>} Response data
 */
async function get(endpoint, params = {}, options = {}) {
  try {
    const headers = {};
    if (options.apiKey) {
      headers['X-Api-Key'] = options.apiKey;
    }

    const response = await axios.get(`${API_BASE_URL}${endpoint}`, { 
      params,
      headers
    });

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error.message);
    return Array.isArray(response?.data?.data) ? [] : null;
  }
}

/**
 * Makes a POST request to the SX Bet API
 * @param {string} endpoint API endpoint
 * @param {Object} data Request body
 * @param {Object} [options={}] Request options
 * @param {string} [options.apiKey] API key for authenticated endpoints
 * @returns {Promise<any>} Response data
 */
async function post(endpoint, data, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (options.apiKey) {
      headers['X-Api-Key'] = options.apiKey;
    }

    const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
      headers
    });

    return response.data;
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Formats a timestamp to a human-readable string
 * @param {number} timestamp Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Formats an address to a shortened form
 * @param {string} address Ethereum address
 * @returns {string} Shortened address (e.g., 0x1234...5678)
 */
function formatAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats an amount with a specified number of decimals
 * @param {string|number} amount The amount to format
 * @param {number} [decimals=6] Number of decimal places
 * @param {boolean} [addCommas=true] Whether to add commas for thousands
 * @returns {string} Formatted amount
 */
function formatAmount(amount, decimals = 6, addCommas = true) {
  const num = Number(amount) / Math.pow(10, decimals);
  if (addCommas) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return num.toFixed(2);
}

export {
  // Formatting utilities
  calculateTakerOdds,
  convertToNominalUnits,
  calculateRemainingTakerSpace,
  formatTimestamp,
  formatAddress,
  formatAmount,
  
  // API utilities
  get,
  post,
  API_BASE_URL
}; 