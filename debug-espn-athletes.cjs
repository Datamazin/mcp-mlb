/**
 * Debug ESPN Athlete API with Patrick Mahomes
 * Patrick Mahomes ID: 3139477
 * Joe Flacco ID: 11252
 */

async function debugAthleteAPI() {
  // Patrick Mahomes ID from ESPN
  const mahomesId = 3139477;
  const flaccoId = 11252;
  
  console.log('\n🔍 Testing ESPN Athlete API\n');
  
  // Test overview endpoint
  console.log('=== Testing Overview Endpoint ===');
  const overviewUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${mahomesId}/overview`;
  console.log(`URL: ${overviewUrl}\n`);
  
  try {
    const response = await fetch(overviewUrl);
    const data = await response.json();
    
    console.log('Full Response Structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    console.log('\n...(truncated)...\n');
    
    console.log('\n=== Testing Joe Flacco ===');
    const flaccoUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${flaccoId}/overview`;
    const flaccoResponse = await fetch(flaccoUrl);
    const flaccoData = await flaccoResponse.json();
    
    console.log(`Name: ${flaccoData.athlete?.displayName}`);
    console.log(`Position: ${flaccoData.athlete?.position?.name}`);
    console.log(`Team: ${flaccoData.athlete?.team?.displayName}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAthleteAPI();
