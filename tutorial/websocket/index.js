// app.js
import readline from 'readline';
import sxWebsocketClient from './websocketModule.js';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to clear console
const clearConsole = () => {
  console.clear();
};

// Helper to prompt user to continue
const promptContinue = () => {
  return new Promise((resolve) => {
    rl.question('\nPress Enter to continue...', () => {
      resolve();
    });
  });
};

// Main menu
const showMainMenu = async () => {
  clearConsole();
  console.log('\n===== SX BET ORDER BOOK TRACKER =====');
  console.log('1. Subscribe to a market');
  console.log('2. Unsubscribe from a market');
  console.log('3. View order book updates');
  console.log('4. Exit');
  console.log('=====================================');
  
  const answer = await new Promise((resolve) => {
    rl.question('Select an option (1-4): ', resolve);
  });
  
  switch (answer) {
    case '1':
      await handleSubscribe();
      break;
    case '2':
      await handleUnsubscribe();
      break;
    case '3':
      await handleViewUpdates();
      break;
    case '4':
      await handleExit();
      return false;
    default:
      console.log('Invalid option. Please try again.');
      await promptContinue();
  }
  return true;
};

// Handle subscribe
const handleSubscribe = async () => {
  clearConsole();
  console.log('\n===== SUBSCRIBE TO A MARKET =====');
  
  const marketHash = await new Promise((resolve) => {
    rl.question('Enter market hash: ', resolve);
  });
  
  if (!marketHash) {
    console.log('Market hash is required.');
    await promptContinue();
    return;
  }
  
  console.log(`Subscribing to market: ${marketHash}`);
  const success = await sxWebsocketClient.subscribeToMarket(marketHash);
  
  if (success) {
    console.log('Successfully subscribed!');
  } else {
    console.log('Failed to subscribe. See above errors for details.');
  }
  
  await promptContinue();
};

// Handle unsubscribe
const handleUnsubscribe = async () => {
  clearConsole();
  console.log('\n===== UNSUBSCRIBE FROM A MARKET =====');
  
  const subscribedMarkets = sxWebsocketClient.getSubscribedMarkets();
  
  if (subscribedMarkets.length === 0) {
    console.log('No active subscriptions.');
    await promptContinue();
    return;
  }
  
  console.log('\nCurrently subscribed markets:');
  subscribedMarkets.forEach((hash, index) => {
    console.log(`${index + 1}. ${hash}`);
  });
  
  const selection = await new Promise((resolve) => {
    rl.question('\nEnter the number of the market to unsubscribe from (or 0 to cancel): ', resolve);
  });
  
  const selectedIndex = parseInt(selection) - 1;
  if (isNaN(selectedIndex) || selectedIndex < -1 || selectedIndex >= subscribedMarkets.length) {
    console.log('Invalid selection.');
    await promptContinue();
    return;
  }
  
  if (selectedIndex === -1) {
    return;
  }
  
  const marketHash = subscribedMarkets[selectedIndex];
  console.log(`Unsubscribing from market: ${marketHash}`);
  const success = await sxWebsocketClient.unsubscribeFromMarket(marketHash);
  
  if (success) {
    console.log('Successfully unsubscribed!');
  } else {
    console.log('Failed to unsubscribe. See above errors for details.');
  }
  
  await promptContinue();
};

// Handle view updates
const handleViewUpdates = async () => {
  clearConsole();
  console.log('\n===== VIEW ORDER BOOK UPDATES =====');
  
  const subscribedMarkets = sxWebsocketClient.getSubscribedMarkets();
  
  if (subscribedMarkets.length === 0) {
    console.log('No active subscriptions.');
    await promptContinue();
    return;
  }
  
  console.log('\nSelect a market to view updates:');
  subscribedMarkets.forEach((hash, index) => {
    console.log(`${index + 1}. ${hash}`);
  });
  console.log(`${subscribedMarkets.length + 1}. All markets (live updates)`);
  
  const selection = await new Promise((resolve) => {
    rl.question('\nEnter your selection (or 0 to cancel): ', resolve);
  });
  
  const selectedIndex = parseInt(selection) - 1;
  if (isNaN(selectedIndex) || selectedIndex < -1 || selectedIndex > subscribedMarkets.length) {
    console.log('Invalid selection.');
    await promptContinue();
    return;
  }
  
  if (selectedIndex === -1) {
    return;
  }
  
  if (selectedIndex === subscribedMarkets.length) {
    await viewLiveUpdates();
  } else {
    const marketHash = subscribedMarkets[selectedIndex];
    await viewMarketHistory(marketHash);
  }
};

