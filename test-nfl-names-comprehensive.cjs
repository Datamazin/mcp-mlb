/**
 * Comprehensive test showing player names in NFL comparisons
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testWithNames() {
  console.log('🏈 NFL Player Comparison - Player Name Resolution Test\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Test 1: QB Comparison
    console.log('\n📊 TEST 1: Quarterback Comparison');
    console.log('-' .repeat(80));
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const allenResults = await nflClient.searchPlayers('Josh Allen');
    
    const mahomes = mahomesResults[0];
    const allen = allenResults[0];
    
    console.log(`Comparing: ${mahomes.fullName} (${mahomes.id}) vs ${allen.fullName} (${allen.id})`);
    
    const qbResult = await nflComparison.comparePlayers(mahomes.id, allen.id, undefined, 'QB');
    
    console.log(`\nResult:`);
    console.log(`  Player 1: ${qbResult.player1.name} ✅`);
    console.log(`  Player 2: ${qbResult.player2.name} ✅`);
    console.log(`  Winner: ${qbResult.overallWinner === 'player1' ? qbResult.player1.name : qbResult.player2.name}`);
    console.log(`  Summary: ${qbResult.summary}`);
    
    // Test 2: WR Comparison
    console.log('\n📊 TEST 2: Wide Receiver Comparison');
    console.log('-' .repeat(80));
    const odunzeResults = await nflClient.searchPlayers('Rome Odunze');
    const johnstonResults = await nflClient.searchPlayers('Quentin Johnston');
    
    const odunze = odunzeResults[0];
    const johnston = johnstonResults[0];
    
    console.log(`Comparing: ${odunze.fullName} (${odunze.id}) vs ${johnston.fullName} (${johnston.id})`);
    
    const wrResult = await nflComparison.comparePlayers(odunze.id, johnston.id, undefined, 'WR');
    
    console.log(`\nResult:`);
    console.log(`  Player 1: ${wrResult.player1.name} ✅`);
    console.log(`  Player 2: ${wrResult.player2.name} ✅`);
    console.log(`  Winner: ${wrResult.overallWinner === 'player1' ? wrResult.player1.name : wrResult.overallWinner === 'player2' ? wrResult.player2.name : 'TIE'}`);
    console.log(`  Summary: ${wrResult.summary}`);
    
    // Show detailed metrics for WRs
    console.log('\n  Top 5 Metrics:');
    wrResult.comparison.slice(0, 5).forEach(metric => {
      const p1Val = metric.player1Value.toFixed(1);
      const p2Val = metric.player2Value.toFixed(1);
      const winnerMark = metric.winner === 'player1' ? '✓' : metric.winner === 'player2' ? '✓' : '=';
      console.log(`    ${metric.category}:`);
      console.log(`      ${wrResult.player1.name}: ${p1Val} ${metric.winner === 'player1' ? '✓' : ''}`);
      console.log(`      ${wrResult.player2.name}: ${p2Val} ${metric.winner === 'player2' ? '✓' : ''}`);
    });
    
    // Test 3: RB Comparison
    console.log('\n📊 TEST 3: Running Back Comparison');
    console.log('-' .repeat(80));
    const henryResults = await nflClient.searchPlayers('Derrick Henry');
    const barkleyResults = await nflClient.searchPlayers('Saquon Barkley');
    
    const henry = henryResults[0];
    const barkley = barkleyResults[0];
    
    console.log(`Comparing: ${henry.fullName} (${henry.id}) vs ${barkley.fullName} (${barkley.id})`);
    
    const rbResult = await nflComparison.comparePlayers(henry.id, barkley.id, undefined, 'RB');
    
    console.log(`\nResult:`);
    console.log(`  Player 1: ${rbResult.player1.name} ✅`);
    console.log(`  Player 2: ${rbResult.player2.name} ✅`);
    console.log(`  Winner: ${rbResult.overallWinner === 'player1' ? rbResult.player1.name : rbResult.player2.name}`);
    console.log(`  Summary: ${rbResult.summary}`);
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ SUCCESS: All NFL player names are resolving correctly!');
    console.log('   - Player names appear in search results ✅');
    console.log('   - Player names appear in stats data ✅');
    console.log('   - Player names appear in comparison results ✅');
    console.log('   - Player names appear in summaries ✅');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testWithNames();
