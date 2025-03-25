# WebSocket Module - Sample Code

This module provides example code for implementing real-time order book updates via WebSocket for the SX Bet API. This is sample code that you can use as a reference or adapt for your own projects.

## Overview

This module demonstrates how to:
- Connect to the SX Bet WebSocket API
- Subscribe to market updates
- Handle real-time order book updates
- Manage WebSocket connections and subscriptions

## Usage

Copy the `index.js` file into your project and import the WebSocket client:

```javascript
import SXWebsocketClient from './websocket';

// Create a new client instance
const client = new SXWebsocketClient({
  apiKey: 'your-api-key',
  token: '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B' // Optional, defaults to USDC
});

// Initialize the connection
await client.initialize();

// Subscribe to a market
await client.subscribeToMarket('0x123...');

// Listen for updates
client.on('orderBookUpdate', (marketHash, order) => {
  console.log(`New order for market ${marketHash}:`, order);
});

// Later, unsubscribe and disconnect
await client.unsubscribeFromMarket('0x123...');
await client.disconnect();
```

## Events

The WebSocket client extends EventEmitter and emits the following events:

- `connected`: Emitted when successfully connected to the WebSocket API
- `disconnected`: Emitted when disconnected from the WebSocket API
- `connectionFailed`: Emitted when connection fails, includes error details
- `error`: Emitted when any error occurs
- `orderBookUpdate`: Emitted when a new order book update is received, includes market hash and order details

## Available Methods

### Constructor

```javascript
const client = new SXWebsocketClient({
  apiKey: string,  // Required: Your SX Bet API key
  token?: string   // Optional: Token address (defaults to USDC)
});
```

### Methods

#### `initialize()`

Initializes the WebSocket connection.

```javascript
const success = await client.initialize();
```

Returns: `Promise<boolean>` - True if connection is successful

#### `subscribeToMarket(marketHash)`

Subscribes to order book updates for a specific market.

```javascript
const success = await client.subscribeToMarket('0x123...');
```

Parameters:
- `marketHash`: string - The market hash to subscribe to

Returns: `Promise<boolean>` - True if subscription is successful

#### `unsubscribeFromMarket(marketHash)`

Unsubscribes from order book updates for a specific market.

```javascript
const success = await client.unsubscribeFromMarket('0x123...');
```

Parameters:
- `marketHash`: string - The market hash to unsubscribe from

Returns: `Promise<boolean>` - True if unsubscription is successful

#### `getSubscribedMarkets()`

Gets the list of markets currently subscribed to.

```javascript
const markets = client.getSubscribedMarkets();
```

Returns: `Array<string>` - Array of market hashes

#### `getOrderBookHistory(marketHash)`

Gets the order book history for a specific market.

```javascript
const history = client.getOrderBookHistory('0x123...');
```

Parameters:
- `marketHash`: string - The market hash to get history for

Returns: `Array` - Array of order updates

#### `getAllOrderBookHistory()`

Gets the order book history for all subscribed markets.

```javascript
const allHistory = client.getAllOrderBookHistory();
```

Returns: `Object` - Object mapping market hashes to their order histories

#### `disconnect()`

Disconnects from the WebSocket API.

```javascript
await client.disconnect();
```

Returns: `Promise<void>`

## Order Update Format

Order updates received through the WebSocket have the following structure:

```javascript
{
  orderHash: string,          // Unique hash identifying the order
  status: string,            // Order status
  fillAmount: string,        // Amount filled
  maker: string,            // Maker's address
  totalBetSize: string,     // Total size of the bet
  percentageOdds: string,   // Odds in percentage format
  expiry: number,          // Order expiry timestamp
  apiExpiry: number,       // API expiry timestamp
  salt: string,            // Order salt
  isMakerBettingOutcomeOne: boolean, // Which outcome the maker is betting on
  signature: string,       // Maker's signature
  updateTime: number,      // Update timestamp
  chainVersion: string,    // Chain version
  sportXeventId: string,   // Event ID
  received: string        // ISO timestamp when update was received
}
```

## Example: Market Monitoring

Here's a complete example of monitoring a market for order book updates:

```javascript
import SXWebsocketClient from './websocket';

async function monitorMarket(marketHash) {
  try {
    // Initialize client
    const client = new SXWebsocketClient({
      apiKey: process.env.SX_BET_API_KEY
    });

    // Set up event handlers
    client.on('connected', () => {
      console.log('Connected to WebSocket API');
    });

    client.on('orderBookUpdate', (market, order) => {
      console.log(`New order for ${market}:`);
      console.log(`- Hash: ${order.orderHash}`);
      console.log(`- Status: ${order.status}`);
      console.log(`- Size: ${order.totalBetSize}`);
      console.log(`- Odds: ${order.percentageOdds}`);
    });

    client.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Initialize and subscribe
    await client.initialize();
    await client.subscribeToMarket(marketHash);

    // Keep the process running
    process.on('SIGINT', async () => {
      await client.disconnect();
      process.exit();
    });

  } catch (error) {
    console.error('Error monitoring market:', error);
  }
}
```

## Dependencies

This sample code requires:
- `ably` for WebSocket communication
- `axios` for HTTP requests
- `events` for event handling

## Error Handling

The WebSocket client includes comprehensive error handling:
1. Connection errors are caught and reported
2. Subscription errors are handled gracefully
3. Invalid update formats are validated
4. Network disconnections are managed
5. Async method errors are caught and reported

## Security Considerations

1. **API Keys**: Store API keys securely (e.g., environment variables)
2. **Connection Management**: Implement proper reconnection logic
3. **Data Validation**: Validate all received data
4. **Memory Management**: Clean up resources on disconnect
5. **Error Handling**: Implement proper error handling in your application 