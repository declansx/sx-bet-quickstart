// Trade data service for SX Bet API
import axios from 'axios';

const API_BASE_URL = 'https://api.sx.bet';

/**
 * Fetch successful trades for a market
 * @param {string} marketHash - The market's hash
 * @param {Object} options - Optional parameters
 * @param {boolean} options.maker - Include maker trades (default: false)
 * @param {string} options.chainVersion - Chain version (default: 'SXR')
 * @param {string} options.tradeStatus - Trade status (default: 'SUCCESS')
 * @param {number} options.pageSize - Number of trades to return (default: 100)
 * @returns {Promise<Array>} Array of trade objects
 * 
 * Example:
 * const trades = await fetchTrades('0x123...');
 * console.log(trades);
 * // [
 * //   {
 * //     tradeHash: '0x...',
 * //     bettor: '0x...',
 * //     stake: '1000000',          // 1 USDC (6 decimals)
 * //     odds: '5000000000000000000', // 50% (20 decimals)
 * //     bettingOutcomeOne: true,
 * //     betTime: '1234567890',
 * //     ...
 * //   },
 * //   ...
 * // ]
 */
export async function fetchTrades(marketHash, options = {}) {
  try {
    const params = {
      marketHashes: marketHash,
      maker: false,
      chainVersion: 'SXR',
      tradeStatus: 'SUCCESS',
      pageSize: 100,
      ...options
    };

    const response = await axios.get(`${API_BASE_URL}/trades`, { params });
    return response.data.data?.trades || [];
  } catch (error) {
    console.error('Error fetching trades:', error.message);
    return [];
  }
}

/**
 * Fetch trades for multiple markets
 * @param {string[]} marketHashes - Array of market hashes
 * @param {Object} options - Optional parameters (same as fetchTrades)
 * @returns {Promise<Object>} Object mapping market hashes to their trades
 * 
 * Example:
 * const trades = await fetchTradesMulti(['0x123...', '0x456...']);
 * console.log(trades);
 * // {
 * //   '0x123...': [...trades],
 * //   '0x456...': [...trades]
 * // }
 */
export async function fetchTradesMulti(marketHashes, options = {}) {
  try {
    const params = {
      marketHashes: marketHashes.join(','),
      maker: false,
      chainVersion: 'SXR',
      tradeStatus: 'SUCCESS',
      pageSize: 100,
      ...options
    };

    const response = await axios.get(`${API_BASE_URL}/trades`, { params });
    const trades = response.data.data?.trades || [];

    // Group trades by market hash
    return trades.reduce((acc, trade) => {
      const hash = trade.marketHash;
      if (!acc[hash]) acc[hash] = [];
      acc[hash].push(trade);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple trades:', error.message);
    return {};
  }
} 