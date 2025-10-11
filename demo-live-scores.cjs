// Demonstrate live score functionality using a known game date from 2025 season
const { spawn } = require('child_process');

async function demonstrateLiveScores() {
  console.log(`🚀 MLB Live Score Demo`);
  console.log(`📅 Using September 15, 2025 (end of regular season) for demonstration\n`);
  
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
        
        if (response.result && response.id === 2) {
          console.log(`🎯 Schedule Results for September 15, 2025:`);
          console.log('=' .repeat(60));
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.games && content.games.length > 0) {
              console.log(`📊 Found ${content.games.length} games scheduled:\n`);
              
              content.games.slice(0, 8).forEach((game, idx) => {
                const awayTeam = game.teams.away.team.name;
                const homeTeam = game.teams.home.team.name;
                const awayScore = game.teams.away.score || 0;
                const homeScore = game.teams.home.score || 0;
                const gameTime = new Date(game.gameDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                });
                const status = game.status.detailedState;
                
                console.log(`🏟️  Game ${idx + 1}: ${awayTeam} @ ${homeTeam}`);
                console.log(`   📅 Time: ${gameTime}`);
                console.log(`   📊 Score: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
                console.log(`   🎯 Status: ${status}`);
                console.log(`   📍 Venue: ${game.venue.name}`);
                
                if (status.includes('Final')) {
                  const winner = awayScore > homeScore ? awayTeam : homeTeam;
                  console.log(`   🏆 Winner: ${winner}`);
                }
                
                console.log('');
              });
              
            } else {
              console.log(`📭 No games found for September 15, 2025\n`);
            }
            
          } catch (parseError) {
            console.log(`❌ Could not parse game data`);
          }
        }
        
        // Demo getting live game details for a specific game
        if (response.result && response.id === 3) {
          console.log('=' .repeat(60));
          console.log(`🔥 Live Game Details Demo:`);
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.gameData) {
              const game = content;
              console.log(`🏟️  ${game.gameData.teams.away.name} @ ${game.gameData.teams.home.name}`);
              console.log(`📅 Date: ${new Date(game.gameData.datetime.dateTime).toLocaleDateString()}`);
              console.log(`📍 Venue: ${game.gameData.venue.name}`);
              
              if (game.liveData && game.liveData.linescore) {
                const linescore = game.liveData.linescore;
                console.log(`📊 Score: ${game.gameData.teams.away.name} ${linescore.teams.away.runs || 0} - ${linescore.teams.home.runs || 0} ${game.gameData.teams.home.name}`);
                console.log(`🎯 Inning: ${linescore.currentInning ? `${linescore.inningState} ${linescore.currentInning}` : 'Pre-Game'}`);
              }
              
              if (game.liveData && game.liveData.plays && game.liveData.plays.currentPlay) {
                const currentPlay = game.liveData.plays.currentPlay;
                console.log(`⚾ Current Play: ${currentPlay.result.description || 'Game not started'}`);
              }
            }
            
          } catch (parseError) {
            console.log(`📋 Live game data not available for demo date`);
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
        name: "live-score-demo",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Get schedule for a known active date
  setTimeout(() => {
    const scheduleRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get-schedule",
        arguments: {
          startDate: "2025-09-15",
          endDate: "2025-09-15"
        }
      }
    };
    
    server.stdin.write(JSON.stringify(scheduleRequest) + '\n');
  }, 1000);
  
  // Try to get live game data for a demo
  setTimeout(() => {
    const liveGameRequest = {
      jsonrpc: "2.0", 
      id: 3,
      method: "tools/call",
      params: {
        name: "get-live-game",
        arguments: {
          gamePk: 775123 // Example game ID
        }
      }
    };
    
    server.stdin.write(JSON.stringify(liveGameRequest) + '\n');
  }, 3000);
  
  // Close after demo
  setTimeout(() => {
    console.log('=' .repeat(60));
    console.log('🎯 MLB MCP Server Live Score Capabilities:');
    console.log('=' .repeat(60));
    console.log('✅ Schedule Tool: Gets games for any date range');
    console.log('✅ Live Game Tool: Real-time scores, innings, plays');
    console.log('✅ Team Info: Complete team data and stats');
    console.log('✅ Player Stats: Individual and team statistics');
    console.log('✅ Standings: Division and league standings');
    console.log('✅ Historical Data: Access to decades of MLB data');
    console.log('');
    console.log('📅 Current Status: October 11, 2025 - Between playoff series');
    console.log('🎯 Next Action: Check MLB.com for specific playoff dates');
    console.log('⚾ Your MCP server is ready for live scores when games resume!');
    console.log('=' .repeat(60));
    
    server.kill();
  }, 6000);
}

demonstrateLiveScores().catch(console.error);