// Check for recent completed MLB playoff games in September/October 2025
const { spawn } = require('child_process');

async function checkRecentPlayoffGames() {
  console.log(`🏆 MLB Recent Playoff Games Check`);
  console.log(`📅 Searching September-October 2025 for completed games\n`);
  
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
        
        if (response.result && response.id >= 2) {
          const periods = [
            'Late September 2025',
            'Early October 2025', 
            'Mid October 2025'
          ];
          const periodIndex = response.id - 2;
          const period = periods[periodIndex];
          
          console.log(`📅 ${period}:`);
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.games && content.games.length > 0) {
              console.log(`   🎯 Found ${content.games.length} games:\n`);
              
              // Show recent completed games
              const completedGames = content.games.filter(game => 
                game.status.detailedState.includes('Final')
              );
              
              if (completedGames.length > 0) {
                completedGames.slice(0, 5).forEach((game, idx) => {
                  const awayTeam = game.teams.away.team.name;
                  const homeTeam = game.teams.home.team.name;
                  const awayScore = game.teams.away.score || 0;
                  const homeScore = game.teams.home.score || 0;
                  const gameDate = new Date(game.gameDate).toLocaleDateString();
                  
                  console.log(`   ${idx + 1}. ${gameDate}: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
                  console.log(`      📍 ${game.venue.name}`);
                  
                  // Determine winner
                  const winner = awayScore > homeScore ? awayTeam : homeTeam;
                  console.log(`      🏆 Winner: ${winner}`);
                  
                  // Show game type
                  if (game.gameType && game.gameType !== 'R') {
                    const gameTypes = {
                      'P': 'Playoff',
                      'D': 'Division Series',
                      'L': 'League Championship',
                      'W': 'World Series'
                    };
                    console.log(`      🎖️  ${gameTypes[game.gameType] || 'Special Game'}`);
                  }
                  console.log('');
                });
              } else {
                console.log(`   📋 All ${content.games.length} games still in progress or scheduled\n`);
              }
              
            } else {
              console.log(`   📭 No games found for this period\n`);
            }
            
          } catch (parseError) {
            console.log(`   ❌ Could not parse game data for this period\n`);
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
        name: "playoff-games-checker",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Check different periods
  const dateRanges = [
    { start: "2025-09-25", end: "2025-09-30" }, // Late September
    { start: "2025-10-01", end: "2025-10-07" }, // Early October  
    { start: "2025-10-08", end: "2025-10-11" }  // Mid October
  ];
  
  setTimeout(() => {
    dateRanges.forEach((range, index) => {
      setTimeout(() => {
        const scheduleRequest = {
          jsonrpc: "2.0",
          id: requestId++,
          method: "tools/call",
          params: {
            name: "get-schedule",
            arguments: {
              startDate: range.start,
              endDate: range.end,
              sportId: 1
            }
          }
        };
        
        server.stdin.write(JSON.stringify(scheduleRequest) + '\n');
      }, index * 2000);
    });
  }, 1000);
  
  // Close after processing
  setTimeout(() => {
    console.log('=' .repeat(60));
    console.log('🏆 MLB Playoff Status Summary');
    console.log('=' .repeat(60));
    console.log('📅 Current Date: October 11, 2025');
    console.log('🎯 Status: Likely between playoff series or off-season');
    console.log('📊 Schedule Pattern: Playoff games are not daily like regular season');
    console.log('⏰ Next Games: Check specific playoff schedule announcements');
    console.log('=' .repeat(60));
    
    server.kill();
  }, 8000);
}

checkRecentPlayoffGames().catch(console.error);