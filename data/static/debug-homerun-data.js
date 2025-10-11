// Debug script to examine home run data structure
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function debugHomeRunData() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'debug-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('🔌 Connected to MLB MCP Server');

    // Get raw game logs first
    console.log('\n📋 Getting Pete Alonso game logs...');
    
    const gameLogsResult = await client.callTool({
      name: 'get-player-game-logs',
      arguments: {
        playerId: 624413,
        season: 2024,
        gameType: 'R'
      }
    });

    const gameLogsData = gameLogsResult.content[0];
    if (gameLogsData.type === 'text') {
      const gameLogsResponse = JSON.parse(gameLogsData.text);
      const gameLogs = gameLogsResponse.gameLogs;
      
      console.log(`📊 Total games found: ${gameLogs.length}`);
      
      // Look for games with home runs
      let homeRunGames = 0;
      let totalHomeRuns = 0;
      
      console.log('\n🏠 Games with Home Runs:');
      gameLogs.forEach((game, index) => {
        if (game.stat && game.stat.homeRuns > 0) {
          homeRunGames++;
          totalHomeRuns += game.stat.homeRuns;
          console.log(`  Game ${index + 1} (${game.date}): ${game.stat.homeRuns} HR vs ${game.opponent}`);
          
          if (homeRunGames <= 10) { // Show first 10 games with HRs
            console.log(`    Full stats: AB:${game.stat.atBats} H:${game.stat.hits} R:${game.stat.runs} RBI:${game.stat.rbi}`);
          }
        }
      });
      
      console.log(`\n📈 Summary:`);
      console.log(`  Games with Home Runs: ${homeRunGames}`);
      console.log(`  Total Home Runs: ${totalHomeRuns}`);
      console.log(`  Average per game: ${(totalHomeRuns / gameLogs.length).toFixed(3)}`);
      
      // Show first 10 games regardless of home runs
      console.log(`\n📋 First 10 games (all stats):`);
      for (let i = 0; i < Math.min(10, gameLogs.length); i++) {
        const game = gameLogs[i];
        if (game.stat) {
          console.log(`  Game ${i + 1}: HR:${game.stat.homeRuns} AB:${game.stat.atBats} H:${game.stat.hits}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

console.log('🔍 Debugging Pete Alonso Home Run Data...\n');
debugHomeRunData().catch(console.error);