/**
 * Test Sport API Factory and Comparison Factory
 * 
 * Verifies that factories correctly instantiate API clients and comparison classes
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

console.log('🧪 Testing Sport API Factory and Comparison Factory\n');
console.log('=' .repeat(60));

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Get MLB API Client
  try {
    console.log('\n✅ Test 1: Get MLB API Client');
    const mlbClient = SportAPIFactory.getClient('mlb');
    console.log(`   Type: ${mlbClient.constructor.name}`);
    console.log(`   Has searchPlayers: ${typeof mlbClient.searchPlayers === 'function'}`);
    console.log(`   Has getPlayerStats: ${typeof mlbClient.getPlayerStats === 'function'}`);
    passed++;
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    failed++;
  }

  // Test 2: Get NBA API Client
  try {
    console.log('\n✅ Test 2: Get NBA API Client');
    const nbaClient = SportAPIFactory.getClient('nba');
    console.log(`   Type: ${nbaClient.constructor.name}`);
    console.log(`   Has searchPlayers: ${typeof nbaClient.searchPlayers === 'function'}`);
    console.log(`   Has getPlayerStats: ${typeof nbaClient.getPlayerStats === 'function'}`);
    passed++;
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    failed++;
  }

  // Test 3: Test Singleton Pattern (MLB)
  try {
    console.log('\n✅ Test 3: Verify Singleton Pattern (MLB)');
    const mlb1 = SportAPIFactory.getClient('mlb');
    const mlb2 = SportAPIFactory.getClient('mlb');
    const isSame = mlb1 === mlb2;
    console.log(`   Same instance: ${isSame}`);
    if (!isSame) throw new Error('Not singleton!');
    passed++;
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    failed++;
  }

  // Test 4: Test Singleton Pattern (NBA)
  try {
    console.log('\n✅ Test 4: Verify Singleton Pattern (NBA)');
    const nba1 = SportAPIFactory.getClient('nba');
    const nba2 = SportAPIFactory.getClient('nba');
    const isSame = nba1 === nba2;
    console.log(`   Same instance: ${isSame}`);
    if (!isSame) throw new Error('Not singleton!');
    passed++;
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    failed++;
  }

  // Test 5: Test isSupported
  try {
    console.log('\n✅ Test 5: Test isSupported Method');
    const mlbSupported = SportAPIFactory.isSupported('mlb');
    const nbaSupported = SportAPIFactory.isSupported('nba');
    const nflSupported = SportAPIFactory.isSupported('nfl');
    const invalidSupported = SportAPIFactory.isSupported('xyz');
    console.log(`   MLB supported: ${mlbSupported}`);
    console.log(`   NBA supported: ${nbaSupported}`);
    console.log(`   NFL supported: ${nflSupported}`);
    console.log(`   Invalid supported: ${invalidSupported}`);
    if (!mlbSupported || !nbaSupported || nflSupported || invalidSupported) {
      throw new Error('isSupported logic incorrect');
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    failed++;
  }

  // Test 6: Test getSupportedLeagues
  try {
    console.log('\n✅ Test 6: Test getSupportedLeagues Method');
    const leagues = SportAPIFactory.getSupportedLeagues();
    console.log(`   Supported leagues: ${leagues.join(', ')}`);
    if (!leagues.includes('mlb') || !leagues.includes('nba')) {
      throw new Error('Missing supported leagues');
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 6 FAILED: ${error.message}`);
    failed++;
  }

  // Test 7: Test Invalid League
  try {
    console.log('\n✅ Test 7: Test Invalid League Error');
    try {
      SportAPIFactory.getClient('xyz');
      throw new Error('Should have thrown error for invalid league');
    } catch (err) {
      console.log(`   Expected error: ${err.message}`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 7 FAILED: ${error.message}`);
    failed++;
  }

  // Test 8: Test NFL Not Implemented
  try {
    console.log('\n✅ Test 8: Test NFL Not Implemented');
    try {
      SportAPIFactory.getClient('nfl');
      throw new Error('Should have thrown error for NFL');
    } catch (err) {
      console.log(`   Expected error: ${err.message}`);
      if (!err.message.includes('Phase 3')) {
        throw new Error('Error message should mention Phase 3');
      }
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 8 FAILED: ${error.message}`);
    failed++;
  }

  // Test 9: Get MLB Comparison
  try {
    console.log('\n✅ Test 9: Get MLB Comparison');
    const mlbComparison = ComparisonFactory.getComparison('mlb');
    console.log(`   Type: ${mlbComparison.constructor.name}`);
    console.log(`   Has comparePlayers: ${typeof mlbComparison.comparePlayers === 'function'}`);
    passed++;
  } catch (error) {
    console.log(`❌ Test 9 FAILED: ${error.message}`);
    failed++;
  }

  // Test 10: Get NBA Comparison
  try {
    console.log('\n✅ Test 10: Get NBA Comparison');
    const nbaComparison = ComparisonFactory.getComparison('nba');
    console.log(`   Type: ${nbaComparison.constructor.name}`);
    console.log(`   Has comparePlayers: ${typeof nbaComparison.comparePlayers === 'function'}`);
    passed++;
  } catch (error) {
    console.log(`❌ Test 10 FAILED: ${error.message}`);
    failed++;
  }

  // Test 11: Test MLB API Client Functionality
  try {
    console.log('\n✅ Test 11: Test MLB API Client Search');
    const mlbClient = SportAPIFactory.getClient('mlb');
    const players = await mlbClient.searchPlayers('Ohtani');
    console.log(`   Found ${players.length} player(s)`);
    if (players.length > 0) {
      console.log(`   First player: ${players[0].fullName} (ID: ${players[0].id})`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 11 FAILED: ${error.message}`);
    failed++;
  }

  // Test 12: Test NBA API Client Functionality
  try {
    console.log('\n✅ Test 12: Test NBA API Client Search');
    const nbaClient = SportAPIFactory.getClient('nba');
    const players = await nbaClient.searchPlayers('LeBron');
    console.log(`   Found ${players.length} player(s)`);
    if (players.length > 0) {
      console.log(`   First player: ${players[0].fullName} (ID: ${players[0].id})`);
    }
    passed++;
  } catch (error) {
    console.log(`❌ Test 12 FAILED: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed}/${passed + failed} passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Factories are working correctly!\n');
  } else {
    console.log('\n❌ Some tests failed. Please review errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
