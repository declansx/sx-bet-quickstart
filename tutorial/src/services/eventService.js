// src/services/eventService.js
const apiClient = require('../api/client');

async function fetchSports() {
  return await apiClient.get('/sports') || [];
}

async function fetchLeagues(sportId) {
  const leagues = await apiClient.get('/leagues/active');
  return leagues ? leagues.filter(league => league.sportId === sportId) : [];
}

async function fetchFixtures(leagueId) {
  const fixtures = await apiClient.get('/fixture/active', { leagueId });
  
  if (!fixtures) return [];

  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);

  return fixtures
    .filter(fixture => {
      const startDate = new Date(fixture.startDate);
      return startDate >= now && startDate <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

async function fetchMarkets(eventId) {
  const result = await apiClient.get('/markets/active', { eventId, onlyMainLine: true });
  return result?.markets || [];
}

module.exports = {
  fetchSports,
  fetchLeagues,
  fetchFixtures,
  fetchMarkets
};