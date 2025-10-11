#!/usr/bin/env node

/**
 * Dynamic MLB Player Stats Script
 * Get any MLB player's career batting stats using the MLB MCP Server
 * Usage: node getplayer-stats.js "Player Name" [startYear] [endYear]
 * Example: node getplayer-stats.js "Aaron Judge" 2022 2024
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function getPlayerStats(playerName, startYear = 2019, endYear = 2024) {
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

    // Known player IDs (as a workaround since search doesn't work reliably by name)
    const knownPlayers = {
      'pete alonso': 624413,
      'aaron judge': 592450,
      'mike trout': 545361,
      'mookie betts': 605141,
      'juan soto': 665742,
      'bryce harper': 547180,
      'vladimir guerrero jr': 665489,
      'ronald acuna jr': 660670,
      'fernando tatis jr': 665487,
      'shohei ohtani': 660271,
      'manny machado': 592518,
      'freddie freeman': 518692,
      'jose altuve': 514888
    };

    const playerKey = playerName.toLowerCase();
    let targetPlayer = null;
    let playerId = knownPlayers[playerKey];

    if (playerId) {
      // Use known player ID directly
      console.log(`\n⚾ Using known player ID ${playerId} for "${playerName}"`);
      
      // Get player info to display details
      try {
        const playerInfoResult = await client.callTool({
          name: 'get-player-stats',
          arguments: {
            playerId: playerId,
            season: endYear
          }
        });
        
        const playerData = playerInfoResult.content[0];
        if (playerData.type === 'text') {
          const parsed = JSON.parse(playerData.text);
          targetPlayer = {
            id: playerId,
            fullName: parsed.player.fullName,
            primaryPosition: parsed.player.primaryPosition
          };
        }
      } catch (error) {
        console.log('Could not get player details, but will proceed with stats...');
        targetPlayer = {
          id: playerId,
          fullName: playerName,
          primaryPosition: { name: 'Unknown' }
        };
      }
    } else {
      console.log(`\n❌ Player "${playerName}" not found in known players database.`);
      console.log('Available known players:');
      Object.keys(knownPlayers).forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
      return;
    }

    if (targetPlayer) {
      console.log(`\n⚾ ${targetPlayer.fullName} (ID: ${targetPlayer.id})`);
      console.log(`Position: ${targetPlayer.primaryPosition.name}`);
      
      // Get career stats for the specified year range
      console.log(`\n📊 ${targetPlayer.fullName} Career Batting Stats (${startYear}-${endYear}):\n`);
      
      const years = [];
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
      
      let totalStats = {
        games: 0,
        atBats: 0,
        hits: 0,
        homeRuns: 0,
        rbis: 0,
        walks: 0,
        strikeouts: 0,
        doubles: 0,
        triples: 0
      };
      
      for (const year of years) {
        try {
          console.log(`--- ${year} Season ---`);
          const statsResult = await client.callTool({
            name: 'get-player-stats',
            arguments: {
              playerId: targetPlayer.id,
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
                
                // Add to career totals
                totalStats.games += parseInt(stats.gamesPlayed) || 0;
                totalStats.atBats += parseInt(stats.atBats) || 0;
                totalStats.hits += parseInt(stats.hits) || 0;
                totalStats.homeRuns += parseInt(stats.homeRuns) || 0;
                totalStats.rbis += parseInt(stats.rbi) || 0;
                totalStats.walks += parseInt(stats.baseOnBalls) || 0;
                totalStats.strikeouts += parseInt(stats.strikeOuts) || 0;
                totalStats.doubles += parseInt(stats.doubles) || 0;
                totalStats.triples += parseInt(stats.triples) || 0;
              } else {
                console.log('No hitting stats found for this year');
                console.log('Available stat types:', statsObj.stats.map(s => s.group?.displayName || s.type?.displayName));
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
      
      // Display career totals
      if (totalStats.atBats > 0) {
        const careerAvg = (totalStats.hits / totalStats.atBats).toFixed(3);
        console.log(`\n🏆 CAREER TOTALS (${startYear}-${endYear}):`);
        console.log(`Games: ${totalStats.games}`);
        console.log(`At Bats: ${totalStats.atBats}`);
        console.log(`Hits: ${totalStats.hits}`);
        console.log(`Home Runs: ${totalStats.homeRuns}`);
        console.log(`RBIs: ${totalStats.rbis}`);
        console.log(`Doubles: ${totalStats.doubles}`);
        console.log(`Triples: ${totalStats.triples}`);
        console.log(`Walks: ${totalStats.walks}`);
        console.log(`Strikeouts: ${totalStats.strikeouts}`);
        console.log(`Career Batting Average: ${careerAvg}`);
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

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node getplayer-stats.js "Player Name" [startYear] [endYear]');
  console.log('Examples:');
  console.log('  node getplayer-stats.js "Pete Alonso"');
  console.log('  node getplayer-stats.js "Aaron Judge" 2022 2024');
  console.log('  node getplayer-stats.js "Mike Trout" 2019 2023');
  console.log('\nAvailable known players:', [
    'Pete Alonso', 'Aaron Judge', 'Mike Trout', 'Mookie Betts', 'Juan Soto',
    'Bryce Harper', 'Vladimir Guerrero Jr', 'Ronald Acuna Jr', 'Fernando Tatis Jr',
    'Shohei Ohtani', 'Manny Machado', 'Freddie Freeman', 'Jose Altuve'
  ].join(', '));
  process.exit(1);
}

const playerName = args[0];
const startYear = args[1] ? parseInt(args[1]) : 2019;
const endYear = args[2] ? parseInt(args[2]) : 2024;

// Validate years
if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
  console.error('❌ Invalid year range. Please provide valid years.');
  process.exit(1);
}

console.log(`🎯 Getting stats for "${playerName}" from ${startYear} to ${endYear}`);

// Run the script
getPlayerStats(playerName, startYear, endYear).catch(console.error);