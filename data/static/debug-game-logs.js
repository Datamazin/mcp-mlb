// Debug game logs response structure
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function debugGameLogs() {
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

    const gameLogsResult = await client.callTool({
      name: 'get-player-game-logs',
      arguments: {
        playerId: 624413, // Pete Alonso
        season: 2024,
        gameType: 'R'
      }
    });

    const gameLogsData = gameLogsResult.content[0];
    if (gameLogsData.type === 'text') {
      const response = JSON.parse(gameLogsData.text);
      console.log('📋 Raw Game Logs Response Structure:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.gameLogs && response.gameLogs.length > 0) {
        console.log('\n📊 First Game Log Entry:');
        console.log(JSON.stringify(response.gameLogs[0], null, 2));
      }
    }

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugGameLogs().catch(console.error);