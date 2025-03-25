# SX Bet Modules

This project contains all the modules developed as part of the YouTube series on building betting bots with the SX Bet API. 

In addition to the modules created during the YouTube series, it also contains a collection of cleaned-up, reusable modules for building betting bots.

### Two-Part Structure

1. **Tutorial Code** (`/tutorial`)
   - Original implementations from the YouTube series
   - Includes testing interfaces and example usage
   - Shows how each module was built and tested
   - Direct reference for viewers following the tutorials

2. **Standalone Modules** (`/standalone`)
   - Clean, minimal implementations of core functionality
   - Designed for easy integration into other projects
   - Removes testing code and CLI interfaces
   - Perfect starting point for building your own betting bot

## Available Modules

Each standalone module includes its own detailed README with:
- Complete API documentation
- Function signatures and parameters
- Usage examples
- Error handling guidance
- Security considerations
- Dependencies and requirements

### Market Data (`/standalone/market-data`)
Core functionality for discovering betting opportunities:
- List available sports and leagues
- Get upcoming fixtures
- Fetch market details
> See `market-data/README.md` for fetching and filtering sports data

### Order Data (`/standalone/order-data`)
Access and analyze the order book:
- Fetch active orders
- Filter by parameters
- Track liquidity and odds
> See `order-data/README.md` for order book operations and analysis

### Order Management (`/standalone/order-management`)
Create and manage orders:
- Post new orders with EIP-712 signing
- Cancel existing orders
- Validate order parameters
> See `order-management/README.md` for order creation and signing details

### Order Filling (`/standalone/order-filling`)
Fill existing orders:
- Calculate fill amounts
- Sign orders using EIP-712
- Execute fills
> See `order-filling/README.md` for fill calculations and execution

### Trade Data (`/standalone/trade-data`)
Access historical trading data:
- Fetch trades (filled orders)
> See `trade-data/README.md` for trade history analysis

### WebSocket (`/standalone/websocket`)
Real-time market updates:
- Subscribe to markets
- Track order book changes
- Handle connection lifecycle
> See `websocket/README.md` for real-time data handling

### Utils (`/standalone/utils`)
Common utilities:
- Format odds and amounts
- Handle API requests
- Convert data formats
> See `utils/README.md` for helper functions and formatting

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sx-bet-bot.git
cd sx-bet-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
```

Add your credentials to `.env`:
```env
# Required for signing orders
PRIVATE_KEY=your_private_key_here

# Required for WebSocket
SX_BET_API_KEY=your_api_key_here

# Optional custom RPC
RPC_URL=your_rpc_url_here
```

## Usage

### Following the Tutorial
The `/tutorial` directory contains the exact code created in the YouTube series. Each module includes testing interfaces to see the functionality in action.

Example using the order filling module:
```bash
cd tutorial/fill-order
npm install
# Add credentials to .env
node index.js
```

### Using Standalone Modules
The `/standalone` modules are cleaned up versions of the modules created in the YouTube series, designed to be easily reusably in any betting bot. Each module has its own detailed README with complete documentation and examples.

Example importing a module:
```javascript
import { fetchMarkets } from 'sx-bet-market-data';
import { createOrder } from 'sx-bet-order-management';

// Fetch markets
const markets = await fetchMarkets(eventId);

// Create an order
const order = createOrder({
  marketHash: markets[0].hash,
  stake: '1000000', // 1 USDC
  odds: '500000000000000000' // 50%
});
```

## Building with AI Agents

These standalone modules can significantly enhance your ability to create a custom betting bot with the help of AI assistants like Claude.

### Why Provide Modules to an AI Assistant

When asking an AI assistant to help build a betting bot:

1. **Code Quality**: AI assistants can analyze these working modules rather than creating implementations from scratch, ensuring reliability and proper error handling.

2. **API Complexity**: The SX Bet API requires specific formatting, signing methods, and error handling that the modules already implement correctly.

3. **Focus on Strategy**: By providing pre-built modules for core functions, you can focus your conversation on betting strategy rather than implementation details.

A simple approach is to:
```
1. Share the relevant module files with the AI assistant
2. Clearly describe the betting strategy you want to implement
3. Ask the AI to combine the modules into a working bot
```

A high-level example (in practice it would be advantageous to add far more detail):
```
"I've shared these SX Bet API modules with you. I want to build a bot that:
- Monitors NFL matches
- Places bets when the odds differ from my model by more than 5%
- Uses WebSocket for real-time updates

Can you show me how to combine these modules to implement this strategy?"
```

## Security

- Never commit private keys or API keys
- Use environment variables for sensitive data
- Review all code before deploying
- Understand the risks of automated trading

## Resources

- [SX Bet Documentation](https://sx.bet/docs)
- [API Reference](https://api.sx.bet/docs)
- [YouTube Tutorial Series](your-channel-link)
- [Discord Community](https://discord.gg/sxbet)

## License

ISC

## Disclaimer

This code is for educational purposes only. Always review and understand any code before using it with real funds. Trading involves risk of loss. The modules provided are basic implementations and may need additional features, testing, or security measures for production use.
