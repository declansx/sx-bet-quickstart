# Order Data Module

Core functionality for fetching order book data from the SX Bet API. This module provides functions for retrieving active orders for markets.

## Functions

### `fetchOrders(marketHash, options?)`
Fetch active orders for a specific market.

```javascript
import { fetchOrders } from './order-data';

// Fetch orders for a single market
const orders = await fetchOrders('0x123...', { chainVersion: 'SXR' });
console.log(orders);
// [
//   {
//     orderHash: '0x...',
//     maker: '0x...',
//     totalBetSize: '1000000',          // 1 USDC (6 decimals)
//     percentageOdds: '5000000000000000000', // 50% (20 decimals)
//     isMakerBettingOutcomeOne: true,
//     fillAmount: '0',
//     expiry: '1234567890',
//     signature: '0x...'
//   },
//   ...
// ]
```

### `fetchOrdersMulti(marketHashes, options?)`
Fetch orders for multiple markets in one request.

```javascript
import { fetchOrdersMulti } from './order-data';

// Fetch orders for multiple markets
const marketHashes = [
  '0x123...',
  '0x456...'
];

const ordersByMarket = await fetchOrdersMulti(marketHashes, { chainVersion: 'SXR' });
console.log(ordersByMarket);
// {
//   '0x123...': [
//     { orderHash: '0x...', ... },
//     { orderHash: '0x...', ... }
//   ],
//   '0x456...': [
//     { orderHash: '0x...', ... }
//   ]
// }
```

## Options

Both functions accept an optional options object:

```javascript
{
  chainVersion: 'SXR',  // Chain version (if not passed, data from both chains is returned)
  maker: '0x...',       // Filter by maker address
}
```

## Error Handling

All functions handle errors gracefully:
- Return empty array `[]` or object `{}` if no data found
- Log errors to console
- Never throw exceptions

## Dependencies

- axios: For making HTTP requests

## Usage Example

Example of fetching and analyzing orders:

```javascript
import { fetchOrders } from './order-data';

async function analyzeMarketOrders(marketHash) {
  const orders = await fetchOrders(marketHash);
  
  // Filter orders by outcome
  const outcomeOneOrders = orders.filter(o => o.isMakerBettingOutcomeOne);
  const outcomeTwoOrders = orders.filter(o => !o.isMakerBettingOutcomeOne);
  
  // Calculate total liquidity per outcome
  const liquidityOne = outcomeOneOrders.reduce(
    (sum, o) => sum + (BigInt(o.totalBetSize) - BigInt(o.fillAmount)),
    0n
  );
  
  const liquidityTwo = outcomeTwoOrders.reduce(
    (sum, o) => sum + (BigInt(o.totalBetSize) - BigInt(o.fillAmount)),
    0n
  );
  
  return {
    outcomeOne: {
      orders: outcomeOneOrders.length,
      liquidity: liquidityOne.toString()
    },
    outcomeTwo: {
      orders: outcomeTwoOrders.length,
      liquidity: liquidityTwo.toString()
    }
  };
} 
