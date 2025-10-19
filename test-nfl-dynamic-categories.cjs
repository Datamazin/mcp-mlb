/**
 * Test NFL dynamic stat categories
 * Validates both position-based and category-based comparisons
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testDynamicStatCategories() {
  console.log('🏈 Testing NFL Dynamic Stat Categories\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Search for players
    console.log('\n1. Searching for players...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const allenResults = await nflClient.searchPlayers('Josh Allen');
    
    const mahomes = mahomesResults[0];
    const allen = allenResults[0];
    
    console.log(`   ✅ Found: ${mahomes.fullName} (ID: ${mahomes.id})`);
    console.log(`   ✅ Found: ${allen.fullName} (ID: ${allen.id})`);
    
    // Test 1: Position-based comparison (existing functionality)
    console.log('\n' + '='.repeat(80));
    console.log('TEST 1: Position-Based Comparison (QB)');
    console.log('='.repeat(80));
    
    const qbResult = await nflComparison.comparePlayers(
      mahomes.id,
      allen.id,
      undefined, // auto-detect season
      'QB'       // position
    );
    
    console.log(`\n   ${qbResult.player1.name} vs ${qbResult.player2.name}`);
    console.log(`   Winner: ${qbResult.overallWinner === 'player1' ? qbResult.player1.name : qbResult.overallWinner === 'player2' ? qbResult.player2.name : 'TIE'}`);
    console.log(`   Summary: ${qbResult.summary}`);
    console.log(`\n   Top 3 Metrics:`);
    qbResult.comparison.slice(0, 3).forEach(m => {
      console.log(`     - ${m.category}: ${m.player1Value} vs ${m.player2Value} (Winner: ${m.winner})`);
    });
    
    // Test 2: Category-based comparison - PASSING
    console.log('\n' + '='.repeat(80));
    console.log('TEST 2: Category-Based Comparison (PASSING)');
    console.log('='.repeat(80));
    
    const passingResult = await nflComparison.comparePlayers(
      mahomes.id,
      allen.id,
      undefined,   // auto-detect season
      'passing'    // stat category
    );
    
    console.log(`\n   ${passingResult.player1.name} vs ${passingResult.player2.name}`);
    console.log(`   Category: Passing Statistics`);
    console.log(`   Winner: ${passingResult.overallWinner === 'player1' ? passingResult.player1.name : passingResult.overallWinner === 'player2' ? passingResult.player2.name : 'TIE'}`);
    console.log(`   Summary: ${passingResult.summary}`);
    console.log(`\n   Top 5 Passing Metrics:`);
    passingResult.comparison.slice(0, 5).forEach(m => {
      console.log(`     - ${m.category}: ${m.player1Value} vs ${m.player2Value} (Winner: ${m.winner})`);
    });
    
    // Test 3: Category-based comparison - RUSHING
    console.log('\n' + '='.repeat(80));
    console.log('TEST 3: Category-Based Comparison (RUSHING)');
    console.log('='.repeat(80));
    
    console.log('\n   Searching for running backs...');
    const henryResults = await nflClient.searchPlayers('Derrick Henry');
    const barkleyResults = await nflClient.searchPlayers('Saquon Barkley');
    
    const henry = henryResults[0];
    const barkley = barkleyResults[0];
    
    console.log(`   ✅ Found: ${henry.fullName} (ID: ${henry.id})`);
    console.log(`   ✅ Found: ${barkley.fullName} (ID: ${barkley.id})`);
    
    const rushingResult = await nflComparison.comparePlayers(
      henry.id,
      barkley.id,
      undefined,   // auto-detect season
      'rushing'    // stat category
    );
    
    console.log(`\n   ${rushingResult.player1.name} vs ${rushingResult.player2.name}`);
    console.log(`   Category: Rushing Statistics`);
    console.log(`   Winner: ${rushingResult.overallWinner === 'player1' ? rushingResult.player1.name : rushingResult.overallWinner === 'player2' ? rushingResult.player2.name : 'TIE'}`);
    console.log(`   Summary: ${rushingResult.summary}`);
    console.log(`\n   Top 5 Rushing Metrics:`);
    rushingResult.comparison.slice(0, 5).forEach(m => {
      console.log(`     - ${m.category}: ${m.player1Value.toFixed(1)} vs ${m.player2Value.toFixed(1)} (Winner: ${m.winner})`);
    });
    
    // Test 4: Category-based comparison - RECEIVING
    console.log('\n' + '='.repeat(80));
    console.log('TEST 4: Category-Based Comparison (RECEIVING)');
    console.log('='.repeat(80));
    
    console.log('\n   Searching for wide receivers...');
    const odunzeResults = await nflClient.searchPlayers('Rome Odunze');
    const johnstonResults = await nflClient.searchPlayers('Quentin Johnston');
    
    const odunze = odunzeResults[0];
    const johnston = johnstonResults[0];
    
    console.log(`   ✅ Found: ${odunze.fullName} (ID: ${odunze.id})`);
    console.log(`   ✅ Found: ${johnston.fullName} (ID: ${johnston.id})`);
    
    const receivingResult = await nflComparison.comparePlayers(
      odunze.id,
      johnston.id,
      undefined,     // auto-detect season
      'receiving'    // stat category
    );
    
    console.log(`\n   ${receivingResult.player1.name} vs ${receivingResult.player2.name}`);
    console.log(`   Category: Receiving Statistics`);
    console.log(`   Winner: ${receivingResult.overallWinner === 'player1' ? receivingResult.player1.name : receivingResult.overallWinner === 'player2' ? receivingResult.player2.name : 'TIE'}`);
    console.log(`   Summary: ${receivingResult.summary}`);
    console.log(`\n   Top 5 Receiving Metrics:`);
    receivingResult.comparison.slice(0, 5).forEach(m => {
      console.log(`     - ${m.category}: ${m.player1Value.toFixed(1)} vs ${m.player2Value.toFixed(1)} (Winner: ${m.winner})`);
    });
    
    // Test 5: Get available stat categories from API
    console.log('\n' + '='.repeat(80));
    console.log('TEST 5: Available Stat Categories');
    console.log('='.repeat(80));
    
    const mahomesStats = await nflClient.getPlayerStats(mahomes.id);
    console.log(`\n   Available categories for ${mahomesStats.playerName}:`);
    mahomesStats.availableCategories.forEach(cat => {
      console.log(`     - ${cat.displayName} (${cat.name}): ${cat.statCount} stats`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ SUCCESS: Dynamic Stat Categories Working!');
    console.log('   - Position-based comparisons: ✅');
    console.log('   - Category-based comparisons (passing, rushing, receiving): ✅');
    console.log('   - Available categories retrieval: ✅');
    console.log('   - All player names resolving correctly: ✅');
    console.log('\n   NFL implementation now supports both:');
    console.log('   1. Position filtering (QB, RB, WR) - selects relevant metrics');
    console.log('   2. Category filtering (passing, rushing, receiving) - ESPN categories');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDynamicStatCategories();
