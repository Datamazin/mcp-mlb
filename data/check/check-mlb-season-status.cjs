// Check current MLB season status and recent playoff/World Series games
const { spawn } = require('child_process');

async function checkMLBSeasonStatus() {
  console.log(`⚾ MLB Season Status Check - October 11, 2025\n`);
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let requestId = 2;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result) {
          if (response.id === 2) {
            // Current standings response
            console.log('📊 Current MLB Standings:');
            try {
              const content = JSON.parse(response.result.content[0].text);
              if (content.standings && content.standings.length > 0) {
                content.standings.slice(0, 10).forEach((team, idx) => {
                  console.log(`   ${idx + 1}. ${team.team} (${team.wins}-${team.losses}) - ${team.division}`);
                });
              }
            } catch (e) {
              console.log('   ❌ Could not parse standings data');
            }
            console.log('');
            
          } else if (response.id === 3) {
            // Recent games from early October (playoff time)
            console.log('🏆 Recent MLB Games (Early October 2025):');
            try {
              const content = JSON.parse(response.result.content[0].text);
              if (content.games && content.games.length > 0) {
                content.games.slice(0, 8).forEach((game, idx) => {
                  const awayTeam = game.teams.away.team.name;
                  const homeTeam = game.teams.home.team.name;
                  const status = game.status.detailedState;
                  const date = new Date(game.gameDate).toLocaleDateString();
                  
                  console.log(`   ${idx + 1}. ${date}: ${awayTeam} @ ${homeTeam}`);
                  console.log(`      Status: ${status}`);
                  
                  if (game.teams.away.score !== undefined) {
                    const awayScore = game.teams.away.score || 0;
                    const homeScore = game.teams.home.score || 0;
                    console.log(`      Score: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
                  }
                  console.log('');
                });
              } else {
                console.log('   📭 No recent games found');
              }
            } catch (e) {
              console.log('   ❌ Could not parse recent games');
            }
            
          } else if (response.id === 4) {
            // League leaders (shows if season is active)
            console.log('🏆 2025 Season Leaders (if available):');
            try {
              const content = JSON.parse(response.result.content[0].text);
              if (content.categories && content.categories.length > 0) {
                content.categories.forEach(category => {
                  console.log(`   ${category.leaderCategory}:`);
                  category.leaders.slice(0, 3).forEach((leader, idx) => {
                    console.log(`     ${idx + 1}. ${leader.person.fullName} (${leader.team?.name || 'Unknown'}) - ${leader.value}`);
                  });
                });
              }
            } catch (e) {
              console.log('   ❌ Could not get current season leaders');
            }
          }
        }
        
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Making request to:') && !message.includes('MLB MCP Server running')) {
      console.error(`❌ Error: ${message}`);
    }
  });
  
  // Initialize MCP server
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mlb-season-status",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Send requests to check season status
  setTimeout(() => {
    // 1. Get current standings
    const standingsRequest = {
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/call",
      params: {
        name: "get-standings",
        arguments: {
          season: 2025
        }
      }
    };
    server.stdin.write(JSON.stringify(standingsRequest) + '\n');
  }, 1000);
  
  setTimeout(() => {
    // 2. Check for recent October games (playoff time)
    const recentGamesRequest = {
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/call",
      params: {
        name: "get-schedule",
        arguments: {
          startDate: "2025-10-01",
          endDate: "2025-10-10",
          sportId: 1
        }
      }
    };
    server.stdin.write(JSON.stringify(recentGamesRequest) + '\n');
  }, 2500);
  
  setTimeout(() => {
    // 3. Get current season leaders
    const leadersRequest = {
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/call",
      params: {
        name: "get-league-leaders",
        arguments: {
          leaderCategories: "homeRuns",
          season: 2025,
          limit: 3
        }
      }
    };
    server.stdin.write(JSON.stringify(leadersRequest) + '\n');
  }, 4000);
  
  // Close after processing
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MLB Season Status Summary:');
    console.log('='.repeat(60));
    console.log('🗓️  Current Date: October 11, 2025');
    console.log('⚾ Expected Status: MLB Postseason or Off-Season');
    console.log('🏆 Playoff Period: October (Division Series, Championship Series)');
    console.log('🌟 World Series: Late October/Early November');
    console.log('❄️  Off-Season: After World Series until Spring Training');
    console.log('🌸 Spring Training: February-March 2026');
    console.log('🎯 2026 Season Start: Late March/April 2026');
    console.log('='.repeat(60));
    
    server.kill();
  }, 7000);
}

checkMLBSeasonStatus().catch(console.error);