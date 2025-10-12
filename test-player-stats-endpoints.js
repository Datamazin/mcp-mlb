/**
 * Test Direct MLB API for Player Stats
 * 
 * This script tests different MLB API endpoints to find working player stats endpoints.
 */

async function testPlayerStatsEndpoints() {
  const peteAlonsoId = 624413;
  const baseUrl = 'https://statsapi.mlb.com/api';
  
  console.log('=== Testing MLB API Player Stats Endpoints ===\n');
  
  // Test different endpoint variations
  const endpoints = [
    `/v1/people/${peteAlonsoId}`,
    `/v1/people/${peteAlonsoId}/stats?stats=season&season=2024`,
    `/v1/people/${peteAlonsoId}/stats?stats=season&season=2023`,
    `/v1/people/${peteAlonsoId}?hydrate=stats`,
    `/v1/people/${peteAlonsoId}?hydrate=stats(season)`,
    `/v1/people/${peteAlonsoId}?hydrate=currentTeam`,
    `/people/${peteAlonsoId}`,
    `/people/${peteAlonsoId}/stats?stats=season&season=2024`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${baseUrl}${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: Status ${response.status}`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        
        if (data.people && data.people[0]) {
          const player = data.people[0];
          console.log(`   Player: ${player.fullName || 'Unknown'}`);
          if (player.stats) {
            console.log(`   Stats available: ${player.stats.length} stat groups`);
          }
        }
        console.log('');
        
        // If this is a working endpoint, show sample data
        if (endpoint.includes('stats')) {
          console.log('Sample response structure:');
          console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...\n');
          break; // Found working stats endpoint
        }
      } else {
        console.log(`❌ Failed: Status ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('=== Endpoint Testing Complete ===');
}

// Run the test
testPlayerStatsEndpoints().catch(console.error);