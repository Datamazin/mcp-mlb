// Get player batting statistics for each game in a specified season
// Uses the MLB MCP Server's new game logs capability

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';
import path from 'path';

// Known players database for quick lookup
const KNOWN_PLAYERS = {
  'pete alonso': { id: 624413, name: 'Pete Alonso', teamId: 121 },
  'aaron judge': { id: 592450, name: 'Aaron Judge', teamId: 147 },
  'mike trout': { id: 545361, name: 'Mike Trout', teamId: 108 },
  'mookie betts': { id: 605141, name: 'Mookie Betts', teamId: 119 },
  'juan soto': { id: 665742, name: 'Juan Soto', teamId: 147 },
  'bryce harper': { id: 547180, name: 'Bryce Harper', teamId: 143 },
  'vladimir guerrero jr': { id: 665489, name: 'Vladimir Guerrero Jr', teamId: 141 },
  'ronald acuna jr': { id: 660670, name: 'Ronald Acuna Jr', teamId: 144 },
  'fernando tatis jr': { id: 665487, name: 'Fernando Tatis Jr', teamId: 135 },
  'shohei ohtani': { id: 660271, name: 'Shohei Ohtani', teamId: 119 },
  'manny machado': { id: 592518, name: 'Manny Machado', teamId: 135 },
  'freddie freeman': { id: 518692, name: 'Freddie Freeman', teamId: 119 },
  'jose altuve': { id: 514888, name: 'Jose Altuve', teamId: 117 }
};

// Function to export game logs to CSV
function exportToCSV(gameLogs, playerName, season, gameType) {
  // Create data/csv directory if it doesn't exist
  const csvDir = path.join(process.cwd(), 'data', 'csv');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
    console.log('📁 Created data/csv directory');
  }

  // Generate filename
  const sanitizedPlayerName = playerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const gameTypeName = gameType === 'R' ? 'regular' : gameType.toLowerCase();
  const filename = `${sanitizedPlayerName}-${season}-${gameTypeName}-game-logs.csv`;
  const filepath = path.join(csvDir, filename);

  // CSV header
  const headers = [
    'Game_Number',
    'Date',
    'Opponent',
    'At_Bats',
    'Hits',
    'Runs',
    'RBI',
    'Home_Runs',
    'Doubles',
    'Triples',
    'Walks',
    'Strikeouts',
    'Stolen_Bases',
    'Game_Average',
    'Cumulative_Average'
  ];

  // Build CSV content
  let csvContent = headers.join(',') + '\n';
  
  let cumulativeHits = 0;
  let cumulativeAtBats = 0;

  gameLogs.forEach((game, index) => {
    const stats = game.stats || {};
    
    const atBats = stats.atBats || 0;
    const hits = stats.hits || 0;
    
    cumulativeHits += hits;
    cumulativeAtBats += atBats;
    
    const gameAvg = atBats > 0 ? (hits / atBats).toFixed(3) : '0.000';
    const cumulativeAvg = cumulativeAtBats > 0 ? (cumulativeHits / cumulativeAtBats).toFixed(3) : '0.000';
    
    const row = [
      index + 1,
      game.date || 'Unknown',
      (game.opponent || 'Unknown').replace(/,/g, ' vs'), // Remove commas for CSV
      atBats,
      hits,
      stats.runs || 0,
      stats.rbi || 0,
      stats.homeRuns || 0,
      stats.doubles || 0,
      stats.triples || 0,
      stats.baseOnBalls || 0,
      stats.strikeOuts || 0,
      stats.stolenBases || 0,
      gameAvg,
      cumulativeAvg
    ];
    
    csvContent += row.join(',') + '\n';
  });

  // Write CSV file
  try {
    fs.writeFileSync(filepath, csvContent);
    console.log(`📊 CSV exported successfully: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Error writing CSV file: ${error.message}`);
    return null;
  }
}

