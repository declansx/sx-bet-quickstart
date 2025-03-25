# SX Bet Utilities - Sample Code

This module contains utility functions for working with the SX Bet API, including formatting helpers and API client functions. This is sample code that you can use as a reference or adapt for your own projects.

## Overview

This module provides several utility functions for:
- Formatting odds, amounts, and addresses
- Making API requests to SX Bet
- Calculating order spaces and payouts
- Converting between different units

## Usage

Copy the `index.js` file into your project and import the functions you need:

```javascript
import {
  calculateTakerOdds,
  convertToNominalUnits,
  formatAmount,
  get,
  post
} from './utils';
```

## Available Functions

### Formatting Utilities

#### `calculateTakerOdds(percentageOdds)`

Calculates the taker odds from percentage odds.

```javascript
const odds = calculateTakerOdds('500000000000000000'); // 50%
console.log(odds); // "2.00"
```

#### `convertToNominalUnits(amount, decimals = 6)`

Converts an amount from base units to nominal units.

```javascript
const amount = convertToNominalUnits('1000000'); // 1 USDC
console.log(amount); // "1.00"
```

#### `calculateRemainingTakerSpace(order)`

Calculates the remaining taker space for an order.

```javascript
const space = calculateRemainingTakerSpace({
  totalBetSize: '1000000',
  fillAmount: '500000',
  percentageOdds: '500000000000000000'
});
console.log(space); // "0.50"
```

#### `formatTimestamp(timestamp)`

Formats a Unix timestamp to a human-readable string.

```javascript
const date = formatTimestamp(1679529600);
console.log(date); // "3/23/2023, 12:00:00 PM"
```

#### `formatAddress(address)`

Formats an Ethereum address to a shortened form.

```javascript
const short = formatAddress('0x1234567890abcdef1234567890abcdef12345678');
console.log(short); // "0x1234...5678"
```

#### `formatAmount(amount, decimals = 6, addCommas = true)`

Formats an amount with specified decimals and optional comma separators.

```javascript
const amount = formatAmount('1000000000', 6, true);
console.log(amount); // "1,000.00"
```

### API Utilities

#### `get(endpoint, params = {}, options = {})`

Makes a GET request to the SX Bet API.

```javascript
// Fetch active orders
const orders = await get('/orders', {
  maker: '0x123...',
  chainVersion: 'SXR'
}, {
  apiKey: 'your-api-key' // Optional
});
```

Parameters:
- `endpoint`: API endpoint path
- `params`: Query parameters
- `options`: Request options (e.g., apiKey)

Returns: Promise resolving to the response data

#### `post(endpoint, data, options = {})`

Makes a POST request to the SX Bet API.

```javascript
// Submit an order
const result = await post('/orders/post/v2', {
  order: orderData,
  signature: signature
}, {
  apiKey: 'your-api-key' // Optional
});
```

Parameters:
- `endpoint`: API endpoint path
- `data`: Request body
- `options`: Request options (e.g., apiKey)

Returns: Promise resolving to the response data

### Constants

- `API_BASE_URL`: Base URL for the SX Bet API

## Example Usage

### Working with Orders

```javascript
import { calculateTakerOdds, formatAmount, formatAddress } from './utils';

function displayOrder(order) {
  console.log('Order Details:');
  console.log(`Maker: ${formatAddress(order.maker)}`);
  console.log(`Size: ${formatAmount(order.totalBetSize)} USDC`);
  console.log(`Odds: ${calculateTakerOdds(order.percentageOdds)}`);
}
```

### Making API Requests

```javascript
import { get, post } from './utils';

async function fetchAndDisplayOrders(maker) {
  try {
    // Fetch orders
    const orders = await get('/orders', {
      maker,
      chainVersion: 'SXR'
    });

    // Display orders
    orders.forEach(displayOrder);

  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Error Handling

All API functions include error handling:

1. GET requests return `[]` for array responses or `null` for object responses on error
2. POST requests throw errors that should be caught and handled by your application
3. Formatting functions handle invalid inputs gracefully

## Dependencies

This sample code requires:
- `axios` for making HTTP requests

## Security Considerations

1. **API Keys**: Store API keys securely (e.g., environment variables)
2. **Input Validation**: Validate inputs before passing to formatting functions
3. **Error Handling**: Implement proper error handling in your application
4. **HTTPS**: All API requests use HTTPS by default 