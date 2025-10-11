#!/usr/bin/env node

/**
 * Get Pete Alonso's career batting stats using his known player ID
 * Pete Alonso's MLB player ID is 624413
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function getPeteAlonsoStatsById() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'mlb-stats-client',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    console.log('Connected to MLB MCP Server');

    const peteAlonsoId = 624413; // Pete Alonso's known player ID
    console.log(`\n⚾ Getting Pete Alonso's career stats (Player ID: ${peteAlonsoId})`);
    
    // Get his career stats for multiple years
    console.log('\n📊 Pete Alonso Career Batting Stats by Year:\n');
    
    const years = [2019, 2020, 2021, 2022, 2023, 2024];
    
    for (const year of years) {
      try {
        console.log(`--- ${year} Season ---`);
        const statsResult = await client.callTool({
          name: 'get-player-stats',
          arguments: {
            playerId: peteAlonsoId,
            season: year,
            gameType: 'R' // Regular season
          }
        });

        const statsData = statsResult.content[0];
        if (statsData.type === 'text') {
          const statsObj = JSON.parse(statsData.text);
          
          if (statsObj.stats && statsObj.stats.length > 0) {
            // Look for hitting stats - check group.displayName instead of type.displayName
            const hittingStats = statsObj.stats.find(s => 
              s.group && s.group.displayName && 
              s.group.displayName.toLowerCase().includes('hitting')
            );
            
            if (hittingStats && hittingStats.stats) {
              const stats = hittingStats.stats;
              console.log(`Games Played: ${stats.gamesPlayed || 'N/A'}`);
              console.log(`At Bats: ${stats.atBats || 'N/A'}`);
              console.log(`Hits: ${stats.hits || 'N/A'}`);
              console.log(`Home Runs: ${stats.homeRuns || 'N/A'}`);
              console.log(`RBIs: ${stats.rbi || 'N/A'}`);
              console.log(`Batting Average: ${stats.avg || 'N/A'}`);
              console.log(`On-Base Percentage: ${stats.obp || 'N/A'}`);
              console.log(`Slugging Percentage: ${stats.slg || 'N/A'}`);
              console.log(`OPS: ${stats.ops || 'N/A'}`);
              console.log(`Doubles: ${stats.doubles || 'N/A'}`);
              console.log(`Triples: ${stats.triples || 'N/A'}`);
              console.log(`Walks: ${stats.baseOnBalls || 'N/A'}`);
              console.log(`Strikeouts: ${stats.strikeOuts || 'N/A'}`);
            } else {
              console.log('No hitting stats found for this year');
              // Let's see what stats are available
              console.log('Available stat types:', statsObj.stats.map(s => s.type?.displayName));
            }
          } else {
            console.log('No stats available for this year');
          }
        }
        console.log(''); // Empty line for readability
      } catch (error) {
        console.log(`❌ Error getting stats for ${year}: ${error.message}\n`);
      }
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

// Run the script
getPeteAlonsoStatsById().catch(console.error);