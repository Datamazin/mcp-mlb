/**
 * Get Player Monthly Batting Stats by Year - Final Version
 * 
 * This script retrieves any MLB player's batting statistics broken down by month for a specified season.
 * Usage: node get-player-monthly-stats-final.js "Player Name" YYYY
 * Example: node get-player-monthly-stats-final.js "Pete Alonso" 2024
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function getPlayerMonthlyStatsFinal(playerName, season) {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  let playerId;
  
  console.log(`=== ${playerName} Monthly Batting Stats - ${season} Season ===\n`);
  
  // Step 1: Get player ID
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
      throw new Error(`Player "${playerName}" not found.`);
    }
  }
  
  // Step 2: Get monthly stats with proper API call
  console.log(`📊 Fetching monthly batting data for ${season}...`);
  
  try {
    const baseUrl = 'https://statsapi.mlb.com/api';
    const url = `${baseUrl}/v1/people/${playerId}/stats?stats=byMonth&season=${season}&gameType=R`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Monthly data retrieved successfully`);
    
    if (data.stats && data.stats.length > 0) {
      const monthlyStats = data.stats[0]; // Get the first (and likely only) stat group
      
      if (monthlyStats.splits && monthlyStats.splits.length > 0) {
        console.log(`\n📊 ${season} Monthly Breakdown:`);
        
        // Sort splits by month for chronological display
        const sortedSplits = monthlyStats.splits.sort((a, b) => {
          const monthA = a.month || 0;
          const monthB = b.month || 0;
          return monthA - monthB;
        });
        
        sortedSplits.forEach((split, index) => {
          const stat = split.stat;
          
          // Use the actual month field from the API response
          let monthName = `Month ${index + 1}`;
          
          // Map month numbers to names using the actual month field from API
          const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          
          if (split.month && split.month >= 1 && split.month <= 12) {
            monthName = monthNames[split.month];
          } else if (split.split && split.split.description) {
            monthName = split.split.description;
          }
          
          console.log(`\n🗓️ ${monthName}:`);
          console.log(`   Games Played: ${stat.gamesPlayed || 0}`);
          console.log(`   At Bats: ${stat.atBats || 0}`);
          console.log(`   Hits: ${stat.hits || 0}`);
          console.log(`   Doubles: ${stat.doubles || 0}`);
          console.log(`   Triples: ${stat.triples || 0}`); 
          console.log(`   Home Runs: ${stat.homeRuns || 0}`);
          console.log(`   RBIs: ${stat.rbi || 0}`);
          console.log(`   Runs: ${stat.runs || 0}`);
          console.log(`   Walks: ${stat.baseOnBalls || 0}`);
          console.log(`   Strikeouts: ${stat.strikeOuts || 0}`);
          console.log(`   Stolen Bases: ${stat.stolenBases || 0}`);
          console.log(`   Batting Average: ${stat.avg || '.000'}`);
          console.log(`   On-Base Percentage: ${stat.obp || '.000'}`);
          console.log(`   Slugging Percentage: ${stat.slg || '.000'}`);
          console.log(`   OPS: ${stat.ops || '.000'}`);
          
          // Calculate some additional metrics
          if (stat.atBats > 0) {
            const extraBaseHits = (stat.doubles || 0) + (stat.triples || 0) + (stat.homeRuns || 0);
            console.log(`   Extra Base Hits: ${extraBaseHits}`);
          }
        });
        
        // Calculate season totals
        console.log(`\n📈 ${season} Season Totals:`);
        const totals = monthlyStats.splits.reduce((acc, split) => {
          const stat = split.stat;
          return {
            gamesPlayed: (acc.gamesPlayed || 0) + (stat.gamesPlayed || 0),
            atBats: (acc.atBats || 0) + (stat.atBats || 0),
            hits: (acc.hits || 0) + (stat.hits || 0),
            doubles: (acc.doubles || 0) + (stat.doubles || 0),
            triples: (acc.triples || 0) + (stat.triples || 0),
            homeRuns: (acc.homeRuns || 0) + (stat.homeRuns || 0),
            rbi: (acc.rbi || 0) + (stat.rbi || 0),
            runs: (acc.runs || 0) + (stat.runs || 0),
            baseOnBalls: (acc.baseOnBalls || 0) + (stat.baseOnBalls || 0),
            strikeOuts: (acc.strikeOuts || 0) + (stat.strikeOuts || 0),
            stolenBases: (acc.stolenBases || 0) + (stat.stolenBases || 0)
          };
        }, {});
        
        console.log(`   Games Played: ${totals.gamesPlayed}`);
        console.log(`   At Bats: ${totals.atBats}`);
        console.log(`   Hits: ${totals.hits}`);
        console.log(`   Home Runs: ${totals.homeRuns}`);
        console.log(`   RBIs: ${totals.rbi}`);
        console.log(`   Runs: ${totals.runs}`);
        console.log(`   Batting Average: ${totals.atBats > 0 ? (totals.hits / totals.atBats).toFixed(3) : '.000'}`);
        
      } else {
        console.log('❌ No monthly splits found in the data');
      }
    } else {
      console.log('❌ No stats data found');
    }
    
  } catch (error) {
    console.log(`❌ Error fetching monthly data: ${error.message}`);
    
    // Fallback to season totals
    console.log('\n🔄 Falling back to season totals...');
    
    try {
      const stats = await client.getPlayerStats(playerId, season, 'R');
      console.log('✅ Season totals retrieved successfully');
      // Display basic stats as fallback
      if (stats.stats && stats.stats.length > 0) {
        const stat = stats.stats[0].stats;
        console.log(`\n📊 ${season} Season Summary:`);
        console.log(`   Games: ${stat.gamesPlayed || 0}`);
        console.log(`   At Bats: ${stat.atBats || 0}`);
        console.log(`   Hits: ${stat.hits || 0}`);
        console.log(`   Home Runs: ${stat.homeRuns || 0}`);
        console.log(`   RBIs: ${stat.rbi || 0}`);
        console.log(`   Batting Average: ${stat.avg || '.000'}`);
      }
    } catch (fallbackError) {
      console.log(`❌ Fallback also failed: ${fallbackError.message}`);
    }
  }
  
  console.log('\n=== Monthly Stats Analysis Complete ===');
}

// Parse command line arguments
const args = process.argv.slice(2);
const playerName = args[0] || 'Pete Alonso';
const season = parseInt(args[1]) || 2024;

// Validate inputs
if (args.length === 0) {
  console.log('ℹ️ Usage: node get-player-monthly-stats-final.js "Player Name" YYYY');
  console.log('ℹ️ Example: node get-player-monthly-stats-final.js "Pete Alonso" 2024');
  console.log(`ℹ️ Using defaults: "${playerName}" ${season}\n`);
}

if (isNaN(season) || season < 1900 || season > new Date().getFullYear() + 1) {
  console.log('❌ Invalid season year. Please provide a valid year (1900 - current year + 1)');
  process.exit(1);
}

// Run the final monthly stats analysis
getPlayerMonthlyStatsFinal(playerName, season).catch(console.error);