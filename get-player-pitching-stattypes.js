/**
 * Get Player Pitching Stats by Year - Dynamic Version with Stat Type Support
 * 
 * This script retrieves any MLB pitcher's pitching statistics for a specified season and stat type.
 * Based on the successful get-player-monthly-year-stats.js structure with dynamic stat type support.
 * Usage: node get-player-monthly-pitching-stats.js "Player Name" YYYY [statType]
 * Example: node get-player-monthly-pitching-stats.js "Kodai Senga" 2025 byMonth
 * Example: node get-player-monthly-pitching-stats.js "Jacob deGrom" 2024 season
 * Example: node get-player-monthly-pitching-stats.js "Gerrit Cole" 2024 gameLog
 */

import { MLBAPIClient } from './build/mlb-api.js';

// Popular stat types from MLB API (57 total available)
const POPULAR_STAT_TYPES = [
  'byMonth', 'season', 'gameLog', 'yearByYear', 'career', 'advanced', 'seasonAdvanced',
  'careerAdvanced', 'homeAndAway', 'byDateRange', 'byDayOfWeek', 'winLoss', 'vsTeam',
  'lastXGames', 'statSplits', 'pitchLog', 'metricAverages', 'expectedStatistics',
  'sabermetrics', 'byMonthPlayoffs', 'standard', 'careerRegularSeason', 'vsPlayer'
];

// Function to get available stat types from MLB API
async function getAvailableStatTypes() {
  try {
    const client = new MLBAPIClient('https://statsapi.mlb.com/api');
    const data = await client.getMeta('statTypes');
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map(stat => stat.displayName);
    }
  } catch (error) {
    console.log('⚠️ Could not fetch live stat types, using cached list');
  }
  return POPULAR_STAT_TYPES;
}

