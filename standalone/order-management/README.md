# Order Management Module - Sample Code
This module provides example code for managing orders (posting and cancelling) on the SX Bet API. This is sample code that you can use as a reference or adapt for your own projects.

## Overview
This module demonstrates how to:
- Create order objects with proper parameters
- Sign orders using EIP-712
- Post orders to the SX Bet API
- Cancel existing orders
- Handle API responses and errors

## Usage
Copy the `index.js` file into your project and import the functions you need:

```javascript
import { createOrder, postOrder, cancelOrders } from './order-management';
```

## Available Functions

### `createOrder(params)`
Creates an order object with the specified parameters.

```javascript
const order = createOrder({
  marketHash: '0x123...', // Market hash
  maker: '0xabc...', // Maker's address
  baseToken: '0xdef...', // Base token address
  executor: '0x789...', // Executor address
  stake: 100, // Stake amount
  odds: 2.5, // Odds for the order
  outcomeId: 1, // Outcome ID
  isBuy: true // Whether this is a buy order
});
```

### `postOrder(order, wallet)`
Posts an order to the SX Bet API. The order is signed using EIP-712 before submission.

```javascript
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(privateKey);
const result = await postOrder(order, wallet);
console.log('Order posted:', result);
```

### `cancelOrders(orderHashes, wallet)`
Cancels one or more orders on the SX Bet API. The cancellation request is signed using EIP-712.

```javascript
const orderHashes = [
  '0x123...',
  '0x456...'
];
const result = await cancelOrders(orderHashes, wallet);
console.log('Orders cancelled:', result);
```

## Example Usage
Here's a complete example of creating and posting an order:

```javascript
import { ethers } from 'ethers';
import { createOrder, postOrder, cancelOrders } from './order-management';

async function placeMarketOrder() {
  try {
    // Initialize wallet
    const privateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey);

    // Create order object
    const order = createOrder({
      marketHash: '0x123...',
      maker: wallet.address,
      baseToken: '0xdef...',
      executor: '0x789...',
      stake: 100,
      odds: 2.5,
      outcomeId: 1,
      isBuy: true
    });

    // Post the order
    const result = await postOrder(order, wallet);
    console.log('Order posted successfully:', result);

    // Later, if you need to cancel the order
    await cancelOrders([result.data.orderHash], wallet);
    console.log('Order cancelled successfully');

  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Error Handling
All functions will throw errors if:
- Required parameters are missing or invalid
- API requests fail
- Signing operations fail
- The API returns a non-success status

Errors include descriptive messages to help identify the issue.

## Dependencies
This sample code requires:
- `ethers` for wallet operations and EIP-712 signing
- `fetch` for making HTTP requests (available in modern JavaScript environments)

## Constants
The module exports a `CONSTANTS` object with the following values:
- `chainId`: The chain ID for SX Bet (4162)
- `postOrderUrl`: The API endpoint for posting orders
- `cancelOrderUrl`: The API endpoint for cancelling orders

## Security Considerations
1. **Private Key Management**: Never hardcode private keys. Use environment variables or secure key management solutions.
2. **API Endpoints**: The module uses HTTPS endpoints by default. Do not modify these to use unsecured HTTP.
3. **Input Validation**: While the module performs basic validation, always validate input parameters in your application code.
4. **Error Handling**: Always implement proper error handling in your application code to handle API errors gracefully. 