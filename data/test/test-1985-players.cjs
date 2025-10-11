// Search for known 1985 Mets players to see if historical player data exists
const https = require('https');

const famous1985Mets = [
  'Gary Carter',
  'Keith Hernandez', 
  'Darryl Strawberry',
  'Dwight Gooden',
  'Mookie Wilson',
  'Howard Johnson',
  'Ron Darling'
];

async function searchPlayer(playerName) {
  return new Promise((resolve, reject) => {
    const searchUrl = `https://statsapi.mlb.com/api/v1/sports/1/players?search=${encodeURIComponent(playerName)}`;
    
    https.get(searchUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ playerName, data: json });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function checkHistoricalPlayers() {
  console.log('🔍 Searching for famous 1985 Mets players...\n');
  
  for (const playerName of famous1985Mets) {
    try {
      const result = await searchPlayer(playerName);
      
      if (result.data.people && result.data.people.length > 0) {
        const player = result.data.people[0];
        console.log(`✅ Found ${playerName}:`);
        console.log(`   ID: ${player.id}`);
        console.log(`   Full Name: ${player.fullName}`);
        console.log(`   MLB Debut: ${player.mlbDebutDate || 'Unknown'}`);
        console.log(`   Active: ${player.active}`);
        
        // Try to get their 1985 stats
        const statsUrl = `https://statsapi.mlb.com/api/v1/people/${player.id}/stats?stats=season&season=1985`;
        
        https.get(statsUrl, (res) => {
          let statsData = '';
          res.on('data', (chunk) => statsData += chunk);
          res.on('end', () => {
            try {
              const statsJson = JSON.parse(statsData);
              if (statsJson.stats && statsJson.stats[0] && statsJson.stats[0].splits && statsJson.stats[0].splits.length > 0) {
                const stats1985 = statsJson.stats[0].splits[0];
                console.log(`   📊 1985 Stats: Found data for ${stats1985.team.name}`);
              } else {
                console.log(`   📊 1985 Stats: No data found`);
              }
            } catch (e) {
              console.log(`   📊 1985 Stats: Error parsing`);
            }
          });
        });
        
      } else {
        console.log(`❌ ${playerName}: Not found in current API`);
      }
      console.log('');
      
      // Wait between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Error searching for ${playerName}:`, error.message);
    }
  }
}

checkHistoricalPlayers();