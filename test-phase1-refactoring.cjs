#!/usr/bin/env node

/**
 * Phase 1 Verification Test
 * 
 * Tests the refactored MLB code to ensure:
 * 1. MLBAPIClient still works (via base class)
 * 2. MLBComparison still works (via base class)
 * 3. All existing functionality is preserved
 * 4. New base class architecture is functioning
 */

const { MLBAPIClient } = require('./build/api/mlb-api.js');
const { MLBComparison, comparePlayers, formatComparisonResult } = require('./build/comparison/mlb-comparison.js');

// Test configuration
const TEST_PLAYER_1 = 'Aaron Judge';
const TEST_PLAYER_1_ID = 592450;
const TEST_PLAYER_2 = 'Pete Alonso';
const TEST_PLAYER_2_ID = 624413;
const TEST_SEASON = 2024;

console.log('='.repeat(80));
console.log('PHASE 1 REFACTORING VERIFICATION TEST');
console.log('='.repeat(80));
console.log('');

async function runTests() {
  const mlbClient = new MLBAPIClient('https://statsapi.mlb.com/api/v1');
  let testsPass = 0;
  let testsFail = 0;

  // ========================================
  // TEST 1: MLBAPIClient - Search Players
  // ========================================
  console.log('TEST 1: Search Players (via BaseSportAPI)');
  try {
    const results = await mlbClient.searchPlayers(TEST_PLAYER_1);
    
    if (results && results.length > 0) {
      console.log(`✅ PASS: Found ${results.length} players matching "${TEST_PLAYER_1}"`);
      console.log(`   First match: ${results[0].fullName} (ID: ${results[0].id})`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: No players found for "${TEST_PLAYER_1}"`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 2: MLBAPIClient - Get Player Stats
  // ========================================
  console.log('TEST 2: Get Player Stats (via MLBAPIClient)');
  try {
    const stats = await mlbClient.getPlayerStats(TEST_PLAYER_1_ID, TEST_SEASON, 'R', 'season');
    
    if (stats && stats.player) {
      console.log(`✅ PASS: Retrieved stats for ${stats.player.fullName}`);
      if (stats.stats && stats.stats.length > 0) {
        const hitting = stats.stats.find(s => s.group.displayName.includes('hitting'));
        if (hitting) {
          console.log(`   Sample stat: ${hitting.stats.homeRuns} home runs`);
        }
      }
      testsPass++;
    } else {
      console.log(`❌ FAIL: No stats retrieved`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 3: MLBAPIClient - Get Teams
  // ========================================
  console.log('TEST 3: Get All Teams (via BaseSportAPI interface)');
  try {
    const teams = await mlbClient.getTeams();
    
    if (teams && teams.length > 0) {
      console.log(`✅ PASS: Retrieved ${teams.length} teams`);
      console.log(`   Sample: ${teams[0].name} (${teams[0].abbreviation})`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: No teams retrieved`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 4: MLBAPIClient - Get Team Info
  // ========================================
  console.log('TEST 4: Get Team Info (via BaseSportAPI)');
  try {
    const teamInfo = await mlbClient.getTeamInfo(147); // Yankees
    
    if (teamInfo && teamInfo.name) {
      console.log(`✅ PASS: Retrieved info for ${teamInfo.name}`);
      console.log(`   Location: ${teamInfo.locationName}`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: No team info retrieved`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 5: MLBComparison - Class-based API
  // ========================================
  console.log('TEST 5: MLBComparison Class (new OOP API)');
  try {
    const comparison = new MLBComparison(mlbClient);
    const result = await comparison.comparePlayers(
      TEST_PLAYER_1_ID,
      TEST_PLAYER_2_ID,
      TEST_SEASON,
      'hitting'
    );
    
    if (result && result.player1 && result.player2) {
      console.log(`✅ PASS: Compared ${result.player1.name} vs ${result.player2.name}`);
      console.log(`   Winner: ${result.overallWinner === 'player1' ? result.player1.name : result.player2.name}`);
      console.log(`   Categories compared: ${result.comparison.length}`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: Comparison failed`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 6: Legacy Function API (Backwards Compatibility)
  // ========================================
  console.log('TEST 6: Legacy comparePlayers Function (backwards compatibility)');
  try {
    const result = await comparePlayers(
      mlbClient,
      TEST_PLAYER_1_ID,
      TEST_PLAYER_2_ID,
      TEST_SEASON,
      'hitting'
    );
    
    if (result && result.player1 && result.player2) {
      console.log(`✅ PASS: Legacy function still works`);
      console.log(`   Compared: ${result.player1.name} vs ${result.player2.name}`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: Legacy function failed`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 7: Format Comparison Result
  // ========================================
  console.log('TEST 7: Format Comparison Result (output formatting)');
  try {
    const result = await comparePlayers(
      mlbClient,
      TEST_PLAYER_1_ID,
      TEST_PLAYER_2_ID,
      TEST_SEASON,
      'hitting'
    );
    
    const formatted = formatComparisonResult(result);
    
    if (formatted && formatted.includes('PLAYER COMPARISON')) {
      console.log(`✅ PASS: Formatting works correctly`);
      console.log('   Sample output:');
      const lines = formatted.split('\n').slice(0, 5);
      lines.forEach(line => console.log(`   ${line}`));
      testsPass++;
    } else {
      console.log(`❌ FAIL: Formatting failed`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // TEST 8: MLBAPIClient - Original Methods Still Work
  // ========================================
  console.log('TEST 8: Original MLB Methods (getAllTeams, searchMLBPlayers)');
  try {
    // Test original getAllTeams method
    const allTeams = await mlbClient.getAllTeams();
    
    // Test searchMLBPlayers (renamed from searchPlayers)
    const playerResults = await mlbClient.searchMLBPlayers(TEST_PLAYER_2);
    
    if (allTeams && allTeams.length > 0 && playerResults && playerResults.people) {
      console.log(`✅ PASS: Original MLB methods still work`);
      console.log(`   getAllTeams: ${allTeams.length} teams`);
      console.log(`   searchMLBPlayers: ${playerResults.people.length} results`);
      testsPass++;
    } else {
      console.log(`❌ FAIL: Original methods not working`);
      testsFail++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFail++;
  }
  console.log('');

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testsPass + testsFail}`);
  console.log(`✅ Passed: ${testsPass}`);
  console.log(`❌ Failed: ${testsFail}`);
  console.log('');

  if (testsFail === 0) {
    console.log('🎉 ALL TESTS PASSED! Phase 1 refactoring is successful.');
    console.log('');
    console.log('✅ MLB functionality preserved');
    console.log('✅ Base classes working correctly');
    console.log('✅ Backwards compatibility maintained');
    console.log('✅ Ready for Phase 2 (NBA implementation)');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('');
  console.error('='.repeat(80));
  console.error('FATAL ERROR');
  console.error('='.repeat(80));
  console.error(error);
  process.exit(1);
});
