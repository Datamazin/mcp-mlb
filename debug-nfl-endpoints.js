/**
 * Debug NFL API endpoints to find working stats URLs
 */

async function testNFLEndpoints() {
  const playerIds = ['17102', '3916387']; // Josh Allen, Lamar Jackson
  const season = 2024;
  
  for (const playerId of playerIds) {
    console.log(`\nTesting player ID: ${playerId}`);
    
    // Test different ESPN NFL stats endpoints
    const endpoints = [
      `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/2/athletes/${playerId}/statistics/0?lang=en&region=us`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}/stats`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}/statistics?lang=en&region=us`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}?lang=en&region=us`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}/overview`
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      try {
        console.log(`  Endpoint ${i + 1}: ${endpoints[i]}`);
        const response = await fetch(endpoints[i]);
        console.log(`    Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`    Response keys: ${Object.keys(data).join(', ')}`);
          
          // Check for different stat structures
          if (data.statistics) console.log(`    Has statistics: YES (${Object.keys(data.statistics).length} keys)`);
          if (data.splits) console.log(`    Has splits: YES`);
          if (data.stats) console.log(`    Has stats: YES`);
          if (data.athlete?.statistics) console.log(`    Has athlete.statistics: YES`);
          if (data.athlete?.splits) console.log(`    Has athlete.splits: YES`);
          
          // If we found stats, show sample structure
          if (data.statistics || data.splits || data.stats || data.athlete?.statistics) {
            console.log(`    ✅ WORKING ENDPOINT FOUND!`);
            console.log(`    Sample data structure:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
            break; // Found working endpoint for this player
          }
        }
      } catch (error) {
        console.log(`    Error: ${error.message}`);
      }
    }
  }
}

testNFLEndpoints().catch(console.error);