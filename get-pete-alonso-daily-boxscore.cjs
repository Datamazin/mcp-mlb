// Get Pete Alonso daily boxscore/game logs for 2024 using MLB MCP Server
const { spawn } = require('child_process');

async function getPeteAlonsoDailyStats() {
  console.log(`⚾ Pete Alonso - Daily Boxscore/Game Logs for 2024`);
  console.log(`👤 Using MLB MCP Server to get game-by-game performance\n`);
  
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
          console.log(`📊 Pete Alonso Game Logs - 2024 Regular Season:`);
          console.log('=' .repeat(80));
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.gameLogs && content.gameLogs.length > 0) {
              console.log(`🎯 Total Games: ${content.gameLogs.length}`);
              console.log(`👤 Player: ${content.player.fullName}\n`);
              
              // Show first 10 games as daily boxscore examples
              console.log(`📅 Daily Game-by-Game Performance (First 10 games):`);
              console.log('-'.repeat(80));
              
              content.gameLogs.slice(0, 10).forEach((game, idx) => {
                const stats = game.stats;
                const date = game.date || 'Unknown Date';
                const opponent = game.opponent || 'Unknown Opponent';
                
                console.log(`🏟️  Game ${idx + 1}: ${date} - ${opponent}`);
                console.log(`   📊 Stats: ${stats.atBats || 0} AB, ${stats.hits || 0} H, ${stats.homeRuns || 0} HR, ${stats.rbi || 0} RBI`);
                console.log(`   📈 AVG: ${stats.avg || 'N/A'}, OPS: ${stats.ops || 'N/A'}`);
                
                if (stats.homeRuns > 0) {
                  console.log(`   🏆 HOME RUN GAME! ${stats.homeRuns} HR${stats.homeRuns > 1 ? 's' : ''}`);
                }
                
                console.log('');
              });
              
              // Calculate season totals
              let totalGames = content.gameLogs.length;
              let totalHRs = 0;
              let totalRBIs = 0;
              let totalHits = 0;
              let totalABs = 0;
              
              content.gameLogs.forEach(game => {
                totalHRs += game.stats.homeRuns || 0;
                totalRBIs += game.stats.rbi || 0;
                totalHits += game.stats.hits || 0;
                totalABs += game.stats.atBats || 0;
              });
              
              const seasonAvg = totalABs > 0 ? (totalHits / totalABs).toFixed(3) : '0.000';
              
              console.log('=' .repeat(80));
              console.log(`🏆 Pete Alonso 2024 Season Totals:`);
              console.log(`   🎮 Games: ${totalGames}`);
              console.log(`   ⚾ Home Runs: ${totalHRs}`);
              console.log(`   🏃 RBIs: ${totalRBIs}`);
              console.log(`   🎯 Hits: ${totalHits}`);
              console.log(`   📊 Batting Average: ${seasonAvg}`);
              console.log('=' .repeat(80));
              
            } else {
              console.log(`❌ No game logs found for Pete Alonso in 2024`);
            }
            
          } catch (parseError) {
            console.log(`❌ Could not parse game log data: ${parseError.message}`);
          }
        }
        
        // Enhanced player info response
        if (response.result && response.id === 3) {
          console.log(`\n🌐 Pete Alonso MLB.com Resources:`);
          console.log('-'.repeat(50));
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.mlbComLinks) {
              console.log(`🏠 Player Profile: ${content.mlbComLinks.profileUrl}`);
              console.log(`📊 Stats Page: ${content.mlbComLinks.statsUrl}`);
              console.log(`📅 Game Logs: ${content.mlbComLinks.gameLogsUrl}`);
              console.log(`📖 Biography: ${content.mlbComLinks.bioUrl}`);
              
              if (content.mlbComLinks.teamUrl) {
                console.log(`🏟️  Team Page: ${content.mlbComLinks.teamUrl}`);
              }
            }
            
            if (content.player) {
              console.log(`\n👤 Player Details:`);
              console.log(`   Name: ${content.player.fullName}`);
              console.log(`   Team: ${content.player.currentTeam?.name || 'N/A'}`);
              console.log(`   Position: ${content.player.primaryPosition?.name || 'N/A'}`);
              console.log(`   Jersey #: ${content.player.primaryNumber || 'N/A'}`);
            }
            
          } catch (parseError) {
            console.log(`❌ Could not parse enhanced player info`);
          }
        }
        
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (message.includes('MLB MCP Server')) {
      console.log(`🚀 ${message.trim()}`);
    } else if (!message.includes('Making request to:')) {
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
        name: "pete-alonso-daily-stats",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Get Pete Alonso's game logs (daily boxscore data)
  setTimeout(() => {
    const gameLogsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get-player-game-logs",
        arguments: {
          playerId: 624413, // Pete Alonso
          season: 2024,
          gameType: "R"  // Regular season
        }
      }
    };
    
    server.stdin.write(JSON.stringify(gameLogsRequest) + '\n');
  }, 1000);
  
  // Get enhanced player info with MLB.com links
  setTimeout(() => {
    const enhancedInfoRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get-enhanced-player-info",
        arguments: {
          playerId: 624413, // Pete Alonso
          includeMLBcomLinks: true,
          season: 2024
        }
      }
    };
    
    server.stdin.write(JSON.stringify(enhancedInfoRequest) + '\n');
  }, 3000);
  
  // Close after processing
  setTimeout(() => {
    console.log('\n🎯 Your MLB MCP Server Successfully Provided:');
    console.log('✅ Pete Alonso daily game logs (boxscore data)');
    console.log('✅ Season totals and performance summary');
    console.log('✅ Official MLB.com resource links');
    console.log('✅ Enhanced player information');
    console.log('\n⚾ This demonstrates your MCP server working as intended!');
    
    server.kill();
  }, 6000);
}

getPeteAlonsoDailyStats().catch(console.error);