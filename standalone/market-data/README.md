# Market Data Module

Core functionality for fetching market data from the SX Bet API. This module provides functions for discovering available sports, leagues, fixtures, and markets.

## Functions

### `fetchSports()`
Fetch all available sports.

```javascript
import { fetchSports } from './market-data';

const sports = await fetchSports();
console.log(sports);
// [
//   { id: 1, name: 'Soccer' },
//   { id: 2, name: 'Basketball' },
//   ...
// ]
```

### `fetchLeagues(sportId)`
Fetch active leagues for a specific sport.

```javascript
import { fetchLeagues } from './market-data';

const leagues = await fetchLeagues(1); // Soccer leagues
console.log(leagues);
// [
//   { id: 1, name: 'Premier League', sportId: 1 },
//   { id: 2, name: 'La Liga', sportId: 1 },
//   ...
// ]
```

### `fetchFixtures(leagueId)`
Fetch active fixtures for a league (next 7 days only).

```javascript
import { fetchFixtures } from './market-data';

const fixtures = await fetchFixtures(1); // Premier League fixtures
console.log(fixtures);
// [
//   {
//     id: 1,
//     homeTeam: 'Team A',
//     awayTeam: 'Team B',
//     startDate: '2024-03-25T15:00:00Z',
//     ...
//   },
//   ...
// ]
```

### `fetchMarkets(eventId)`
Fetch active markets for an event.

```javascript
import { fetchMarkets } from './market-data';

const markets = await fetchMarkets(1);
console.log(markets);
// [
//   {
//     hash: '0x...',
//     outcomeOneName: 'Team A',
//     outcomeTwoName: 'Team B',
//     ...
//   },
//   ...
// ]
```

## Error Handling

All functions handle errors gracefully:
- Return empty array `[]` if no data found
- Log errors to console
- Never throw exceptions

## Dependencies

- axios: For making HTTP requests

## Usage Flow

Typical usage flow for discovering markets:

```javascript
import { fetchSports, fetchLeagues, fetchFixtures, fetchMarkets } from './market-data';

async function discoverMarkets() {
  // 1. Get available sports
  const sports = await fetchSports();
  const soccer = sports.find(s => s.name === 'Soccer');
  
  // 2. Get leagues for the sport
  const leagues = await fetchLeagues(soccer.id);
  const premierLeague = leagues.find(l => l.name === 'Premier League');
  
  // 3. Get upcoming fixtures
  const fixtures = await fetchFixtures(premierLeague.id);
  
  // 4. Get markets for a fixture
  const firstFixture = fixtures[0];
  const markets = await fetchMarkets(firstFixture.id);
  
  return markets;
} 