// Get today's MLB games and live scores using the MCP server
const { spawn } = require('child_process');

async function getTodaysLiveScores() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  console.log(`⚾ Getting MLB Live Scores for ${dateStr} (${today.toDateString()})...\n`);
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let gamesFound = [];
  let currentRequestId = 2;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id === 2) {
          // Schedule response
          const content = JSON.parse(response.result.content[0].text);
          if (content.games && content.games.length > 0) {
            console.log(`🎯 Found ${content.games.length} games today:`);
            gamesFound = content.games;
            
            content.games.forEach((game, idx) => {
              console.log(`\n${idx + 1}. ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
              console.log(`   Status: ${game.status.detailedState}`);
              console.log(`   Time: ${new Date(game.gameDate).toLocaleTimeString()}`);
              console.log(`   Venue: ${game.venue.name}`);
              
              if (game.status.statusCode === 'F' || game.status.statusCode === 'I') {
                console.log(`   Score: ${game.teams.away.team.name} ${game.teams.away.score || 0} - ${game.teams.home.score || 0} ${game.teams.home.team.name}`);
              }
              
              // Get live data for in-progress games
              if (game.status.statusCode === 'I') {
                setTimeout(() => {
                  const liveRequest = {
                    jsonrpc: "2.0",
                    id: currentRequestId++,
                    method: "tools/call",
                    params: {
                      name: "get-live-game",
                      arguments: {
                        gamePk: game.gamePk
                      }
                    }
                  };
                  console.log(`🔴 Getting live data for ${game.teams.away.team.name} @ ${game.teams.home.team.name}...`);
                  server.stdin.write(JSON.stringify(liveRequest) + '\n');
                }, (idx + 1) * 1000);
              }
            });
            
            if (content.games.length === 0) {
              console.log('📅 No MLB games scheduled for today.');
              console.log('   This could mean:');
              console.log('   - It\'s an off-day for MLB');
              console.log('   - Games haven\'t been scheduled yet');
              console.log('   - It\'s the off-season');
            }
          } else {
            console.log('📅 No MLB games found for today.');
          }
        } else if (response.result && response.id > 2) {
          // Live game response
          const content = JSON.parse(response.result.content[0].text);
          if (content.gameData) {
            console.log(`\n🔴 LIVE: ${content.gameData.teams.away.name} @ ${content.gameData.teams.home.name}`);
            console.log(`   Current Score: ${content.liveData?.linescore?.teams?.away?.runs || 0} - ${content.liveData?.linescore?.teams?.home?.runs || 0}`);
            console.log(`   Inning: ${content.liveData?.linescore?.currentInning || '?'} ${content.liveData?.linescore?.inningState || ''}`);
            
            if (content.liveData?.plays?.currentPlay) {
              console.log(`   Current Play: ${content.liveData.plays.currentPlay.result?.description || 'In progress'}`);
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
        name: "live-scores-client",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Get today's schedule
  setTimeout(() => {
    const scheduleRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get-schedule",
        arguments: {
          startDate: dateStr,
          endDate: dateStr,
          sportId: 1
        }
      }
    };
    
    server.stdin.write(JSON.stringify(scheduleRequest) + '\n');
  }, 1000);
  
  // Close after processing
  setTimeout(() => {
    console.log('\n📊 Live scores update complete!');
    console.log(`📅 Date: ${today.toDateString()}`);
    console.log(`🕐 Updated: ${today.toLocaleTimeString()}`);
    server.kill();
  }, 8000);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Live scores stopped by user');
  process.exit(0);
});

getTodaysLiveScores().catch(console.error);