// View history for a specific market
const viewMarketHistory = async (marketHash) => {
  clearConsole();
  console.log(`\n===== ORDER BOOK HISTORY FOR ${marketHash} =====`);
  
  const history = sxWebsocketClient.getOrderBookHistory(marketHash);
  
  if (history.length === 0) {
    console.log('No updates received yet for this market.');
  } else {
    console.log(`Total updates: ${history.length}`);
    console.log('\nLast 5 updates:');
    
    const recentUpdates = history.slice(-5);
    recentUpdates.forEach((order, index) => {
      console.log(`\nUpdate ${index + 1}:`);
      displayOrder(order);
    });
  }
  
  await promptContinue();
};

// View live updates for all subscribed markets
const viewLiveUpdates = async () => {
  clearConsole();
  console.log('\n===== LIVE ORDER BOOK UPDATES =====');
  console.log('Showing real-time updates for all subscribed markets.');
  console.log('Press Ctrl+C to return to main menu.');
  
  // Store current subscribed markets
  const markets = sxWebsocketClient.getSubscribedMarkets();
  
  if (markets.length === 0) {
    console.log('No markets are currently subscribed.');
    await promptContinue();
    return;
  }
  
  console.log('\nSubscribed markets:');
  markets.forEach(market => console.log(`- ${market}`));
  
  // Set up update listener
  const updateHandler = (marketHash, order) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] Update for market: ${marketHash}`);
    displayOrder(order);
    console.log('\n(Press Ctrl+C to return to main menu)');
  };
  
  // Register the listener
  sxWebsocketClient.on('orderBookUpdate', updateHandler);
  
  // Wait for user to exit
  try {
    await new Promise((_, reject) => {
      const exitHandler = () => {
        reject(new Error('User exited'));
      };
      
      process.on('SIGINT', exitHandler);
      // Make sure we remove the handler if promise resolves (which it shouldn't)
      setTimeout(() => {
        process.removeListener('SIGINT', exitHandler);
      }, 1000 * 60 * 60); // 1 hour timeout as safety
    });
  } catch (error) {
    // Expected error when user presses Ctrl+C
  } finally {
    // Remove listener when done
    sxWebsocketClient.removeListener('orderBookUpdate', updateHandler);
    process.removeAllListeners('SIGINT');
  }
};

// Helper to display an order
const displayOrder = (order) => {
  console.log(`Order Hash: ${order.orderHash}`);
  console.log(`Status: ${order.status}`);
  console.log(`Maker: ${order.maker}`);
  console.log(`Total Bet Size: ${order.totalBetSize}`);
  console.log(`Fill Amount: ${order.fillAmount}`);
  console.log(`Percentage Odds: ${order.percentageOdds}`);
  console.log(`Chain Version: ${order.chainVersion}`);
  console.log(`Event ID: ${order.sportXeventId}`);
  
  // Calculate and display implied odds
  const impliedOdds = (BigInt(order.percentageOdds) / BigInt(10**20)).toString();
  const takerOdds = (1 - Number(impliedOdds)).toFixed(4);
  console.log(`Implied Odds: ${impliedOdds}`);
  console.log(`Taker Odds: ${takerOdds}`);
};

// Handle exit
const handleExit = async () => {
  console.log('\nShutting down...');
  await sxWebsocketClient.disconnect();
  rl.close();
  console.log('Goodbye!');
};

// Initialize and start the app
const startApp = async () => {
  console.log('Initializing SX Bet API connection...');
  
  try {
    const success = await sxWebsocketClient.initialize();
    if (!success) {
      console.error('Failed to initialize the SX Bet API connection.');
      rl.close();
      return;
    }
    
    console.log('Successfully connected to SX Bet API.');
    
    // Main application loop
    let keepRunning = true;
    while (keepRunning) {
      keepRunning = await showMainMenu();
    }
  } catch (error) {
    console.error('Application error:', error.message);
    rl.close();
  }
};

// Start the application
startApp();