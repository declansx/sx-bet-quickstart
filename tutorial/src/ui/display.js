// src/ui/display.js
const { calculateTakerOdds, calculateRemainingTakerSpace } = require('../utils/formatter');

function displayOrderBook(orders, outcomeOneName, outcomeTwoName) {
  const outcomeOneOrders = [];
  const outcomeTwoOrders = [];

  orders.forEach(order => {
    const decimalOdds = calculateTakerOdds(order.percentageOdds);
    const remainingLiquidity = calculateRemainingTakerSpace(order);

    const orderData = {
      odds: decimalOdds,
      liquidity: remainingLiquidity
    };

    if (order.isMakerBettingOutcomeOne) {
      outcomeTwoOrders.push(orderData);
    } else {
      outcomeOneOrders.push(orderData);
    }
  });

  outcomeOneOrders.sort((a, b) => b.odds - a.odds);
  outcomeTwoOrders.sort((a, b) => b.odds - a.odds);

  console.log(`\nOrder Book for ${outcomeOneName} vs ${outcomeTwoName}\n`);
  console.log(`${outcomeOneName} (Back Outcome)`);
  console.log('Decimal Odds | Liquidity');
  console.log('------------------------');
  outcomeOneOrders.forEach(order => console.log(`${order.odds}       | ${order.liquidity}`));

  console.log(`\n${outcomeTwoName} (Lay Outcome)`);
  console.log('Decimal Odds | Liquidity');
  console.log('------------------------');
  outcomeTwoOrders.forEach(order => console.log(`${order.odds}       | ${order.liquidity}`));
}

function displayTrades(trades, outcomeOneName, outcomeTwoName) {
  if (trades.length === 0) {
    console.log("\nNo active trades found for this market.");
    return;
  }

  console.log(`\nActive Taker Trades for ${outcomeOneName} vs ${outcomeTwoName}:`);
  console.log("----------------------------------------------------------------");
  console.log("| Time (UTC)         | Odds   | Stake (USDC) | Outcome           | Bettor Address        |");
  console.log("----------------------------------------------------------------");

  trades
    .sort((a, b) => a.betTime - b.betTime) // Chronological order
    .forEach(trade => {
      const betTime = new Date(trade.betTime * 1000).toISOString().replace("T", " ").slice(0, 19);
      const decimalOdds = (1 / (trade.odds / 1e20)).toFixed(2);
      const stake = (trade.stake / 1e6).toFixed(2);
      const outcome = trade.bettingOutcomeOne ? outcomeOneName : outcomeTwoName;
      const bettor = trade.bettor;

      console.log(`| ${betTime} | ${decimalOdds}  | ${stake}        | ${outcome.padEnd(17)} | ${bettor} |`);
    });

  console.log("----------------------------------------------------------------");
}

module.exports = {
  displayOrderBook,
  displayTrades
};