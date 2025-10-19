/**
 * Debug script to see actual stat names in ESPN category data
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');

async function debugCategoryStats() {
  console.log('🔍 Debugging Category Stat Names\n');

  const nflAPI = SportAPIFactory.getClient('nfl');

  // Get Mahomes passing stats with category filter
  console.log('Getting Patrick Mahomes stats with passing category...\n');
  const mahomesData = await nflAPI.getPlayerStats(3139477, { 
    season: 2025,
    statCategory: 'passing'
  });

  if (mahomesData?.splits?.categories) {
    console.log(`Found ${mahomesData.splits.categories.length} categories\n`);
    
    mahomesData.splits.categories.forEach(category => {
      console.log(`\n📊 Category: ${category.displayName || category.name}`);
      console.log(`   Type: ${category.type}`);
      console.log(`   Stat count: ${category.stats?.length || 0}\n`);
      
      if (category.stats && category.stats.length > 0) {
        console.log('   Sample stats (first 15):');
        category.stats.slice(0, 15).forEach(stat => {
          console.log(`     - ${stat.displayName || stat.name}: ${stat.displayValue || stat.value}`);
        });
      }
    });
  }

  console.log('\n\n================================================================================\n');
  console.log('Now getting rushing category for Derrick Henry...\n');
  
  const henryData = await nflAPI.getPlayerStats(3043078, {
    season: 2025,
    statCategory: 'rushing'
  });

  if (henryData?.splits?.categories) {
    henryData.splits.categories.forEach(category => {
      console.log(`\n📊 Category: ${category.displayName || category.name}`);
      console.log(`   Type: ${category.type}`);
      console.log(`   Stat count: ${category.stats?.length || 0}\n`);
      
      if (category.stats && category.stats.length > 0) {
        console.log('   Sample stats (first 15):');
        category.stats.slice(0, 15).forEach(stat => {
          console.log(`     - ${stat.displayName || stat.name}: ${stat.displayValue || stat.value}`);
        });
      }
    });
  }
}

debugCategoryStats().catch(console.error);