async function getPlayerPitchingStats(playerName, season, statType = 'byMonth') {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  let playerId; // Declare playerId at function scope
  
  // Validate stat type
  const availableTypes = await getAvailableStatTypes();
  if (!availableTypes.includes(statType)) {
    console.log(`⚠️ Warning: "${statType}" may not be a valid stat type.`);
    console.log(`📋 Popular types: byMonth, season, gameLog, career, homeAndAway, advanced`);
    console.log(`📝 Run "node show-stat-types.js" to see all ${availableTypes.length} available types`);
    console.log(`ℹ️ Proceeding with "${statType}" anyway...\n`);
  }
  
  const statTypeDisplay = statType === 'byMonth' ? 'Monthly' : 
                         statType === 'season' ? 'Season' :
                         statType === 'gameLog' ? 'Game Log' :
                         statType === 'career' ? 'Career' :
                         statType.charAt(0).toUpperCase() + statType.slice(1);
  
  console.log(`=== ${playerName} ${statTypeDisplay} Pitching Stats - ${season} Season ===\n`);
  
  // Step 1: Get player ID (exactly like the batting script)
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
    console.log(`⚠️ Search failed, trying known player lookup...`);
    const knownPitchers = {
      'kodai senga': 681637,
      'jacob degrom': 594798,
      'max scherzer': 453286,
      'gerrit cole': 543037,
      'shane bieber': 669456,
      'luis severino': 622663,
      'edwin diaz': 621242,
      'francisco lindor': 596019,  // Added as he sometimes pitches
      'corbin burnes': 669203,
      'freddy peralta': 642547,
      'brandon woodruff': 605540,
      'devin williams': 642207
    };
    
    const normalizedName = playerName.toLowerCase();
    if (knownPitchers[normalizedName]) {
      playerId = knownPitchers[normalizedName];
      console.log(`✅ Using known player ID: ${playerId} for ${playerName}`);
    } else {
      throw new Error(`Player "${playerName}" not found. Try: Kodai Senga, Jacob deGrom, Max Scherzer, Gerrit Cole, etc.`);
    }
  }
  
  // Step 2: Get pitching stats with dynamic stat type (same pattern as batting)
  console.log(`📊 Fetching ${statTypeDisplay.toLowerCase()} pitching data for ${season}...`);
  
  try {
    const baseUrl = 'https://statsapi.mlb.com/api';
    const url = `${baseUrl}/v1/people/${playerId}/stats?stats=${statType}&season=${season}&gameType=R`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${statTypeDisplay} data retrieved successfully`);
    
    if (data.stats && data.stats.length > 0) {
      // Look for pitching stats (similar to how batting script finds hitting)
      const pitchingStats = data.stats.find(stat => 
        stat.group && stat.group.displayName && 
        stat.group.displayName.toLowerCase().includes('pitching')
      );
      
      if (pitchingStats && pitchingStats.splits && pitchingStats.splits.length > 0) {
        console.log(`\n📊 ${season} ${statTypeDisplay} Breakdown:`);
        
        // Sort splits appropriately based on stat type
        let sortedSplits;
        if (statType === 'byMonth') {
          // Sort by month for chronological display
          sortedSplits = pitchingStats.splits.sort((a, b) => {
            const monthA = a.month || 0;
            const monthB = b.month || 0;
            return monthA - monthB;
          });
        } else if (statType === 'gameLog') {
          // Sort by game date for game logs
          sortedSplits = pitchingStats.splits.sort((a, b) => {
            if (a.date && b.date) {
              return new Date(a.date) - new Date(b.date);
            }
            return 0;
          });
        } else {
          // Default: keep original order
          sortedSplits = pitchingStats.splits;
        }
        
        sortedSplits.forEach((split, index) => {
          const stat = split.stat;
          
          // Dynamic title based on stat type
          let title = `Entry ${index + 1}`;
          
          if (statType === 'byMonth') {
            // Use the actual month field from the API response
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            if (split.month && split.month >= 1 && split.month <= 12) {
              title = monthNames[split.month];
            } else {
              title = `Month ${index + 1}`;
            }
          } else if (statType === 'gameLog') {
            // Format game log entry
            const gameDate = split.date ? new Date(split.date).toLocaleDateString() : `Game ${index + 1}`;
            const opponent = split.opponent ? split.opponent.name : 'vs ???';
            title = `${gameDate} ${opponent}`;
          } else if (statType === 'season' || statType === 'career') {
            // Season or career totals
            title = `${statTypeDisplay} Total`;
          } else if (statType === 'homeAndAway') {
            // Home/Away splits
            title = split.isHome ? 'Home Games' : 'Away Games';
          } else if (split.split && split.split.description) {
            // Use API-provided description
            title = split.split.description;
          }
          
          console.log(`\n🗓️ ${title}:`);
          console.log(`   Games Started: ${stat.gamesStarted || 0}`);
          console.log(`   Games Played: ${stat.gamesPlayed || 0}`);
          console.log(`   Innings Pitched: ${stat.inningsPitched || '0.0'}`);
          console.log(`   Wins: ${stat.wins || 0}`);
          console.log(`   Losses: ${stat.losses || 0}`);
          console.log(`   ERA: ${stat.era || '-.--'}`);
          console.log(`   WHIP: ${stat.whip || '-.--'}`);
          console.log(`   Strikeouts: ${stat.strikeOuts || 0}`);
          console.log(`   Walks: ${stat.baseOnBalls || 0}`);
          console.log(`   Hits Allowed: ${stat.hits || 0}`);
          console.log(`   Home Runs Allowed: ${stat.homeRuns || 0}`);
          console.log(`   Earned Runs: ${stat.earnedRuns || 0}`);
          console.log(`   Batting Average Against: ${stat.avg || '.---'}`);
          
          // Calculate advanced metrics if innings pitched available
          if (stat.inningsPitched && parseFloat(stat.inningsPitched) > 0) {
            const ip = parseFloat(stat.inningsPitched);
            const k9 = ((stat.strikeOuts || 0) * 9 / ip).toFixed(2);
            const bb9 = ((stat.baseOnBalls || 0) * 9 / ip).toFixed(2);
            console.log(`   K/9: ${k9}`);
            console.log(`   BB/9: ${bb9}`);
            
            if ((stat.baseOnBalls || 0) > 0) {
              const kBBRatio = ((stat.strikeOuts || 0) / (stat.baseOnBalls || 1)).toFixed(2);
              console.log(`   K/BB Ratio: ${kBBRatio}`);
            }
          }
        });
        
        // Calculate totals if appropriate for the stat type
        if (statType === 'byMonth' || statType === 'gameLog' || statType === 'homeAndAway') {
          console.log(`\n📈 ${season} ${statTypeDisplay} Totals:`);
          const totals = sortedSplits.reduce((acc, split) => {
            const stat = split.stat;
            return {
              gamesStarted: (acc.gamesStarted || 0) + (stat.gamesStarted || 0),
              gamesPlayed: (acc.gamesPlayed || 0) + (stat.gamesPlayed || 0),
              wins: (acc.wins || 0) + (stat.wins || 0),
              losses: (acc.losses || 0) + (stat.losses || 0),
              strikeOuts: (acc.strikeOuts || 0) + (stat.strikeOuts || 0),
              baseOnBalls: (acc.baseOnBalls || 0) + (stat.baseOnBalls || 0),
              hits: (acc.hits || 0) + (stat.hits || 0),
              homeRuns: (acc.homeRuns || 0) + (stat.homeRuns || 0),
              earnedRuns: (acc.earnedRuns || 0) + (stat.earnedRuns || 0),
              inningsPitched: (acc.inningsPitched || 0) + (parseFloat(stat.inningsPitched) || 0)
            };
          }, {});
          
          console.log(`   Games Started: ${totals.gamesStarted}`);
          console.log(`   Total Innings: ${totals.inningsPitched.toFixed(1)}`);
          console.log(`   Record: ${totals.wins}-${totals.losses}`);
          console.log(`   Total Strikeouts: ${totals.strikeOuts}`);
          console.log(`   Total Walks: ${totals.baseOnBalls}`);
          console.log(`   Hits Allowed: ${totals.hits}`);
          
          if (totals.inningsPitched > 0) {
            const seasonERA = (totals.earnedRuns * 9 / totals.inningsPitched).toFixed(2);
            const seasonK9 = (totals.strikeOuts * 9 / totals.inningsPitched).toFixed(2);
            const seasonWHIP = ((totals.hits + totals.baseOnBalls) / totals.inningsPitched).toFixed(2);
            
            console.log(`   Season ERA: ${seasonERA}`);
            console.log(`   Season WHIP: ${seasonWHIP}`);
            console.log(`   K/9: ${seasonK9}`);
          }
        }
        
      } else {
        console.log(`❌ No ${statTypeDisplay.toLowerCase()} pitching splits found in the data`);
      }
    } else {
      console.log('❌ No stats data found');
    }
    
  } catch (error) {
    console.log(`❌ Error fetching ${statTypeDisplay.toLowerCase()} data: ${error.message}`);
    
    // Fallback to season totals (same pattern as batting script)
    console.log('\n🔄 Falling back to season totals...');
    
    try {
      const stats = await client.getPlayerStats(playerId, season, 'R');
      console.log('✅ Season totals retrieved successfully');
      
      if (stats.stats && stats.stats.length > 0) {
        const pitching = stats.stats.find(s => s.type.displayName.toLowerCase().includes('pitching'));
        if (pitching && pitching.stats) {
          const stat = pitching.stats;
          console.log(`\n📊 ${season} Season Summary:`);
          console.log(`   Games Started: ${stat.gamesStarted || 0}`);
          console.log(`   Innings Pitched: ${stat.inningsPitched || '0.0'}`);
          console.log(`   Record: ${stat.wins || 0}-${stat.losses || 0}`);
          console.log(`   ERA: ${stat.era || '-.--'}`);
          console.log(`   WHIP: ${stat.whip || '-.--'}`);
          console.log(`   Strikeouts: ${stat.strikeOuts || 0}`);
          console.log(`   Walks: ${stat.baseOnBalls || 0}`);
        }
      }
    } catch (fallbackError) {
      console.log(`❌ Fallback also failed: ${fallbackError.message}`);
    }
  }
  
  console.log(`\n=== ${statTypeDisplay} Pitching Stats Analysis Complete ===`);
}

// Parse command line arguments with dynamic stat type support
const args = process.argv.slice(2);
const playerName = args[0] || 'Kodai Senga';  // Default to Kodai Senga
const season = parseInt(args[1]) || 2025;     // Default to 2025
const statType = args[2] || 'byMonth';        // Default to byMonth

// Validate inputs and show help
if (args.length === 0) {
  console.log('ℹ️ MLB Pitcher Stats Analysis - Dynamic Stat Type Support');
  console.log('=' .repeat(60));
  console.log('Usage: node get-player-monthly-pitching-stats.js "Player Name" YYYY [statType]');
  console.log('');
  console.log('Examples:');
  console.log('  node get-player-monthly-pitching-stats.js "Kodai Senga" 2025 byMonth');
  console.log('  node get-player-monthly-pitching-stats.js "Jacob deGrom" 2024 season');
  console.log('  node get-player-monthly-pitching-stats.js "Gerrit Cole" 2024 gameLog');
  console.log('  node get-player-monthly-pitching-stats.js "Max Scherzer" 2024 homeAndAway');
  console.log('');
  console.log('📋 Popular Stat Types:');
  console.log('  • byMonth     - Monthly breakdown (default)');
  console.log('  • season      - Full season totals');
  console.log('  • gameLog     - Individual game performances');
  console.log('  • career      - Career statistics');
  console.log('  • homeAndAway - Home vs Away splits');
  console.log('  • advanced    - Advanced metrics');
  console.log('  • yearByYear  - Year-by-year progression');
  console.log('');
  console.log('🔍 For all 57 available stat types, run: node show-stat-types.js');
  console.log(`ℹ️ Using defaults: "${playerName}" ${season} ${statType}\n`);
}

if (isNaN(season) || season < 1900 || season > new Date().getFullYear() + 1) {
  console.log('❌ Invalid season year. Please provide a valid year (1900 - current year + 1)');
  process.exit(1);
}

// Run the pitching stats analysis with dynamic stat type
getPlayerPitchingStats(playerName, season, statType).catch(console.error);