async function getPlayerGameByGameStats(playerName, season, gameType = 'R') {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'mlb-game-by-game-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('🔌 Connected to MLB MCP Server');

    // Get player information
    let playerInfo = KNOWN_PLAYERS[playerName.toLowerCase()];
    
    if (!playerInfo) {
      console.log(`🔍 Searching for player: ${playerName}...`);
      
      try {
        const searchResult = await client.callTool({
          name: 'search-players',
          arguments: {
            name: playerName,
            activeStatus: 'Y'
          }
        });

        const searchData = searchResult.content[0];
        if (searchData.type === 'text') {
          const players = JSON.parse(searchData.text);
          if (players.length > 0) {
            const player = players[0];
            playerInfo = {
              id: player.id,
              name: `${player.firstName} ${player.lastName}`,
              teamId: player.currentTeam?.id
            };
            console.log(`✅ Found: ${playerInfo.name} (ID: ${playerInfo.id})`);
          } else {
            console.log(`❌ No players found with name: ${playerName}`);
            process.exit(1);
          }
        }
      } catch (error) {
        console.log(`❌ Search failed for ${playerName}: ${error.message}`);
        process.exit(1);
      }
    } else {
      console.log(`✅ Using known player: ${playerInfo.name} (ID: ${playerInfo.id})`);
    }

    // Get player game logs for the season
    const gameTypeNames = {
      'R': 'Regular Season',
      'S': 'Spring Training',
      'P': 'Playoffs/Postseason', 
      'D': 'Division Series',
      'L': 'League Championship',
      'W': 'World Series',
      'F': 'Fall/Playoff'
    };
    
    console.log(`\n📋 Retrieving ${playerName}'s ${gameTypeNames[gameType]} game logs for ${season}...`);
    
    let gameLogs = [];
    let gameLogsError = null;
    
    try {
      const gameLogsResult = await client.callTool({
        name: 'get-player-game-logs',
        arguments: {
          playerId: playerInfo.id,
          season: season,
          gameType: gameType
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
      console.log(`📋 No ${gameTypeNames[gameType]} game logs found for ${playerName} in ${season}`);
      console.log(`   ${gameLogsError ? 'Error: ' + gameLogsError : `Player may not have played ${gameTypeNames[gameType]} games in ${season}`}`);
      
      if (gameType !== 'R') {
        console.log(`\n💡 Tip: Try regular season games with gameType 'R' or omit the gameType parameter`);
      }
      process.exit(1);
    }
    
    console.log(`✅ Found ${gameLogs.length} ${gameTypeNames[gameType]} games for ${playerName} in ${season}`);
    
    console.log(`\n${playerName} ${gameTypeNames[gameType]} Performance Analysis (${season}):\n`);

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
      if (game.stats) {
        const stats = game.stats;
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
    
    // Calculate totals from game logs
    console.log(`\n📈 ${gameTypeNames[gameType]} Totals from Game Logs:`);
    console.log('='.repeat(50));
    
    let totalStats = {
      games: gameLogs.length,
      atBats: 0, hits: 0, runs: 0, rbi: 0, homeRuns: 0,
      doubles: 0, triples: 0, baseOnBalls: 0, strikeOuts: 0, stolenBases: 0
    };
    
    gameLogs.forEach(game => {
      if (game.stats) {
        const s = game.stats;
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
      const avgLabel = gameType === 'R' ? 'Season AVG' : `${gameTypeNames[gameType]} AVG`;
      const avg = (totalStats.hits / totalStats.atBats).toFixed(3);
      console.log(`${avgLabel}: ${avg}`);
    }
    
    // Export data to CSV
    console.log(`\n📁 Exporting game logs to CSV...`);
    const csvPath = exportToCSV(gameLogs, playerName, season, gameType);
    
    if (csvPath) {
      console.log(`✅ Game-by-game data exported to: ${path.relative(process.cwd(), csvPath)}`);
      console.log(`📊 CSV contains ${gameLogs.length} games with detailed statistics`);
    }
    
    console.log(`\n✅ Successfully retrieved ${gameTypeNames[gameType]} game-by-game data for ${playerName}!`);
    console.log(`📋 Use this script to analyze any player's individual game performance in regular season or playoffs.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNRESET') {
      console.log('🔌 Connection was reset - make sure the MCP server is running');
    }
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
  console.log('Usage: node get-player-stats-by-game-updated.js "Player Name" [season] [gameType]');
  console.log('Examples:');
  console.log('  node get-player-stats-by-game-updated.js "Pete Alonso" 2024');
  console.log('  node get-player-stats-by-game-updated.js "Aaron Judge" 2023 R');
  console.log('  node get-player-stats-by-game-updated.js "Shohei Ohtani" 2025 S');
  console.log('  node get-player-stats-by-game-updated.js "Vladimir Guerrero Jr" 2025 P');
  console.log('  node get-player-stats-by-game-updated.js "Mike Trout" 2022 D');
  console.log('\nGame Types:');
  console.log('  R = Regular Season (default)');
  console.log('  S = Spring Training');
  console.log('  P = Playoffs/Postseason');
  console.log('  D = Division Series');
  console.log('  L = League Championship');
  console.log('  W = World Series');
  console.log('\nAvailable known players:', [
    'Pete Alonso', 'Aaron Judge', 'Mike Trout', 'Mookie Betts', 'Juan Soto',
    'Bryce Harper', 'Vladimir Guerrero Jr', 'Ronald Acuna Jr', 'Fernando Tatis Jr',
    'Shohei Ohtani', 'Manny Machado', 'Freddie Freeman', 'Jose Altuve'
  ].join(', '));
  process.exit(1);
}

const playerName = args[0];
const season = args[1] ? parseInt(args[1]) : 2024;
const gameType = args[2] ? args[2].toUpperCase() : 'R';

// Validate season
if (isNaN(season) || season < 2010 || season > 2030) {
  console.error('❌ Invalid season. Please provide a valid year between 2010-2030.');
  process.exit(1);
}

// Validate game type
const validGameTypes = ['R', 'S', 'P', 'D', 'L', 'W', 'F'];
if (!validGameTypes.includes(gameType)) {
  console.error('❌ Invalid game type. Use R (Regular), S (Spring Training), P (Playoffs), D (Division), L (League Championship), or W (World Series).');
  process.exit(1);
}

const gameTypeNames = {
  'R': 'Regular Season',
  'S': 'Spring Training',
  'P': 'Playoffs/Postseason', 
  'D': 'Division Series',
  'L': 'League Championship',
  'W': 'World Series',
  'F': 'Fall/Playoff'
};

console.log(`🎯 Getting ${gameTypeNames[gameType]} game-by-game stats for "${playerName}" in ${season}`);

// Run the script
getPlayerGameByGameStats(playerName, season, gameType).catch(console.error);