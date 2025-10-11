// Test historical data availability for 1985 Mets
const https = require('https');

async function test1985Data() {
  console.log('🕰️ Testing MLB API historical data availability for 1985...');
  
  // Try to search for players from the 1985 season
  const searchUrl = 'https://statsapi.mlb.com/api/v1/teams/121?season=1985&hydrate=roster';
  
  console.log('🔍 Attempting to get 1985 Mets roster...');
  
  https.get(searchUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('📋 API Response structure:');
        console.log('Keys available:', Object.keys(json));
        
        if (json.teams && json.teams[0]) {
          const team = json.teams[0];
          console.log(`Team: ${team.name}`);
          console.log(`Season: ${team.season}`);
          
          if (team.roster) {
            console.log(`✅ Found ${team.roster.length} players on 1985 roster`);
            team.roster.slice(0, 5).forEach(player => {
              console.log(`  - ${player.person.fullName} (${player.position.name})`);
            });
          } else {
            console.log('❌ No roster data in response');
          }
        } else {
          console.log('❌ No team data found for 1985');
          console.log('Response sample:', JSON.stringify(json, null, 2).substring(0, 500));
        }
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response sample:', data.substring(0, 200));
      }
    });
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

// Also test if we can get team schedule for 1985 to see what historical data is available
async function test1985Schedule() {
  console.log('\n🗓️ Testing 1985 schedule data...');
  
  const scheduleUrl = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=1985&teamId=121&gameType=R&startDate=1985-04-01&endDate=1985-04-30';
  
  https.get(scheduleUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        
        if (json.dates && json.dates.length > 0) {
          console.log(`✅ Found 1985 schedule data: ${json.dates.length} dates`);
          const firstGame = json.dates[0].games[0];
          if (firstGame) {
            console.log(`   Sample game: ${firstGame.teams.away.team.name} @ ${firstGame.teams.home.team.name}`);
            console.log(`   Date: ${firstGame.gameDate}`);
          }
        } else {
          console.log('❌ No 1985 schedule data found');
        }
      } catch (error) {
        console.error('❌ Error parsing schedule:', error.message);
      }
    });
  }).on('error', (error) => {
    console.error('❌ Schedule request error:', error.message);
  });
}

console.log('🚀 Starting 1985 Mets historical data test...');
test1985Data();

setTimeout(() => {
  test1985Schedule();
}, 2000);