// Get team players - dynamic team selection
const https = require('https');

// MLB Team IDs mapping
const MLB_TEAMS = {
  // American League East
  'orioles': 110, 'red sox': 111, 'yankees': 147, 'rays': 139, 'blue jays': 142,
  // American League Central  
  'white sox': 145, 'guardians': 114, 'tigers': 116, 'royals': 118, 'twins': 142,
  // American League West
  'astros': 117, 'angels': 108, 'athletics': 133, 'mariners': 136, 'rangers': 140,
  // National League East
  'braves': 144, 'marlins': 146, 'mets': 121, 'phillies': 143, 'nationals': 120,
  // National League Central
  'cubs': 112, 'reds': 113, 'brewers': 158, 'pirates': 134, 'cardinals': 138,
  // National League West
  'diamondbacks': 109, 'rockies': 115, 'dodgers': 119, 'padres': 135, 'giants': 137
};

async function getTeamPlayers(teamName = 'mets', season = 2025) {
  // Normalize team name
  const normalizedTeam = teamName.toLowerCase().trim();
  const teamId = MLB_TEAMS[normalizedTeam];
  
  if (!teamId) {
    console.error(`❌ Team "${teamName}" not found. Available teams:`);
    Object.keys(MLB_TEAMS).forEach(team => console.log(`  - ${team}`));
    return;
  }
  
  // Get team name for display
  const displayName = teamName.charAt(0).toUpperCase() + teamName.slice(1);
  console.log(`🏟️ Getting ${displayName} roster for ${season}...`);
  
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?season=${season}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const players = json.roster || [];
        
        if (players.length === 0) {
          console.log(`⚠️  No roster data found for ${displayName} in ${season}`);
          console.log(`   This could mean:`);
          console.log(`   - Historical roster data is not available for ${season}`);
          console.log(`   - The team didn't exist in ${season}`);
          console.log(`   - The API doesn't support historical roster data`);
          return;
        }
        
        console.log(`📋 Found ${players.length} players on ${displayName} roster for ${season}`);
        
        // Filter for position players (likely to hit home runs)
        const hitters = players.filter(p => 
          p.position && 
          !['P'].includes(p.position.abbreviation)
        );
        
        console.log(`⚾ Position players (potential home run hitters): ${hitters.length}`);
        console.log(`\n🏏 Top ${displayName} position players:`);
        
        hitters.slice(0, 15).forEach(player => {
          console.log(`  - ${player.person.fullName} (#${player.jerseyNumber || 'N/A'}) - ${player.position.name} (ID: ${player.person.id})`);
        });
        
        // Save player IDs for home run analysis
        const playerIds = hitters.map(p => ({
          id: p.person.id,
          name: p.person.fullName,
          position: p.position.name
        }));
        
        console.log(`\n📊 ${displayName} Player IDs for analysis:`);
        console.log(JSON.stringify(playerIds.slice(0, 8), null, 2));
        
        return {
          team: displayName,
          teamId: teamId,
          totalPlayers: players.length,
          positionPlayers: hitters,
          playerIds: playerIds
        };
        
      } catch (error) {
        console.error('❌ Error parsing data:', error.message);
      }
    });
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

// Main execution - get team from command line argument or default to Mets
async function main() {
  const args = process.argv.slice(2);
  const teamName = args[0] || 'mets';
  const season = args[1] ? parseInt(args[1]) : 2025;
  
  console.log(`🎯 Getting team roster data...`);
  console.log(`   Team: ${teamName}`);
  console.log(`   Season: ${season}`);
  console.log('');
  
  try {
    const result = await getTeamPlayers(teamName, season);
    
    if (result) {
      console.log(`\n✅ Successfully retrieved ${result.team} roster data!`);
      console.log(`   Total players: ${result.totalPlayers}`);
      console.log(`   Position players: ${result.positionPlayers.length}`);
    }
  } catch (error) {
    console.error('❌ Error getting team data:', error.message);
  }
}

// Usage examples:
// node get-team-players.cjs mets         (defaults to current year)
// node get-team-players.cjs yankees 2024 (Yankees 2024 roster)
// node get-team-players.cjs mets 1985    (1985 World Series Mets)
// node get-team-players.cjs dodgers 1988  (Kirk Gibson year)

main();