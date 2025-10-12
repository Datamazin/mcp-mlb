/**
 * Get Player Monthly Batting Stats by Year - Enhanced Version
 * 
 * This script retrieves any MLB player's batting statistics broken down by month for a specified season.
 * Usage: node get-player-monthly-stats-enhanced.js "Player Name" YYYY
 * Example: node get-player-monthly-stats-enhanced.js "Pete Alonso" 2024
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function getPlayerMonthlyStatsEnhanced(playerName, season) {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  let playerId; // Declare playerId at function scope
  
  console.log(`=== ${playerName} Monthly Batting Stats - ${season} Season ===\n`);
  
  // Step 1: Search for the player by name
  console.log(`🔍 Searching for player: ${playerName}...`);
  
  try {
    const searchResults = await client.searchPlayers(playerName);
    if (searchResults.players && searchResults.players.length > 0) {
      const player = searchResults.players[0];
      playerId = player.id;
      console.log(`✅ Found player: ${player.fullName} (ID: ${playerId})`);
    } else {
      throw new Error(`No players found for "${playerName}"`);
    }
  } catch (searchError) {
    // If search fails, try with known player IDs for common players
    console.log(`⚠️ Search failed, trying known player lookup...`);
    const knownPlayers = {
      'pete alonso': 624413,
      'aaron judge': 592450,
      'vladimir guerrero jr': 665489,
      'mookie betts': 605141,
      'mike trout': 545361,
      'ronald acuna jr': 660670,
      'juan soto': 665742,
      'fernando tatis jr': 665487,
      'shohei ohtani': 660271,
      'francisco lindor': 596019
    };
    
    const normalizedName = playerName.toLowerCase();
    if (knownPlayers[normalizedName]) {
      playerId = knownPlayers[normalizedName];
      console.log(`✅ Using known player ID: ${playerId} for ${playerName}`);
    } else {
      throw new Error(`Player "${playerName}" not found. Available: Pete Alonso, Aaron Judge, Vladimir Guerrero Jr, Mookie Betts, Mike Trout, Ronald Acuna Jr, Juan Soto, Fernando Tatis Jr, Shohei Ohtani, Francisco Lindor`);
    }
  }
  
  // Step 2: Try multiple approaches to get monthly data
  console.log(`📊 Fetching monthly batting data for ${season}...`);
  
  try {
    // Method 1: Try to get stats with monthly splits using direct API call
    const baseUrl = 'https://statsapi.mlb.com/api';
    
    // Try different stat split types
    const splitTypes = [
      'byMonth',
      'month',
      'statSplits',
      'splits'
    ];
    
    let monthlyData = null;
    
    for (const splitType of splitTypes) {
      try {
        console.log(`   Trying split type: ${splitType}...`);
        const url = `${baseUrl}/v1/people/${playerId}/stats?stats=${splitType}&season=${season}&gameType=R`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.stats && data.stats.length > 0) {
            console.log(`   ✅ Success with ${splitType}`);
            monthlyData = data;
            break;
          }
        }
      } catch (error) {
        console.log(`   ❌ ${splitType} failed: ${error.message}`);
      }
    }
    
    if (monthlyData) {
      console.log(`\n📊 ${season} Monthly Batting Stats:`);
      
      monthlyData.stats.forEach(statGroup => {
        if (statGroup.splits && statGroup.splits.length > 0) {
          console.log(`\n--- ${statGroup.type.displayName} (${statGroup.group.displayName}) ---`);
          
          statGroup.splits.forEach(split => {
            const stat = split.stat;
            const splitName = split.split ? split.split.description : split.season || 'Total';
            
            console.log(`\n${splitName}:`);
            console.log(`  Games: ${stat.gamesPlayed || 0}`);
            console.log(`  At Bats: ${stat.atBats || 0}`);
            console.log(`  Hits: ${stat.hits || 0}`);
            console.log(`  Home Runs: ${stat.homeRuns || 0}`);
            console.log(`  RBIs: ${stat.rbi || 0}`);
            console.log(`  Batting Average: ${stat.avg || '.000'}`);
            console.log(`  OBP: ${stat.obp || '.000'}`);
            console.log(`  SLG: ${stat.slg || '.000'}`);
            console.log(`  OPS: ${stat.ops || '.000'}`);
          });
        }
      });
    } else {
      throw new Error('No monthly split data available');
    }
    
  } catch (error) {
    console.log(`❌ Monthly splits error: ${error.message}`);
    
    // Fallback: Get basic season stats
    console.log('\n🔄 Falling back to season totals...');
    
    try {
      const stats = await client.getPlayerStats(playerId, season, 'R');
      
      console.log(`✅ ${season} Season Totals Retrieved:`);
      console.log(`Player: ${stats.player.fullName}`);
      console.log(`Team: ${stats.team ? stats.team.name : 'N/A'}`);
      
      if (stats.stats && stats.stats.length > 0) {
        stats.stats.forEach(statGroup => {
          console.log(`\n--- ${statGroup.type.displayName} ---`);
          const stat = statGroup.stats;
          console.log(`  Games: ${stat.gamesPlayed || 0}`);
          console.log(`  At Bats: ${stat.atBats || 0}`);
          console.log(`  Hits: ${stat.hits || 0}`);
          console.log(`  Home Runs: ${stat.homeRuns || 0}`);
          console.log(`  RBIs: ${stat.rbi || 0}`);
          console.log(`  Batting Average: ${stat.avg || '.000'}`);
          console.log(`  OBP: ${stat.obp || '.000'}`);
          console.log(`  SLG: ${stat.slg || '.000'}`);
          console.log(`  OPS: ${stat.ops || '.000'}`);
        });
      }
      
    } catch (fallbackError) {
      console.log(`❌ Fallback failed: ${fallbackError.message}`);
    }
  }
  
  console.log('\n=== Monthly Stats Request Complete ===');
}

// Parse command line arguments
const args = process.argv.slice(2);
const playerName = args[0] || 'Pete Alonso';  // Default to Pete Alonso
const season = parseInt(args[1]) || 2024;     // Default to 2024

// Validate inputs
if (args.length === 0) {
  console.log('ℹ️ Usage: node get-player-monthly-stats-enhanced.js "Player Name" YYYY');
  console.log('ℹ️ Example: node get-player-monthly-stats-enhanced.js "Pete Alonso" 2024');
  console.log(`ℹ️ Using defaults: "${playerName}" ${season}\n`);
}

if (isNaN(season) || season < 1900 || season > new Date().getFullYear() + 1) {
  console.log('❌ Invalid season year. Please provide a valid year (1900 - current year + 1)');
  process.exit(1);
}

// Run the enhanced monthly stats request
getPlayerMonthlyStatsEnhanced(playerName, season).catch(console.error);