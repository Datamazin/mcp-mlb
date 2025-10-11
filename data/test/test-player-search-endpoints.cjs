// Test different player search endpoints to find the right one
const https = require('https');

async function testPlayerSearch() {
  console.log('🔍 Testing MLB API player search endpoints...\n');
  
  const testEndpoints = [
    '/sports/1/players?search=judge',
    '/people?search=judge', 
    '/people?searchTerm=judge',
    '/people?name=judge'
  ];
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing: https://statsapi.mlb.com/api/v1${endpoint}`);
    
    try {
      const data = await makeRequest(endpoint);
      
      if (data.people && data.people.length > 0) {
        console.log(`✅ SUCCESS! Found ${data.people.length} players`);
        data.people.slice(0, 3).forEach((player, idx) => {
          console.log(`  ${idx + 1}. ${player.fullName} (ID: ${player.id}) - ${player.primaryPosition?.name || 'Unknown'}`);
        });
      } else {
        console.log(`❌ No results or wrong structure`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://statsapi.mlb.com/api/v1${endpoint}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

testPlayerSearch().catch(console.error);