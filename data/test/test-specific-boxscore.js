#!/usr/bin/env node

/**
 * Test specific box score with known game PK
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSpecificBoxScore() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'boxscore-test-client',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    console.log('Connected to MLB MCP Server');

    // Test with a known game PK
    console.log('\n📊 Testing box score with known game PK 717918...');
    try {
      const boxScoreResult = await client.callTool({
        name: 'get-box-score',
        arguments: {
          gamePk: 717918
        }
      });
      
      const boxScoreData = boxScoreResult.content[0];
      if (boxScoreData.type === 'text') {
        const boxScore = JSON.parse(boxScoreData.text);
        console.log('✅ Box score retrieved successfully!');
        console.log(`   Game PK: ${boxScore.gamePk}`);
        console.log(`   Away Team: ${boxScore.teams?.away?.team?.name || 'N/A'}`);
        console.log(`   Home Team: ${boxScore.teams?.home?.team?.name || 'N/A'}`);
        
        // Check if we have player data
        if (boxScore.teams?.home?.players) {
          const homePlayers = Object.keys(boxScore.teams.home.players);
          console.log(`   Home team players: ${homePlayers.length}`);
          
          // Show a sample player
          if (homePlayers.length > 0) {
            const samplePlayerId = homePlayers[0];
            const samplePlayer = boxScore.teams.home.players[samplePlayerId];
            console.log(`   Sample player: ${samplePlayer.person?.fullName || 'Unknown'}`);
            
            // Check for batting stats
            if (samplePlayer.stats?.batting) {
              const battingStats = samplePlayer.stats.batting;
              console.log(`   Batting stats available: AB=${battingStats.atBats}, H=${battingStats.hits}, HR=${battingStats.homeRuns}`);
            }
          }
        }
      }
    } catch (boxScoreError) {
      console.log(`❌ Box score error: ${boxScoreError.message}`);
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the test
testSpecificBoxScore().catch(console.error);