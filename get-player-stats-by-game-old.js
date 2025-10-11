#!/usr/bin/env node

/**
 * MLB Player Game-by-Game Stats Script
 * Get individual game statistics for an MLB player during a specified season
 * Usage: node get-player-stats-by-game.js "Player Name" [season]
 * Example: node get-player-stats-by-game.js "Pete Alonso" 2024
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function getPlayerGameByGameStats(playerName, season = 2024) {
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

    // Known player IDs (expandable database)
    const knownPlayers = {
      'pete alonso': { id: 624413, teamId: 121 }, // Mets
      'aaron judge': { id: 592450, teamId: 147 }, // Yankees
      'mike trout': { id: 545361, teamId: 108 }, // Angels
      'mookie betts': { id: 605141, teamId: 119 }, // Dodgers
      'juan soto': { id: 665742, teamId: 135 }, // Padres
      'bryce harper': { id: 547180, teamId: 143 }, // Phillies
      'vladimir guerrero jr': { id: 665489, teamId: 141 }, // Blue Jays
      'ronald acuna jr': { id: 660670, teamId: 144 }, // Braves
      'fernando tatis jr': { id: 665487, teamId: 135 }, // Padres
      'shohei ohtani': { id: 660271, teamId: 108 }, // Angels (2023)
      'manny machado': { id: 592518, teamId: 135 }, // Padres
      'freddie freeman': { id: 518692, teamId: 119 }, // Dodgers
      'jose altuve': { id: 514888, teamId: 117 } // Astros
    };

    const playerKey = playerName.toLowerCase();
    const playerInfo = knownPlayers[playerKey];

    if (!playerInfo) {
      console.log(`\n❌ Player "${playerName}" not found in known players database.`);
      console.log('Available known players:');
      Object.keys(knownPlayers).forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
      return;
    }

    console.log(`\n⚾ Getting game-by-game stats for ${playerName} (${season} season)`);
    console.log(`Player ID: ${playerInfo.id}, Team ID: ${playerInfo.teamId}`);

    // Try to get player game logs for the season (this works!)
    console.log(`\n� Retrieving ${playerName}'s game logs for ${season}...`);
    
    let gameLogs = [];
    let gameLogsError = null;
    
    try {
      const gameLogsResult = await client.callTool({
        name: 'get-player-game-logs',
        arguments: {
          playerId: playerInfo.id,
          season: season,
          gameType: 'R'
        }
      });

      const gameLogsData = gameLogsResult.content[0];
      if (gameLogsData.type === 'text') {
        const gameLogsResponse = JSON.parse(gameLogsData.text);
        gameLogs = gameLogsResponse.gameLogs || [];
      }
    } catch (error) {
      gameLogsError = error.message;
      console.log(`⚠️  Game Logs API Error: ${gameLogsError}`);
    }
    
    if (gameLogs.length === 0) {
      console.log(`� No game logs found for ${playerName} in ${season}`);
      console.log(`   ${gameLogsError ? 'Error: ' + gameLogsError : 'Player may not have played in specified season'}`);
      process.exit(1);
    }
    
    console.log(`✅ Found ${gameLogs.length} games for ${playerName} in ${season}`);
    
    console.log(`\n${playerName} Game-by-Game Performance Analysis (${season}):\n`);

    // Process and display game logs
    console.log('🔍 MCP SERVER GAME-BY-GAME CAPABILITIES:');
    console.log('   ✅ Player game logs and statistics');
    console.log('   ✅ Individual game box scores');  
    console.log('   ✅ Season totals and player data');
    console.log('');
    
    // Show first few games as examples
    const sampleGames = gameLogs.slice(0, 5);
    console.log(`📊 Sample Games (showing first 5 of ${gameLogs.length} total):`);
    console.log('='.repeat(60));
    
    for (let i = 0; i < sampleGames.length; i++) {
      const game = sampleGames[i];
      console.log(`\n📅 Game ${i + 1}: ${game.date} vs ${game.opponent || 'Unknown'}`);
      
      // Display batting stats if available
      if (game.stat) {
        const stats = game.stat;
        console.log(`   AB: ${stats.atBats || 0} | H: ${stats.hits || 0} | R: ${stats.runs || 0} | RBI: ${stats.rbi || 0}`);
        console.log(`   HR: ${stats.homeRuns || 0} | 2B: ${stats.doubles || 0} | 3B: ${stats.triples || 0}`);
        console.log(`   BB: ${stats.baseOnBalls || 0} | SO: ${stats.strikeOuts || 0} | SB: ${stats.stolenBases || 0}`);
        
        // Calculate game average if at bats > 0
        if (stats.atBats > 0) {
          const avg = (stats.hits / stats.atBats).toFixed(3);
          console.log(`   AVG: ${avg}`);
        }
      } else {
        console.log(`   Stats: Not available for this game`);
      }
    }
    
    if (gameLogs.length > 5) {
      console.log(`\n... and ${gameLogs.length - 5} more games`);
    }
    
    // Calculate season totals from game logs
    console.log(`\n📈 Season Totals from Game Logs:`);
    console.log('='.repeat(40));
    
    let totalStats = {
      games: gameLogs.length,
      atBats: 0, hits: 0, runs: 0, rbi: 0, homeRuns: 0,
      doubles: 0, triples: 0, baseOnBalls: 0, strikeOuts: 0, stolenBases: 0
    };
    
    gameLogs.forEach(game => {
      if (game.stat) {
        const s = game.stat;
        totalStats.atBats += s.atBats || 0;
        totalStats.hits += s.hits || 0;
        totalStats.runs += s.runs || 0;
        totalStats.rbi += s.rbi || 0;
        totalStats.homeRuns += s.homeRuns || 0;
        totalStats.doubles += s.doubles || 0;
        totalStats.triples += s.triples || 0;
        totalStats.baseOnBalls += s.baseOnBalls || 0;
        totalStats.strikeOuts += s.strikeOuts || 0;
        totalStats.stolenBases += s.stolenBases || 0;
      }
    });
    
    console.log(`Games: ${totalStats.games}`);
    console.log(`AB: ${totalStats.atBats} | H: ${totalStats.hits} | R: ${totalStats.runs} | RBI: ${totalStats.rbi}`);
    console.log(`HR: ${totalStats.homeRuns} | 2B: ${totalStats.doubles} | 3B: ${totalStats.triples}`);
    console.log(`BB: ${totalStats.baseOnBalls} | SO: ${totalStats.strikeOuts} | SB: ${totalStats.stolenBases}`);
    
    if (totalStats.atBats > 0) {
      const seasonAvg = (totalStats.hits / totalStats.atBats).toFixed(3);
      console.log(`Season AVG: ${seasonAvg}`);
    }
    console.log('   ❌ Detailed per-game batting statistics');
    console.log('');
    
    if (games.length > 0) {
      console.log(`📅 Sample games from ${season} season:\n`);
    } else {
      console.log('📅 Schedule data not available with current API parameters.\n');
    }

    // Display the schedule with game information
    let gameCount = 0;
    const gamesSummary = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      homeGames: 0,
      awayGames: 0
    };

    for (const game of games.slice(0, 10)) { // Show first 10 games as example
      gameCount++;
      gamesSummary.totalGames++;
      
      const isHome = game.teams.home.team.id === playerInfo.teamId;
      const opponent = isHome ? game.teams.away.team.name : game.teams.home.team.name;
      const venue = isHome ? 'vs' : '@';
      
      if (isHome) gamesSummary.homeGames++;
      else gamesSummary.awayGames++;

      console.log(`Game ${gameCount}: ${game.gameDate.split('T')[0]} - ${venue} ${opponent}`);
      console.log(`  Status: ${game.status.detailedState}`);
      
      if (game.teams.home.score !== undefined && game.teams.away.score !== undefined) {
        const teamScore = isHome ? game.teams.home.score : game.teams.away.score;
        const oppScore = isHome ? game.teams.away.score : game.teams.home.score;
        const result = teamScore > oppScore ? 'W' : 'L';
        
        if (result === 'W') gamesSummary.wins++;
        else gamesSummary.losses++;
        
        console.log(`  Score: ${teamScore}-${oppScore} (${result})`);
      }
      console.log('  [Individual batting stats would appear here with box score data]');
      console.log('');
    }

    if (games.length > 10) {
      console.log(`... and ${games.length - 10} more games\n`);
      
      // Count remaining games for summary
      for (const game of games.slice(10)) {
        gamesSummary.totalGames++;
        const isHome = game.teams.home.team.id === playerInfo.teamId;
        
        if (isHome) gamesSummary.homeGames++;
        else gamesSummary.awayGames++;
        
        if (game.teams.home.score !== undefined && game.teams.away.score !== undefined) {
          const teamScore = isHome ? game.teams.home.score : game.teams.away.score;
          const oppScore = isHome ? game.teams.away.score : game.teams.home.score;
          const result = teamScore > oppScore ? 'W' : 'L';
          
          if (result === 'W') gamesSummary.wins++;
          else gamesSummary.losses++;
        }
      }
    }

    // Display season summary
    console.log(`📈 ${season} Season Summary:`);
    console.log(`Total Games: ${gamesSummary.totalGames}`);
    console.log(`Team Record: ${gamesSummary.wins}-${gamesSummary.losses}`);
    console.log(`Home Games: ${gamesSummary.homeGames}`);
    console.log(`Away Games: ${gamesSummary.awayGames}`);

    console.log('\n💡 To get actual game-by-game batting statistics, the MCP server would need:');
    console.log('   • Individual game box score endpoints');
    console.log('   • Player game log API integration');
    console.log('   • Enhanced data parsing for per-game stats');
    
    // Get season totals as reference
    console.log(`\n📊 ${playerName}'s ${season} Season Totals (for reference):`);
    try {
      const statsResult = await client.callTool({
        name: 'get-player-stats',
        arguments: {
          playerId: playerInfo.id,
          season: season,
          gameType: 'R'
        }
      });

      const statsData = statsResult.content[0];
      if (statsData.type === 'text') {
        const statsObj = JSON.parse(statsData.text);
        
        const hittingStats = statsObj.stats.find(s => 
          s.group && s.group.displayName && 
          s.group.displayName.toLowerCase().includes('hitting')
        );
        
        if (hittingStats && hittingStats.stats) {
          const stats = hittingStats.stats;
          console.log(`Games: ${stats.gamesPlayed || 'N/A'}`);
          console.log(`At Bats: ${stats.atBats || 'N/A'}`);
          console.log(`Hits: ${stats.hits || 'N/A'}`);
          console.log(`Home Runs: ${stats.homeRuns || 'N/A'}`);
          console.log(`RBIs: ${stats.rbi || 'N/A'}`);
          console.log(`Batting Average: ${stats.avg || 'N/A'}`);
          console.log(`OPS: ${stats.ops || 'N/A'}`);
        }
      }
    } catch (error) {
      console.log('Could not retrieve season totals');
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
  console.log('Usage: node get-player-stats-by-game.js "Player Name" [season]');
  console.log('Examples:');
  console.log('  node get-player-stats-by-game.js "Pete Alonso" 2024');
  console.log('  node get-player-stats-by-game.js "Aaron Judge" 2023');
  console.log('  node get-player-stats-by-game.js "Mike Trout" 2022');
  console.log('\nAvailable known players:', [
    'Pete Alonso', 'Aaron Judge', 'Mike Trout', 'Mookie Betts', 'Juan Soto',
    'Bryce Harper', 'Vladimir Guerrero Jr', 'Ronald Acuna Jr', 'Fernando Tatis Jr',
    'Shohei Ohtani', 'Manny Machado', 'Freddie Freeman', 'Jose Altuve'
  ].join(', '));
  process.exit(1);
}

const playerName = args[0];
const season = args[1] ? parseInt(args[1]) : 2024;

// Validate season
if (isNaN(season) || season < 2010 || season > 2030) {
  console.error('❌ Invalid season. Please provide a valid year between 2010-2030.');
  process.exit(1);
}

console.log(`🎯 Getting game-by-game stats for "${playerName}" in ${season}`);

// Run the script
getPlayerGameByGameStats(playerName, season).catch(console.error);