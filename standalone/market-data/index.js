// Market data service for SX Bet API
import axios from 'axios';

const API_BASE_URL = 'https://api.sx.bet';

/**
 * Fetch all available sports
 * @returns {Promise<Array>} Array of sport objects
 * 
 * Example:
 * const sports = await fetchSports();
 * console.log(sports); // [{id: 1, name: 'Soccer'}, ...]
 */
export async function fetchSports() {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    return [];
  }
}

/**
 * Fetch active leagues for a sport
 * @param {string|number} sportId - The ID of the sport
 * @returns {Promise<Array>} Array of league objects
 * 
 * Example:
 * const leagues = await fetchLeagues(1);
 * console.log(leagues); // [{id: 1, name: 'Premier League', sportId: 1}, ...]
 */
export async function fetchLeagues(sportId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/leagues/active`);
    const leagues = response.data.data;
    return leagues ? leagues.filter(league => league.sportId === sportId) : [];
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    return [];
  }
}

/**
 * Fetch active fixtures for a league (next 7 days)
 * @param {string|number} leagueId - The ID of the league
 * @returns {Promise<Array>} Array of fixture objects
 * 
 * Example:
 * const fixtures = await fetchFixtures(1);
 * console.log(fixtures); // [{id: 1, homeTeam: 'Team A', awayTeam: 'Team B', startDate: '2024-03-25T15:00:00Z'}, ...]
 */
export async function fetchFixtures(leagueId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/fixture/active`, {
      params: { leagueId }
    });
    
    const fixtures = response.data.data;
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
  } catch (error) {
    console.error('Error fetching fixtures:', error.message);
    return [];
  }
}

/**
 * Fetch active markets for an event
 * @param {string|number} eventId - The ID of the event
 * @returns {Promise<Array>} Array of market objects
 * 
 * Example:
 * const markets = await fetchMarkets(1);
 * console.log(markets); // [{hash: '0x...', outcomeOneName: 'Team A', outcomeTwoName: 'Team B'}, ...]
 */
export async function fetchMarkets(eventId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/markets/active`, {
      params: { eventId, onlyMainLine: true }
    });
    return response.data.data?.markets || [];
  } catch (error) {
    console.error('Error fetching markets:', error.message);
    return [];
  }
} 