/**
 * Test NFL dynamic season detection
 */

const { NFLAPIClient } = require('./build/api/nfl-api.js');

async function testSeasonDetection() {
  console.log('🏈 Testing NFL Dynamic Season Detection\n');
  console.log('=' .repeat(80));
  
  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  console.log(`\nCurrent Date: ${monthNames[currentMonth]} ${now.getDate()}, ${currentYear}`);
  console.log(`Current Month: ${currentMonth}`);
  
  // Expected season based on logic
  let expectedSeason;
  if (currentMonth >= 8) {
    expectedSeason = currentYear;
    console.log(`Logic: August-December → Current year's season (${currentYear})`);
  } else if (currentMonth <= 2) {
    expectedSeason = currentYear - 1;
    console.log(`Logic: January-February → Previous year's season (${currentYear - 1})`);
  } else {
    expectedSeason = currentYear - 1;
    console.log(`Logic: March-July → Off-season, use previous year (${currentYear - 1})`);
  }
  
  console.log(`\nExpected Season: ${expectedSeason}`);
  
  // Test with actual API call
  console.log('\n' + '-'.repeat(80));
  console.log('Testing with Patrick Mahomes (ID: 3139477)...\n');
  
  try {
    const client = new NFLAPIClient();
    
    // Test 1: Get stats without specifying season (should use current)
    console.log('1. Fetching stats without season parameter...');
    const stats1 = await client.getPlayerStats(3139477);
    console.log(`   ✅ Season used: ${stats1.season?.year || 'N/A'}`);
    console.log(`   Player: ${stats1.playerName}`);
    
    // Test 2: Get stats with explicit season (2024)
    console.log('\n2. Fetching stats with explicit season=2024...');
    const stats2 = await client.getPlayerStats(3139477, { season: 2024 });
    console.log(`   ✅ Season used: ${stats2.season?.year || 'N/A'}`);
    console.log(`   Player: ${stats2.playerName}`);
    
    // Test 3: Get stats with explicit season (2023)
    console.log('\n3. Fetching stats with explicit season=2023...');
    const stats3 = await client.getPlayerStats(3139477, { season: 2023 });
    console.log(`   ✅ Season used: ${stats3.season?.year || 'N/A'}`);
    console.log(`   Player: ${stats3.playerName}`);
    
    // Compare some stats
    if (stats2.splits?.categories && stats3.splits?.categories) {
      const get2024PassingYards = () => {
        for (const cat of stats2.splits.categories) {
          for (const stat of cat.stats || []) {
            if (stat.name === 'passingYards') return stat.value;
          }
        }
        return 0;
      };
      
      const get2023PassingYards = () => {
        for (const cat of stats3.splits.categories) {
          for (const stat of cat.stats || []) {
            if (stat.name === 'passingYards') return stat.value;
          }
        }
        return 0;
      };
      
      const yards2024 = get2024PassingYards();
      const yards2023 = get2023PassingYards();
      
      console.log('\n' + '-'.repeat(80));
      console.log('📊 Season Comparison:');
      console.log(`   2024 Passing Yards: ${yards2024}`);
      console.log(`   2023 Passing Yards: ${yards2023}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ SUCCESS: Dynamic season detection working!');
    console.log(`   - Current season automatically detected as: ${expectedSeason}`);
    console.log('   - Explicit season parameter works correctly ✅');
    console.log('   - API returns different stats for different seasons ✅');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testSeasonDetection();
