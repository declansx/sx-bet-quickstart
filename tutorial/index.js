// index.js
const { promptUser } = require('./src/ui/prompts');
const { displayOrderBook, displayTrades } = require('./src/ui/display');
const eventService = require('./src/services/eventService');
const orderService = require('./src/services/orderService');
const tradeService = require('./src/services/tradeService');

async function main() {
  const sports = await eventService.fetchSports();
  if (sports.length === 0) return;

  console.log('\nAvailable Sports:');
  sports.forEach((sport, index) => console.log(`${index + 1}. ${sport.label}`));

  let sportIndex = await promptUser('Select a sport by number: ');
  sportIndex = parseInt(sportIndex) - 1;
  if (isNaN(sportIndex) || sportIndex < 0 || sportIndex >= sports.length) return;

  const leagues = await eventService.fetchLeagues(sports[sportIndex].sportId);
  if (leagues.length === 0) return;

  leagues.forEach((league, index) => console.log(`${index + 1}. ${league.label}`));
  let leagueIndex = await promptUser('Select a league by number: ');
  leagueIndex = parseInt(leagueIndex) - 1;
  if (isNaN(leagueIndex) || leagueIndex < 0 || leagueIndex >= leagues.length) return;

  const fixtures = await eventService.fetchFixtures(leagues[leagueIndex].leagueId);
  if (fixtures.length === 0) return;

  fixtures.forEach((fixture, index) => console.log(`${index + 1}. ${fixture.participantOneName} vs ${fixture.participantTwoName} - ${fixture.startDate}`));
  let fixtureIndex = await promptUser('Select a fixture by number: ');
  fixtureIndex = parseInt(fixtureIndex) - 1;
  if (isNaN(fixtureIndex) || fixtureIndex < 0 || fixtureIndex >= fixtures.length) return;

  const markets = await eventService.fetchMarkets(fixtures[fixtureIndex].eventId);
  if (markets.length === 0) return;

  markets.forEach((market, index) => console.log(`${index + 1}. ${market.outcomeOneName} vs ${market.outcomeTwoName}`));
  let marketIndex = await promptUser('Select a market by number: ');
  marketIndex = parseInt(marketIndex) - 1;
  if (isNaN(marketIndex) || marketIndex < 0 || marketIndex >= markets.length) return;

  const market = markets[marketIndex];
  const choice = await promptUser("View (1) Orders or (2) Trades? ");
  
  if (choice === "1") {
    const orders = await orderService.fetchOrders(market.marketHash);
    displayOrderBook(orders, market.outcomeOneName, market.outcomeTwoName);
  } else {
    const trades = await tradeService.fetchTrades(market.marketHash);
    displayTrades(trades, market.outcomeOneName, market.outcomeTwoName);
  }
}

main().finally(() => {
  require('./src/ui/prompts').closePrompt();
});