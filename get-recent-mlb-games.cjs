// Get recent MLB games and live scores with broader date range
const { spawn } = require('child_process');

async function getRecentMLBGames() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];  
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`⚾ MLB Games & Live Scores Report`);
  console.log(`📅 Checking: ${yesterdayStr} to ${tomorrowStr}\n`);
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let requestCount = 2;
  const dateRequests = [
    { date: yesterdayStr, label: 'Yesterday' },
    { date: todayStr, label: 'Today' },
    { date: tomorrowStr, label: 'Tomorrow' }
  ];
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id >= 2) {
          const requestIndex = response.id - 2;
          const dateInfo = dateRequests[requestIndex];
          
          if (!dateInfo) return;
          
          console.log(`📅 ${dateInfo.label} (${dateInfo.date}):`);
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.games && content.games.length > 0) {
              console.log(`   🎯 ${content.games.length} games found:\n`);
              
              content.games.forEach((game, idx) => {
                const awayTeam = game.teams.away.team.name;
                const homeTeam = game.teams.home.team.name;
                const status = game.status.detailedState;
                const gameTime = new Date(game.gameDate).toLocaleTimeString();
                
                console.log(`   ${idx + 1}. ${awayTeam} @ ${homeTeam}`);
                console.log(`      Status: ${status}`);
                console.log(`      Time: ${gameTime}`);
                console.log(`      Venue: ${game.venue.name}`);
                
                // Show scores for completed or in-progress games
                if (game.teams.away.score !== undefined || game.teams.home.score !== undefined) {
                  const awayScore = game.teams.away.score || 0;
                  const homeScore = game.teams.home.score || 0;
                  console.log(`      Score: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
                  
                  if (status.includes('Final')) {
                    const winner = awayScore > homeScore ? awayTeam : homeTeam;
                    console.log(`      Winner: ${winner} ⭐`);
                  }
                }
                
                // Indicate if game is live
                if (status.includes('In Progress') || status.includes('Live')) {
                  console.log(`      🔴 LIVE GAME!`);
                }
                
                console.log('');
              });
            } else {
              console.log(`   📭 No games scheduled\n`);
            }
            
          } catch (parseError) {
            console.log(`   ❌ Error parsing game data\n`);
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
        name: "mlb-games-report",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Send requests for each date
  setTimeout(() => {
    dateRequests.forEach((dateRequest, index) => {
      setTimeout(() => {
        const scheduleRequest = {
          jsonrpc: "2.0",
          id: requestCount++,
          method: "tools/call",
          params: {
            name: "get-schedule",
            arguments: {
              startDate: dateRequest.date,
              endDate: dateRequest.date,
              sportId: 1
            }
          }
        };
        
        server.stdin.write(JSON.stringify(scheduleRequest) + '\n');
      }, index * 1500);
    });
  }, 1000);
  
  // Close after processing all requests
  setTimeout(() => {
    console.log('=' .repeat(60));
    console.log('📊 MLB Games Report Complete');
    console.log(`🕐 Generated: ${today.toLocaleString()}`);
    console.log('=' .repeat(60));
    
    // Provide context about the current date
    const month = today.getMonth() + 1; // 0-indexed
    if (month >= 10 && month <= 12) {
      console.log('\n📋 NOTE: October-December is typically MLB playoff season');
      console.log('   - Regular season ends in late September');
      console.log('   - Playoff games are scheduled on specific dates');
      console.log('   - Off-season begins after World Series');
    } else if (month >= 1 && month <= 2) {
      console.log('\n📋 NOTE: January-February is MLB off-season');
      console.log('   - Spring Training starts in February/March');
      console.log('   - Regular season begins in late March/April');
    }
    
    server.kill();
  }, 8000);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 MLB games report stopped by user');
  process.exit(0);
});

getRecentMLBGames().catch(console.error);