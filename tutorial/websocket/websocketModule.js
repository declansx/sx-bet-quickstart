// websocketModule.js
import * as ably from 'ably';
import axios from 'axios';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

class SXWebsocketClient extends EventEmitter {
  constructor() {
    super();
    this.realtime = null;
    this.activeChannels = new Map();
    this.orderBookHistory = new Map();
    this.TOKEN = '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B'; // Fixed token as per requirements
    this.isConnected = false;
  }

  async initialize() {
    try {
      if (!process.env.SX_BET_API_KEY) {
        throw new Error('API key not found. Please add SX_BET_API_KEY to your .env file');
      }

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

  async createTokenRequest() {
    try {
      const response = await axios.get("https://api.sx.bet/user/token", {
        headers: {
          "X-Api-Key": process.env.SX_BET_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating token request:', error.message);
      throw error;
    }
  }

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

  getSubscribedMarkets() {
    return Array.from(this.activeChannels.keys());
  }

  getOrderBookHistory(marketHash) {
    return this.orderBookHistory.get(marketHash) || [];
  }

  getAllOrderBookHistory() {
    const allHistory = {};
    for (const [marketHash, history] of this.orderBookHistory.entries()) {
      allHistory[marketHash] = history;
    }
    return allHistory;
  }

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

// Export a singleton instance
const sxWebsocketClient = new SXWebsocketClient();
export default sxWebsocketClient;