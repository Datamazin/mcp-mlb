/**
 * Test ESPN NFL API endpoints to find working player data sources
 */

// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testEndpoints() {
  const mahomesId = '3139477';
  const flaccoId = '5209'; // Joe Flacco's ESPN ID
  
  console.log('Testing ESPN NFL API endpoints...\n');
  
  // Test 1: Core API - Athlete Overview (most comprehensive)
  console.log('1. Testing Core API Athlete Overview:');
  const overviewUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${mahomesId}?lang=en&region=us`;
  try {
    const response = await fetch(overviewUrl);
    const data = await response.json();
    console.log('✅ Success! Found athlete data');
    console.log('Name:', data.displayName || data.fullName);
    console.log('Position:', data.position?.displayName);
    console.log('Team:', data.team?.displayName);
    if (data.statistics) {
      console.log('Statistics reference:', data.statistics.$ref);
    }
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  // Test 2: Core API - Athlete Statistics
  console.log('2. Testing Core API Athlete Statistics:');
  const statsUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
  try {
    const response = await fetch(statsUrl);
    const data = await response.json();
    console.log('✅ Success! Found statistics');
    console.log('Categories:', data.categories?.map(c => c.name).join(', '));
    if (data.splits?.categories?.[0]?.stats) {
      const stats = data.splits.categories[0].stats.slice(0, 5);
      console.log('Sample stats:', stats.map(s => `${s.displayName}: ${s.displayValue}`).join(', '));
    }
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  // Test 3: Site API - Scoreboard Athletes
  console.log('3. Testing Site API Scoreboard:');
  const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
  try {
    const response = await fetch(scoreboardUrl);
    const data = await response.json();
    console.log('✅ Success! Found scoreboard');
    const games = data.events?.length || 0;
    console.log('Current games:', games);
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  // Test 4: Site API - Teams
  console.log('4. Testing Site API Teams:');
  const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`;
  try {
    const response = await fetch(teamsUrl);
    const data = await response.json();
    console.log('✅ Success! Found teams');
    const teamCount = data.sports?.[0]?.leagues?.[0]?.teams?.length || 0;
    console.log('Team count:', teamCount);
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  // Test 5: Site API - Team Roster (Chiefs - team ID 12)
  console.log('5. Testing Site API Team Roster (Chiefs):');
  const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/roster`;
  try {
    const response = await fetch(rosterUrl);
    const data = await response.json();
    console.log('✅ Success! Found roster');
    const athletes = data.athletes || [];
    const mahomes = athletes.find(a => a.id === mahomesId);
    if (mahomes) {
      console.log('Found Mahomes in roster!');
      console.log('Name:', mahomes.displayName || mahomes.fullName);
      console.log('Position:', mahomes.position?.displayName);
    }
    console.log('Roster size:', athletes.length);
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  // Test 6: Web API - Search
  console.log('6. Testing Web API Search:');
  const searchUrl = `https://site.web.api.espn.com/apis/common/v3/search?query=Patrick%20Mahomes&limit=10`;
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    console.log('✅ Success! Found search results');
    const results = data.results?.filter(r => r.type === 'athlete') || [];
    console.log('Athlete results:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0].athlete?.displayName);
    }
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log();
  }
  
  console.log('\n=== Recommendation ===');
  console.log('Best approach: Use Site API team rosters for player search');
  console.log('1. Load all 32 team rosters once');
  console.log('2. Cache players for fuzzy search');
  console.log('3. Use Core API athlete statistics for stats comparison');
}

testEndpoints().catch(console.error);
