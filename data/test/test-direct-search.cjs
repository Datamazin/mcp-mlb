// Test the existing search-players tool
const https = require('https');

async function testDirectSearch() {
  console.log('🔍 Testing direct search endpoint...\n');
  
  const url = 'https://statsapi.mlb.com/api/v1/people/search?q=judge';
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('Response structure:', Object.keys(json));
        
        if (json.people && json.people.length > 0) {
          console.log(`✅ Found ${json.people.length} players:`);
          json.people.slice(0, 5).forEach((player, idx) => {
            console.log(`  ${idx + 1}. ${player.fullName} (ID: ${player.id})`);
            console.log(`     Position: ${player.primaryPosition?.name || 'Unknown'}`);
            console.log(`     Team: ${player.currentTeam?.name || 'No current team'}`);
            console.log(`     Active: ${player.active}`);
          });
        } else {
          console.log('❌ No players found or wrong structure');
          console.log('Sample response:', JSON.stringify(json, null, 2).substring(0, 500));
        }
        
      } catch (error) {
        console.error('❌ Parse error:', error.message);
        console.log('Raw response:', data.substring(0, 200));
      }
    });
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

testDirectSearch();