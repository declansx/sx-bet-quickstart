import * as ably from 'ably';
import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * SX Bet WebSocket client for real-time order book updates
 * @extends EventEmitter
 */
class SXWebsocketClient extends EventEmitter {
  /**
   * Creates a new SX Bet WebSocket client
   * @param {Object} config Configuration options
   * @param {string} config.apiKey SX Bet API key
   * @param {string} [config.token='0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B'] Token address
   */
  constructor(config) {
    super();
    
    if (!config || !config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.realtime = null;
    this.activeChannels = new Map();
    this.orderBookHistory = new Map();
    this.TOKEN = config.token || '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B';
    this.isConnected = false;
  }

  /**
   * Initializes the WebSocket connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async initialize() {
    try {
      this.realtime = new ably.Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const tokenRequest = await this.createTokenRequest();
            callback(null, tokenRequest);
          } catch (error) {
            console.error('Authentication error:', error.message);
            callback(error, null);
          }
        },
      });

      this.realtime.connection.on('connected', () => {
        console.log('Connected to SX Bet websocket API');
        this.isConnected = true;
        this.emit('connected');
      });

      this.realtime.connection.on('failed', (error) => {
        console.error('Connection failed:', error);
        this.isConnected = false;
        this.emit('connectionFailed', error);
      });

      this.realtime.connection.on('disconnected', () => {
        console.log('Disconnected from SX Bet websocket API');
        this.isConnected = false;
        this.emit('disconnected');
      });

      await this.realtime.connection.once('connected');
      return true;
    } catch (error) {
      console.error('Initialization error:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Creates an authentication token request
   * @private
   * @returns {Promise<Object>} Token request data
   */
  async createTokenRequest() {
    try {
      const response = await axios.get("https://api.sx.bet/user/token", {
        headers: {
          "X-Api-Key": this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating token request:', error.message);
      throw error;
    }
  }

  /**
   * Subscribes to order book updates for a market
   * @param {string} marketHash The market hash to subscribe to
   * @returns {Promise<boolean>} True if subscription is successful
   */
  async subscribeToMarket(marketHash) {
    if (!this.isConnected) {
      console.error('Not connected to the websocket. Please initialize first.');
      return false;
    }

    try {
      if (this.activeChannels.has(marketHash)) {
        console.log(`Already subscribed to market: ${marketHash}`);
        return true;
      }

      const channelName = `order_book:${this.TOKEN}:${marketHash}`;
      const channel = this.realtime.channels.get(channelName);
      
      // Initialize history array for this market
      if (!this.orderBookHistory.has(marketHash)) {
        this.orderBookHistory.set(marketHash, []);
      }

      channel.subscribe((message) => {
        const updates = message.data;
        this.processOrderBookUpdates(marketHash, updates);
      });

      this.activeChannels.set(marketHash, channel);
      console.log(`Subscribed to market: ${marketHash}`);
      return true;
    } catch (error) {
      console.error(`Error subscribing to market ${marketHash}:`, error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Unsubscribes from order book updates for a market
   * @param {string} marketHash The market hash to unsubscribe from
   * @returns {Promise<boolean>} True if unsubscription is successful
   */
  async unsubscribeFromMarket(marketHash) {
    if (!this.activeChannels.has(marketHash)) {
      console.log(`Not subscribed to market: ${marketHash}`);
      return false;
    }

    try {
      const channel = this.activeChannels.get(marketHash);
      await channel.unsubscribe();
      this.activeChannels.delete(marketHash);
      console.log(`Unsubscribed from market: ${marketHash}`);
      return true;
    } catch (error) {
      console.error(`Error unsubscribing from market ${marketHash}:`, error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Processes order book updates from the WebSocket
   * @private
   * @param {string} marketHash The market hash
   * @param {Array} updates Array of order updates
   */
  processOrderBookUpdates(marketHash, updates) {
    if (!Array.isArray(updates)) {
      console.error('Invalid update format received');
      return;
    }

    const history = this.orderBookHistory.get(marketHash) || [];
    
    for (const order of updates) {
      if (!Array.isArray(order) || order.length < 14) {
        console.error('Invalid order format received');
        continue;
      }

      const formattedOrder = {
        orderHash: order[0],
        status: order[1],
        fillAmount: order[2],
        maker: order[3],
        totalBetSize: order[4],
        percentageOdds: order[5],
        expiry: order[6],
        apiExpiry: order[7],
        salt: order[8],
        isMakerBettingOutcomeOne: order[9],
        signature: order[10],
        updateTime: order[11],
        chainVersion: order[12],
        sportXeventId: order[13],
        received: new Date().toISOString()
      };

      history.push(formattedOrder);
      
      // Emit the update
      this.emit('orderBookUpdate', marketHash, formattedOrder);
    }

    // Update history
    this.orderBookHistory.set(marketHash, history);
  }

  /**
   * Gets the list of markets currently subscribed to
   * @returns {Array<string>} Array of market hashes
   */
  getSubscribedMarkets() {
    return Array.from(this.activeChannels.keys());
  }

  /**
   * Gets the order book history for a specific market
   * @param {string} marketHash The market hash
   * @returns {Array} Array of order updates
   */
  getOrderBookHistory(marketHash) {
    return this.orderBookHistory.get(marketHash) || [];
  }

  /**
   * Gets the order book history for all subscribed markets
   * @returns {Object} Object mapping market hashes to their order histories
   */
  getAllOrderBookHistory() {
    const allHistory = {};
    for (const [marketHash, history] of this.orderBookHistory.entries()) {
      allHistory[marketHash] = history;
    }
    return allHistory;
  }

  /**
   * Disconnects from the WebSocket API
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.realtime) return;
    
    try {
      // Unsubscribe from all channels
      for (const marketHash of this.activeChannels.keys()) {
        await this.unsubscribeFromMarket(marketHash);
      }
      
      await this.realtime.connection.close();
      console.log('Disconnected from SX Bet websocket API');
      this.isConnected = false;
    } catch (error) {
      console.error('Error during disconnect:', error.message);
    }
  }
}

export default SXWebsocketClient; 