/**
 * Inspect full stat object structure from ESPN
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');

async function inspectStatStructure() {
  console.log('🔍 Inspecting ESPN Stat Object Structure\n');

  const nflAPI = SportAPIFactory.getClient('nfl');

  // Get Mahomes passing stats
  const mahomesData = await nflAPI.getPlayerStats(3139477, { 
    season: 2025,
    statCategory: 'passing'
  });

  if (mahomesData?.splits?.categories && mahomesData.splits.categories.length > 0) {
    const category = mahomesData.splits.categories[0];
    
    console.log('📊 Full stat object structure:\n');
    console.log('First 5 stats in detail:');
    
    category.stats.slice(0, 5).forEach((stat, i) => {
      console.log(`\nStat ${i + 1}:`);
      console.log(JSON.stringify(stat, null, 2));
    });
  }
}

inspectStatStructure().catch(console.error);
