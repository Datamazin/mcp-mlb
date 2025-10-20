/**
 * Compare Barry Sanders vs Franco Harris
 * Two legendary NFL running backs from different eras
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function compareBarryFranco() {
  console.log('🏈 Comparing NFL Legends: Barry Sanders vs Franco Harris\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Search for players
    console.log('\n1. Searching for legendary running backs...');
    
    // Try searching for Barry Sanders
    console.log('   Searching for Barry Sanders...');
    const sandersResults = await nflClient.searchPlayers('Barry Sanders');
    console.log(`   Found ${sandersResults.length} results for Barry Sanders`);
    
    if (sandersResults.length > 0) {
      sandersResults.forEach((player, i) => {
        console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
      });
    }
    
    // Try searching for Franco Harris
    console.log('   Searching for Franco Harris...');
    const harrisResults = await nflClient.searchPlayers('Franco Harris');
    console.log(`   Found ${harrisResults.length} results for Franco Harris`);
    
    if (harrisResults.length > 0) {
      harrisResults.forEach((player, i) => {
        console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
      });
    }
    
    // Check if we found both players
    if (sandersResults.length === 0 && harrisResults.length === 0) {
      console.log('\n❌ Neither Barry Sanders nor Franco Harris found in current NFL database');
      console.log('   Note: The ESPN NFL API may only include current/recent players');
      console.log('   These legendary players retired in the 1990s and may not be in the current dataset');
      return;
    }
    
    if (sandersResults.length === 0) {
      console.log('\n❌ Barry Sanders not found in current NFL database');
      console.log('   Note: Barry Sanders retired in 1999 and may not be in ESPN\'s current dataset');
    }
    
    if (harrisResults.length === 0) {
      console.log('\n❌ Franco Harris not found in current NFL database');
      console.log('   Note: Franco Harris retired in 1984 and may not be in ESPN\'s current dataset');
    }
    
    // If we found at least one, try to get their stats
    if (sandersResults.length > 0) {
      console.log('\n📊 Barry Sanders Information:');
      const sanders = sandersResults[0];
      console.log(`   Name: ${sanders.fullName}`);
      console.log(`   ID: ${sanders.id}`);
      
      try {
        // Try to get stats for multiple seasons
        const seasons = [2023, 2024, 2025]; // Recent seasons
        for (const season of seasons) {
          console.log(`\n   Attempting to get ${season} stats...`);
          const stats = await nflClient.getPlayerStats(sanders.id, { season });
          if (stats && stats.splits && stats.splits.categories) {
            console.log(`   ✅ Found stats for ${season}`);
          } else {
            console.log(`   ❌ No stats found for ${season}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error getting stats: ${error.message}`);
      }
    }
    
    if (harrisResults.length > 0) {
      console.log('\n📊 Franco Harris Information:');
      const harris = harrisResults[0];
      console.log(`   Name: ${harris.fullName}`);
      console.log(`   ID: ${harris.id}`);
      
      try {
        // Try to get stats for multiple seasons
        const seasons = [2023, 2024, 2025]; // Recent seasons
        for (const season of seasons) {
          console.log(`\n   Attempting to get ${season} stats...`);
          const stats = await nflClient.getPlayerStats(harris.id, { season });
          if (stats && stats.splits && stats.splits.categories) {
            console.log(`   ✅ Found stats for ${season}`);
          } else {
            console.log(`   ❌ No stats found for ${season}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error getting stats: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 ANALYSIS NOTES:');
    console.log('');
    console.log('Barry Sanders (1989-1998):');
    console.log('- Detroit Lions legend');
    console.log('- 4x NFL rushing champion');  
    console.log('- 1997 NFL MVP');
    console.log('- Career: 15,269 rushing yards, 99 TDs');
    console.log('- Known for: Incredible agility, breaking tackles, highlight-reel runs');
    console.log('');
    console.log('Franco Harris (1972-1984):');
    console.log('- Pittsburgh Steelers legend');
    console.log('- 4x Super Bowl champion');
    console.log('- Famous for "Immaculate Reception" (1972)');
    console.log('- Career: 12,120 rushing yards, 91 TDs');
    console.log('- Known for: Power running, clutch performances, team success');
    console.log('');
    console.log('🏆 LEGACY COMPARISON:');
    console.log('- Sanders: Individual brilliance, revolutionary running style');
    console.log('- Harris: Team success, championship pedigree, iconic moments');
    console.log('- Both: Hall of Fame legends who defined their respective eras');
    
  } catch (error) {
    console.error('❌ Error during comparison:', error);
  }
}

compareBarryFranco().catch(console.error);