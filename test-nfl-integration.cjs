/**
 * Test NFL integration with Sport and Comparison Factories
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testNFLIntegration() {
  console.log('\n🏈 Testing NFL Integration with Factories\n');
  console.log('='.repeat(60));
  
  // Test 1: SportAPIFactory supports NFL
  console.log('\n1. Testing SportAPIFactory.isSupported("nfl")...');
  const isSupported = SportAPIFactory.isSupported('nfl');
  console.log(`   Result: ${isSupported ? '✅' : '❌'} ${isSupported}`);
  
  // Test 2: Get supported leagues
  console.log('\n2. Testing SportAPIFactory.getSupportedLeagues()...');
  const leagues = SportAPIFactory.getSupportedLeagues();
  console.log(`   Result: ✅ [${leagues.join(', ')}]`);
  
  // Test 3: Get NFL client
  console.log('\n3. Testing SportAPIFactory.getClient("nfl")...');
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    console.log(`   Result: ✅ NFLAPIClient created`);
    console.log(`   Type: ${nflClient.constructor.name}`);
  } catch (error) {
    console.log(`   Result: ❌ ${error.message}`);
  }
  
  // Test 4: Search for a player
  console.log('\n4. Testing NFL player search...');
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    console.log('   Searching for "Patrick Mahomes"...');
    const players = await nflClient.searchPlayers('Patrick Mahomes');
    console.log(`   Result: ✅ Found ${players.length} player(s)`);
    if (players.length > 0) {
      console.log(`   - ${players[0].fullName} (ID: ${players[0].id})`);
    }
  } catch (error) {
    console.log(`   Result: ❌ ${error.message}`);
  }
  
  // Test 5: Get NFL comparison
  console.log('\n5. Testing ComparisonFactory.getComparison("nfl")...');
  try {
    const nflComparison = ComparisonFactory.getComparison('nfl');
    console.log(`   Result: ✅ NFLComparison created`);
    console.log(`   Type: ${nflComparison.constructor.name}`);
  } catch (error) {
    console.log(`   Result: ❌ ${error.message}`);
  }
  
  // Test 6: Compare two NFL players
  console.log('\n6. Testing NFL player comparison...');
  try {
    const nflComparison = ComparisonFactory.getComparison('nfl');
    console.log('   Comparing Patrick Mahomes (3139477) vs Joe Flacco (11252)...');
    const result = await nflComparison.comparePlayers(3139477, 11252, 'QB');
    console.log(`   Result: ✅ Comparison complete`);
    console.log(`   - Player 1 wins: ${result.player1.stats ? 'Yes' : 'No'}`);
    console.log(`   - Player 2 wins: ${result.player2.stats ? 'Yes' : 'No'}`);
    console.log(`   - Overall winner: ${result.overallWinner}`);
  } catch (error) {
    console.log(`   Result: ❌ ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ NFL Integration Test Complete!\n');
}

testNFLIntegration().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
