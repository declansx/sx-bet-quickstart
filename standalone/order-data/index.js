// Order data service for SX Bet API
import axios from 'axios';

const API_BASE_URL = 'https://api.sx.bet';

/**
 * Fetch active orders for a market
 * @param {string} marketHash - The market's hash
 * @param {Object} options - Optional parameters
 * @param {string} options.chainVersion - Chain version (e.g., 'SXR')
 * @returns {Promise<Array>} Array of order objects
 * 
 * Example:
 * const orders = await fetchOrders('0x123...', { chainVersion: 'SXR' });
 * console.log(orders);
 * // [
 * //   {
 * //     orderHash: '0x...',
 * //     maker: '0x...',
 * //     totalBetSize: '1000000',
 * //     percentageOdds: '5000000000000000000',
 * //     isMakerBettingOutcomeOne: true,
 * //     fillAmount: '0',
 * //     ...
 * //   },
 * //   ...
 * // ]
 */
export async function fetchOrders(marketHash, options = {}) {
  try {
    const params = {
      marketHashes: marketHash,
      ...options
    };

    const response = await axios.get(`${API_BASE_URL}/orders`, { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    return [];
  }
}

/**
 * Fetch orders for multiple markets
 * @param {string[]} marketHashes - Array of market hashes
 * @param {Object} options - Optional parameters
 * @param {string} options.chainVersion - Chain version (e.g., 'SXR')
 * @returns {Promise<Object>} Object mapping market hashes to their orders
 * 
 * Example:
 * const orders = await fetchOrdersMulti(['0x123...', '0x456...']);
 * console.log(orders);
 * // {
 * //   '0x123...': [...orders],
 * //   '0x456...': [...orders]
 * // }
 */
export async function fetchOrdersMulti(marketHashes, options = {}) {
  try {
    const params = {
      marketHashes: marketHashes.join(','),
      ...options
    };

    const response = await axios.get(`${API_BASE_URL}/orders`, { params });
    const orders = response.data.data || [];

    // Group orders by market hash
    return orders.reduce((acc, order) => {
      const hash = order.marketHash;
      if (!acc[hash]) acc[hash] = [];
      acc[hash].push(order);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple orders:', error.message);
    return {};
  }
} 