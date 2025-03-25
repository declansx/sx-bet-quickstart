# Trade Data Module

Core functionality for fetching trade history from the SX Bet API. This module provides functions for retrieving successful trades for markets.

## Functions

### `fetchTrades(marketHash, options?)`
Fetch successful trades for a specific market.

```javascript
import { fetchTrades } from './trade-data';

// Fetch trades for a single market
const trades = await fetchTrades('0x123...');
console.log(trades);
// [
//   {
//     tradeHash: '0x...',
//     bettor: '0x...',
//     stake: '1000000',          // 1 USDC (6 decimals)
//     odds: '5000000000000000000', // 50% (20 decimals)
//     bettingOutcomeOne: true,
//     betTime: '1234567890',
//     marketHash: '0x123...',
//     chainVersion: 'SXR'
//   },
//   ...
// ]
```

### `fetchTradesMulti(marketHashes, options?)`
Fetch trades for multiple markets in one request.

```javascript
import { fetchTradesMulti } from './trade-data';

// Fetch trades for multiple markets
const marketHashes = [
  '0x123...',
  '0x456...'
];

const tradesByMarket = await fetchTradesMulti(marketHashes);
console.log(tradesByMarket);
// {
//   '0x123...': [
//     { tradeHash: '0x...', ... },
//     { tradeHash: '0x...', ... }
//   ],
//   '0x456...': [
//     { tradeHash: '0x...', ... }
//   ]
// }
```

## Options

Both functions accept an optional options object:

```javascript
{
  maker: false,           // Only return taker trades
  chainVersion: 'SXR',   // Chain version (If no value is passed, data from both chains is returned)
  tradeStatus: 'SUCCESS', // Trade status (SUCCESS or FAILED status)
  pageSize: 100          // Number of trades to return (default: 100)
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

Example of analyzing trade history:

```javascript
import { fetchTrades } from './trade-data';

async function analyzeMarketActivity(marketHash) {
  const trades = await fetchTrades(marketHash);
  
  // Group trades by outcome
  const outcomeOneTrades = trades.filter(t => t.bettingOutcomeOne);
  const outcomeTwoTrades = trades.filter(t => !t.bettingOutcomeOne);
  
  // Calculate total volume per outcome
  const volumeOne = outcomeOneTrades.reduce(
    (sum, t) => sum + BigInt(t.stake),
    0n
  );
  
  const volumeTwo = outcomeTwoTrades.reduce(
    (sum, t) => sum + BigInt(t.stake),
    0n
  );
  
  return {
    outcomeOne: {
      trades: outcomeOneTrades.length,
      volume: volumeOne.toString()
    },
    outcomeTwo: {
      trades: outcomeTwoTrades.length,
      volume: volumeTwo.toString()
    },
    totalTrades: trades.length,
    totalVolume: (volumeOne + volumeTwo).toString()
  };
} 
