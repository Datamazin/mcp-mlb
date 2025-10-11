#!/usr/bin/env node

/**
 * Example script to get Pete Alonso's career batting stats using the MLB MCP Server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function getPeteAlonsoStats() {
  // Create client transport to connect to our MLB MCP server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'mlb-stats-client',
    version: '1.0.0'
  });

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MLB MCP Server');

    // First, search for Pete Alonso to get his player ID
    console.log('\n🔍 Searching for Pete Alonso...');
    const searchResult = await client.callTool({
      name: 'search-players',
      arguments: {
        name: 'Pete Alonso',
        activeStatus: 'Y'
      }
    });

    console.log('Search Results:', JSON.stringify(searchResult, null, 2));

    // Extract player ID from search results
    const searchData = searchResult.content[0];
    if (searchData.type === 'text') {
      const parsed = JSON.parse(searchData.text);
      if (parsed.players && parsed.players.length > 0) {
        const peteAlonso = parsed.players.find((p) => 
          p.fullName.toLowerCase().includes('pete alonso') || 
          p.fullName.toLowerCase().includes('peter alonso')
        );
        
        if (peteAlonso) {
          console.log(`\n⚾ Found Pete Alonso (ID: ${peteAlonso.id})`);
          console.log(`Team: ${peteAlonso.currentTeam?.name || 'Unknown'}`);
          console.log(`Position: ${peteAlonso.primaryPosition.name}`);
          
          // Get his career stats for multiple years
          console.log('\n📊 Getting career batting stats by year...');
          
          const years = [2019, 2020, 2021, 2022, 2023, 2024];
          
          for (const year of years) {
            try {
              console.log(`\n--- ${year} Season ---`);
              const statsResult = await client.callTool({
                name: 'get-player-stats',
                arguments: {
                  playerId: peteAlonso.id,
                  season: year,
                  gameType: 'R' // Regular season
                }
              });

              const statsData = statsResult.content[0];
              if (statsData.type === 'text') {
                const statsObj = JSON.parse(statsData.text);
                
                // Extract batting stats
                const battingStats = statsObj.stats?.find((s) => 
                  s.group?.displayName === 'hitting'
                );
                
                if (battingStats && battingStats.stats) {
                  const stats = battingStats.stats;
                  console.log(`Games: ${stats.gamesPlayed}`);
                  console.log(`At Bats: ${stats.atBats}`);
                  console.log(`Hits: ${stats.hits}`);
                  console.log(`Home Runs: ${stats.homeRuns}`);
                  console.log(`RBIs: ${stats.rbi}`);
                  console.log(`Batting Average: ${stats.avg}`);
                  console.log(`OBP: ${stats.obp}`);
                  console.log(`SLG: ${stats.slg}`);
                  console.log(`OPS: ${stats.ops}`);
                } else {
                  console.log('No batting stats found for this year');
                }
              }
            } catch (error) {
              console.log(`No stats available for ${year}: ${error.message}`);
            }
          }
        } else {
          console.log('❌ Pete Alonso not found in search results');
        }
      } else {
        console.log('❌ No players found');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
getPeteAlonsoStats().catch(console.error);