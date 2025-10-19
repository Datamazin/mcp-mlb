/**
 * Inspect the actual ESPN NFL API response structures
 */

const fetch = globalThis.fetch;

async function inspectAPIs() {
  const mahomesId = '3139477';
  
  console.log('=== 1. Core API Athlete Statistics ===\n');
  const statsUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
  try {
    const response = await fetch(statsUrl);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('\n\n=== 2. Site API Team Roster (Chiefs) ===\n');
  const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/roster`;
  try {
    const response = await fetch(rosterUrl);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
}

inspectAPIs().catch(console.error);
