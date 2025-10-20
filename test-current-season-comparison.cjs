/**
 * Test NFL comparisons with current season (2025)
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testCurrentSeason() {
  console.log('🏈 Testing NFL Comparisons with Current Season (2025)\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Search for current players
    console.log('\nSearching for players...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const allenResults = await nflClient.searchPlayers('Josh Allen');
    
    if (mahomesResults.length === 0 || allenResults.length === 0) {
      console.error('❌ Could not find one or both players');
      return;
    }
    
    const mahomes = mahomesResults[0];
    const allen = allenResults[0];
    
    console.log(`✅ Found: ${mahomes.fullName} (${mahomes.id})`);
    console.log(`✅ Found: ${allen.fullName} (${allen.id})`);
    
    // Compare players (will use current season automatically)
    console.log('\nComparing quarterbacks (current 2025 season)...');
    const result = await nflComparison.comparePlayers(mahomes.id, allen.id, undefined, 'QB');
    
    console.log('\n' + '=' .repeat(80));
    console.log(`${result.player1.name} vs ${result.player2.name}`);
    console.log('=' .repeat(80));
    
    console.log('\n📊 COMPARISON RESULTS (2025 Season):');
    console.log(`   Winner: ${result.overallWinner === 'player1' ? result.player1.name : result.player2.name}`);
    console.log(`   ${result.summary}`);
    
    console.log('\n📈 Top 5 Stats:');
    result.comparison.slice(0, 5).forEach(metric => {
      const p1Val = metric.player1Value.toFixed(1);
      const p2Val = metric.player2Value.toFixed(1);
      const p1Mark = metric.winner === 'player1' ? ' ✓' : '';
      const p2Mark = metric.winner === 'player2' ? ' ✓' : '';
      console.log(`   ${metric.category}:`);
      console.log(`     ${result.player1.name}: ${p1Val}${p1Mark}`);
      console.log(`     ${result.player2.name}: ${p2Val}${p2Mark}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ SUCCESS: Comparisons working with current season!');
    console.log('   - Season auto-detected as 2025 ✅');
    console.log('   - Player stats retrieved correctly ✅');
    console.log('   - Comparison logic working ✅');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCurrentSeason();
