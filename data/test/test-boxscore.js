#!/usr/bin/env node

/**
 * Test script for new boxscore functionality
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testBoxScoreFunctionality() {
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

    // Test 1: Try to get enhanced schedule for a few days
    console.log('\n🗓️ Testing enhanced schedule functionality...');
    try {
      const scheduleResult = await client.callTool({
        name: 'get-schedule-with-games',
        arguments: {
          startDate: '2024-04-01',
          endDate: '2024-04-03'
        }
      });

      const scheduleData = scheduleResult.content[0];
      if (scheduleData.type === 'text') {
        const schedule = JSON.parse(scheduleData.text);
        console.log(`✅ Enhanced schedule: Found ${schedule.totalGames} games`);
        
        if (schedule.games && schedule.games.length > 0) {
          const sampleGame = schedule.games[0];
          console.log(`   Sample Game PK: ${sampleGame.gamePk}`);
          console.log(`   Date: ${sampleGame.gameDate}`);
          console.log(`   Teams: ${sampleGame.teams.away.team.name} @ ${sampleGame.teams.home.team.name}`);
          
          // Test 2: Try to get box score for this game
          console.log('\n📊 Testing box score functionality...');
          try {
            const boxScoreResult = await client.callTool({
              name: 'get-box-score',
              arguments: {
                gamePk: sampleGame.gamePk
              }
            });
            
            console.log('✅ Box score retrieved successfully');
            const boxScoreData = boxScoreResult.content[0];
            if (boxScoreData.type === 'text') {
              const boxScore = JSON.parse(boxScoreData.text);
              console.log(`   Game PK: ${boxScore.gamePk || 'N/A'}`);
              console.log(`   Teams data available: ${boxScore.teams ? 'Yes' : 'No'}`);
            }
          } catch (boxScoreError) {
            console.log(`❌ Box score error: ${boxScoreError.message}`);
          }
        }
      }
    } catch (scheduleError) {
      console.log(`❌ Schedule error: ${scheduleError.message}`);
    }

    // Test 3: Try to get player game logs
    console.log('\n📋 Testing player game logs functionality...');
    try {
      const gameLogsResult = await client.callTool({
        name: 'get-player-game-logs',
        arguments: {
          playerId: 624413, // Pete Alonso
          season: 2024
        }
      });

      const gameLogsData = gameLogsResult.content[0];
      if (gameLogsData.type === 'text') {
        const gameLogs = JSON.parse(gameLogsData.text);
        console.log(`✅ Game logs: Found ${gameLogs.gameLogs.length} games for ${gameLogs.player.fullName}`);
        
        if (gameLogs.gameLogs.length > 0) {
          console.log(`   Sample game: ${gameLogs.gameLogs[0].date} ${gameLogs.gameLogs[0].opponent}`);
        }
      }
    } catch (gameLogsError) {
      console.log(`❌ Game logs error: ${gameLogsError.message}`);
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
testBoxScoreFunctionality().catch(console.error);