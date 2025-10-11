// Check Michael Conforto's actual statistics and correct any data errors
const https = require('https');

async function checkConfortoStats() {
  console.log('🔍 Investigating Michael Conforto data error...');
  
  // First, let's search for the correct Michael Conforto
  const searchUrl = 'https://statsapi.mlb.com/api/v1/sports/1/players?search=Michael%20Conforto';
  
  https.get(searchUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('🔍 Michael Conforto search results:');
        
        if (json.people && json.people.length > 0) {
          json.people.forEach(player => {
            console.log(`- ${player.fullName} (ID: ${player.id})`);
            console.log(`  Position: ${player.primaryPosition?.name || 'Unknown'}`);
            console.log(`  Current Team: ${player.currentTeam?.name || 'Unknown'}`);
            console.log(`  Active: ${player.active}`);
            console.log(`  Birth Date: ${player.birthDate}`);
          });
          
          // Use the correct ID to check 2022 stats
          const confortoId = json.people[0].id;
          checkPlayerStats(confortoId, 2022, 'Michael Conforto');
        } else {
          console.log('❌ No Michael Conforto found in MLB database');
        }
      } catch (error) {
        console.error('❌ Search error:', error.message);
      }
    });
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

function checkPlayerStats(playerId, season, playerName) {
  const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&season=${season}&gameType=R`;
  
  console.log(`\n📊 Checking ${playerName} (ID: ${playerId}) for ${season}...`);
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        
        if (json.stats && json.stats[0] && json.stats[0].splits && json.stats[0].splits[0]) {
          const stats = json.stats[0].splits[0].stat;
          const team = json.stats[0].splits[0].team;
          
          console.log(`✅ ${playerName} ${season} stats:`);
          console.log(`  Team: ${team?.name || 'Unknown'}`);
          console.log(`  Games: ${stats.gamesPlayed || 0}`);
          console.log(`  Home Runs: ${stats.homeRuns || 0}`);
          console.log(`  AVG: ${stats.avg || '.000'}`);
          console.log(`  RBI: ${stats.rbi || 0}`);
        } else {
          console.log(`⚠️ No ${season} stats found for ${playerName}`);
        }
      } catch (error) {
        console.error(`❌ Stats error for ${playerName}:`, error.message);
      }
    });
  }).on('error', (error) => {
    console.error(`❌ Request error for ${playerName}:`, error.message);
  });
}

// Also check what player ID 592450 actually corresponds to (the one I used incorrectly)
function checkMysteryPlayer() {
  const mysteryId = 592450;
  const url = `https://statsapi.mlb.com/api/v1/people/${mysteryId}`;
  
  console.log(`\n🕵️ Checking who player ID ${mysteryId} actually is...`);
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        
        if (json.people && json.people[0]) {
          const player = json.people[0];
          console.log(`🎯 Player ID ${mysteryId} is: ${player.fullName}`);
          console.log(`  Position: ${player.primaryPosition?.name || 'Unknown'}`);
          console.log(`  Current Team: ${player.currentTeam?.name || 'Unknown'}`);
          
          // Check their 2022 stats
          checkPlayerStats(mysteryId, 2022, player.fullName);
        }
      } catch (error) {
        console.error(`❌ Error checking mystery player:`, error.message);
      }
    });
  }).on('error', (error) => {
    console.error(`❌ Request error for mystery player:`, error.message);
  });
}

console.log('🚨 Investigating data error in Mets home run analysis...');
checkConfortoStats();

setTimeout(() => {
  checkMysteryPlayer();
}, 2000);