/**
 * Player Power Stats Analysis & Visualization - Dynamic Version
 * 
 * This script provides detailed analysis and text-based visualization of any player's power stats.
 * Follows MLB MCP Server Constitution v2.1.0 - Dynamic Script Architecture principle.
 * 
 * References:
 * - MLB-StatsAPI: https://github.com/toddrob99/MLB-StatsAPI
 * - Endpoints: https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints
 * 
 * Usage: node analyze-player-power-stats.js "Player Name" YYYY [gameType]
 * Examples:
 *   node analyze-player-power-stats.js "Pete Alonso" 2024
 *   node analyze-player-power-stats.js "Aaron Judge" 2024 R
 *   node analyze-player-power-stats.js "Freddie Freeman" 2024 P
 */

import { MLBAPIClient } from './build/mlb-api.js';

/**
 * Analyze any player's power statistics with monthly breakdown
 * @param {string} playerName - Player's full name
 * @param {number} season - Season year
 * @param {string} gameType - Game type (R=Regular, P=Playoffs, etc.)
 */
async function analyzePlayerPowerStats(playerName, season = 2024, gameType = 'R') {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  let playerId;
  
  console.log(`=== ${playerName} Power Stats Analysis - ${season} (${gameType}) ===\n`);
  
  // Step 1: Dynamic player search (following constitution requirement)
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
    
    // MLB-StatsAPI pattern: fallback to known players for reliability
    const knownPlayers = {
      'pete alonso': 624413,
      'aaron judge': 592450,
      'vladimir guerrero jr': 665489,
      'freddie freeman': 518692,
      'juan soto': 665742,
      'mookie betts': 605141,
      'ronald acuna jr': 660670,
      'jose altuve': 514888
    };
    
    const normalizedName = playerName.toLowerCase();
    if (knownPlayers[normalizedName]) {
      playerId = knownPlayers[normalizedName];
      console.log(`✅ Using known player ID: ${playerId} for ${playerName}`);
    } else {
      throw new Error(`Player "${playerName}" not found. Try: Pete Alonso, Aaron Judge, Vladimir Guerrero Jr, etc.`);
    }
  }
  
  // Step 2: Dynamic game type validation using metadata (constitution requirement)
  try {
    const metaData = await client.getMeta('gameTypes');
    const validGameTypes = metaData.data?.map(gt => gt.id) || ['R', 'S', 'P', 'W', 'D', 'L', 'WC', 'E', 'A', 'F', 'I'];
    
    if (!validGameTypes.includes(gameType)) {
      console.log(`⚠️ Warning: "${gameType}" may not be valid. Available: ${validGameTypes.join(', ')}`);
    }
  } catch (metaError) {
    console.log('⚠️ Could not validate game type, proceeding anyway...');
  }
  
  // Step 3: Get player power statistics
  try {
    const baseUrl = 'https://statsapi.mlb.com/api';
    const url = `${baseUrl}/v1/people/${playerId}/stats?stats=byMonth&season=${season}&gameType=${gameType}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.stats && data.stats[0] && data.stats[0].splits) {
      const sortedSplits = data.stats[0].splits.sort((a, b) => (a.month || 0) - (b.month || 0));
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      console.log('📊 Monthly Power Stats Breakdown:');
      console.log('='.repeat(80));
      console.log('Month    | 2B  | 3B  | HR  | XBH | AB  | 2B% | HR%');
      console.log('-'.repeat(80));
      
      let totals = { doubles: 0, triples: 0, homeRuns: 0, atBats: 0 };
      let monthlyData = [];
      let bestPowerMonth = { month: '', homeRuns: 0, extraBaseHits: 0 };
      
      sortedSplits.forEach(split => {
        const month = monthNames[split.month] || 'Unk';
        const stat = split.stat;
        const doubles = stat.doubles || 0;
        const triples = stat.triples || 0;
        const homeRuns = stat.homeRuns || 0;
        const atBats = stat.atBats || 0;
        const extraBaseHits = doubles + triples + homeRuns;
        
        const doublesRate = atBats > 0 ? ((doubles / atBats) * 100).toFixed(1) : '0.0';
        const homeRunRate = atBats > 0 ? ((homeRuns / atBats) * 100).toFixed(1) : '0.0';
        
        console.log(`${month.padEnd(8)} | ${doubles.toString().padStart(2)} | ${triples.toString().padStart(2)} | ${homeRuns.toString().padStart(2)} | ${extraBaseHits.toString().padStart(3)} | ${atBats.toString().padStart(3)} | ${doublesRate.padStart(3)}% | ${homeRunRate.padStart(3)}%`);
        
        // Track best power month
        if (homeRuns > bestPowerMonth.homeRuns || 
           (homeRuns === bestPowerMonth.homeRuns && extraBaseHits > bestPowerMonth.extraBaseHits)) {
          bestPowerMonth = { month, homeRuns, extraBaseHits };
        }
        
        // Accumulate totals
        totals.doubles += doubles;
        totals.triples += triples;
        totals.homeRuns += homeRuns;
        totals.atBats += atBats;
        
        monthlyData.push({ month, doubles, triples, homeRuns, extraBaseHits, atBats });
      });
      
      // Season summary
      console.log('-'.repeat(80));
      const seasonDoubleRate = totals.atBats > 0 ? ((totals.doubles / totals.atBats) * 100).toFixed(1) : '0.0';
      const seasonHomeRunRate = totals.atBats > 0 ? ((totals.homeRuns / totals.atBats) * 100).toFixed(1) : '0.0';
      const totalExtraBase = totals.doubles + totals.triples + totals.homeRuns;
      
      console.log(`${'TOTAL'.padEnd(8)} | ${totals.doubles.toString().padStart(2)} | ${totals.triples.toString().padStart(2)} | ${totals.homeRuns.toString().padStart(2)} | ${totalExtraBase.toString().padStart(3)} | ${totals.atBats.toString().padStart(3)} | ${seasonDoubleRate.padStart(3)}% | ${seasonHomeRunRate.padStart(3)}%`);
      
      // Power analysis insights
      console.log(`\n🎯 ${playerName} ${season} Power Analysis:`);
      console.log(`📈 Best Power Month: ${bestPowerMonth.month} (${bestPowerMonth.homeRuns} HR, ${bestPowerMonth.extraBaseHits} XBH)`);
      console.log(`⚾ Season Totals: ${totals.homeRuns} HR, ${totals.doubles} 2B, ${totals.triples} 3B`);
      console.log(`💪 Extra-Base Hit Rate: ${((totalExtraBase / totals.atBats) * 100).toFixed(1)}%`);
      console.log(`🏟️ Power Distribution: ${((totals.homeRuns / totalExtraBase) * 100).toFixed(1)}% HR, ${((totals.doubles / totalExtraBase) * 100).toFixed(1)}% 2B, ${((totals.triples / totalExtraBase) * 100).toFixed(1)}% 3B`);
      
      // Visual chart representation
      console.log(`\n📊 Visual Home Run Chart (${playerName} ${season}):`);
      const maxHR = Math.max(...monthlyData.map(m => m.homeRuns));
      const scale = Math.max(1, Math.ceil(maxHR / 20));
      
      monthlyData.forEach(m => {
        const bars = '█'.repeat(Math.ceil(m.homeRuns / scale));
        console.log(`${m.month.padEnd(3)} |${bars} ${m.homeRuns}`);
      });
      
      if (scale > 1) {
        console.log(`\n📏 Scale: Each █ = ${scale} home run${scale > 1 ? 's' : ''}`);
      }
      
    } else {
      console.log('❌ No monthly power stats found');
    }
    
  } catch (error) {
    console.log(`❌ Error fetching power stats: ${error.message}`);
    
    // Fallback to season totals (MLB-StatsAPI pattern)
    console.log('\n🔄 Falling back to season totals...');
    
    try {
      const stats = await client.getPlayerStats(playerId, season, gameType);
      if (stats.stats && stats.stats.length > 0) {
        const hitting = stats.stats.find(s => s.type.displayName.toLowerCase().includes('hitting'));
        if (hitting && hitting.stats) {
          const stat = hitting.stats;
          console.log(`\n📊 ${playerName} ${season} Season Power Summary:`);
          console.log(`   Home Runs: ${stat.homeRuns || 0}`);
          console.log(`   Doubles: ${stat.doubles || 0}`);
          console.log(`   Triples: ${stat.triples || 0}`);
          console.log(`   At Bats: ${stat.atBats || 0}`);
          
          const totalXBH = (stat.homeRuns || 0) + (stat.doubles || 0) + (stat.triples || 0);
          const xbhRate = stat.atBats > 0 ? ((totalXBH / stat.atBats) * 100).toFixed(1) : '0.0';
          console.log(`   Extra-Base Hit Rate: ${xbhRate}%`);
        }
      }
    } catch (fallbackError) {
      console.log(`❌ Fallback also failed: ${fallbackError.message}`);
    }
  }
  
  console.log(`\n=== ${playerName} Power Analysis Complete ===`);
}

// Dynamic command line argument parsing (constitution requirement)
const args = process.argv.slice(2);
const playerName = args[0] || 'Pete Alonso';  // Default example
const season = parseInt(args[1]) || 2024;     // Default to current
const gameType = args[2] || 'R';              // Default to Regular Season

// Usage help and validation
if (args.length === 0) {
  console.log('⚾ MLB Player Power Stats Analysis - Dynamic Version');
  console.log('='.repeat(60));
  console.log('Usage: node analyze-player-power-stats.js "Player Name" YYYY [gameType]');
  console.log('');
  console.log('Examples:');
  console.log('  node analyze-player-power-stats.js "Pete Alonso" 2024');
  console.log('  node analyze-player-power-stats.js "Aaron Judge" 2024 R');
  console.log('  node analyze-player-power-stats.js "Juan Soto" 2024 P');
  console.log('  node analyze-player-power-stats.js "Vladimir Guerrero Jr" 2023');
  console.log('');
  console.log('📋 Game Types: R=Regular, S=Spring, P=Playoffs, W=World Series');
  console.log('📋 Popular Players: Pete Alonso, Aaron Judge, Vladimir Guerrero Jr');
  console.log(`ℹ️ Using defaults: "${playerName}" ${season} ${gameType}\n`);
}

if (isNaN(season) || season < 1900 || season > new Date().getFullYear() + 1) {
  console.log('❌ Invalid season year. Please provide a valid year (1900 - current year + 1)');
  process.exit(1);
}

// Execute the dynamic analysis
analyzePlayerPowerStats(playerName, season, gameType).catch(console.error);