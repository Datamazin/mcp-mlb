// Simple test to verify game log data structure
const https = require('https');

async function testGameLogStructure() {
  console.log('🔍 Testing MLB API game log structure...');
  
  const url = 'https://statsapi.mlb.com/api/v1/people/624413/stats?stats=gameLog&season=2024&gameType=R';
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.stats && json.stats[0] && json.stats[0].splits) {
            const gameLogs = json.stats[0].splits;
            console.log(`📊 Found ${gameLogs.length} games`);
            
            // Check first few games for home runs
            let homeRunGames = 0;
            let totalHomeRuns = 0;
            
            for (let i = 0; i < Math.min(10, gameLogs.length); i++) {
              const game = gameLogs[i];
              console.log(`Game ${i + 1} (${game.date}):`);
              console.log(`  - Has 'stats' property: ${!!game.stats}`);  
              console.log(`  - Has 'stat' property: ${!!game.stat}`);
              
              if (game.stat) {
                const hrs = game.stat.homeRuns || 0;
                console.log(`  - Home runs: ${hrs}`);
                if (hrs > 0) {
                  homeRunGames++;
                  totalHomeRuns += hrs;
                }
              }
            }
            
            // Check entire season for home runs
            let seasonHomeRuns = 0;
            let gamesWithHomeRuns = 0;
            
            gameLogs.forEach(game => {
              if (game.stat && game.stat.homeRuns > 0) {
                gamesWithHomeRuns++;
                seasonHomeRuns += game.stat.homeRuns;
              }
            });
            
            console.log(`\n📈 Season Summary:`);
            console.log(`  - Games with home runs: ${gamesWithHomeRuns}`);
            console.log(`  - Total home runs: ${seasonHomeRuns}`);
            
            resolve({ gamesWithHomeRuns, seasonHomeRuns });
          } else {
            reject(new Error('Unexpected data structure'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

testGameLogStructure()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log(`Result: ${result.gamesWithHomeRuns} games with ${result.seasonHomeRuns} total home runs`);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });