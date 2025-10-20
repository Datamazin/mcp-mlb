/**
 * Test player name resolution in NFL comparisons
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testPlayerNames() {
  console.log('🏈 Testing NFL Player Name Resolution\n');
  console.log('=' .repeat(80));
  
  try {
    // Get NFL API client and comparison
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Search for players
    console.log('\n1. Searching for players...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const flaccoResults = await nflClient.searchPlayers('Joe Flacco');
    
    if (mahomesResults.length === 0 || flaccoResults.length === 0) {
      console.error('❌ Could not find one or both players');
      return;
    }
    
    const mahomes = mahomesResults[0];
    const flacco = flaccoResults[0];
    
    console.log(`   ✅ Found: ${mahomes.fullName} (ID: ${mahomes.id})`);
    console.log(`   ✅ Found: ${flacco.fullName} (ID: ${flacco.id})`);
    
    // Get player stats and check names
    console.log('\n2. Fetching player stats...');
    const mahomesStats = await nflClient.getPlayerStats(mahomes.id);
    const flaccoStats = await nflClient.getPlayerStats(flacco.id);
    
    console.log(`   Mahomes stats playerName: ${mahomesStats.playerName || 'NOT SET'}`);
    console.log(`   Flacco stats playerName: ${flaccoStats.playerName || 'NOT SET'}`);
    
    // Perform comparison
    console.log('\n3. Comparing players...');
    const result = await nflComparison.comparePlayers(mahomes.id, flacco.id, 'QB');
    
    console.log('\n' + '=' .repeat(80));
    console.log(`${result.player1Name} vs ${result.player2Name}`);
    console.log('=' .repeat(80));
    
    console.log('\n📊 COMPARISON RESULTS:');
    console.log(`   Player 1: ${result.player1Name}`);
    console.log(`   Player 2: ${result.player2Name}`);
    console.log(`   Winner: ${result.winner === 'player1' ? result.player1Name : result.winner === 'player2' ? result.player2Name : 'TIE'}`);
    console.log(`   Score: ${result.player1Wins}-${result.player2Wins}${result.ties > 0 ? ` (${result.ties} ties)` : ''}`);
    
    console.log('\n📈 Key Metrics:');
    result.metrics.slice(0, 5).forEach(metric => {
      const p1Val = metric.player1Value !== null && metric.player1Value !== undefined ? metric.player1Value.toFixed(1) : 'N/A';
      const p2Val = metric.player2Value !== null && metric.player2Value !== undefined ? metric.player2Value.toFixed(1) : 'N/A';
      const winner = metric.winner === 'player1' ? '✓' : metric.winner === 'player2' ? '✓' : '=';
      console.log(`   ${metric.name}: ${p1Val} ${metric.winner === 'player1' ? '✓' : ' '} | ${p2Val} ${metric.winner === 'player2' ? '✓' : ' '}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    
    if (result.player1Name !== `Player ${mahomes.id}` && result.player2Name !== `Player ${flacco.id}`) {
      console.log('\n✅ SUCCESS: Player names are showing correctly!');
    } else {
      console.log('\n❌ ISSUE: Player names still showing as "Player {id}"');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testPlayerNames();
