/**
 * Test with explicit 2024 season
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function test2024Season() {
  console.log('🏈 Testing with Explicit 2024 Season\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    console.log('\nSearching for players...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const flaccoResults = await nflClient.searchPlayers('Joe Flacco');
    
    const mahomes = mahomesResults[0];
    const flacco = flaccoResults[0];
    
    console.log(`✅ Found: ${mahomes.fullName} (${mahomes.id})`);
    console.log(`✅ Found: ${flacco.fullName} (${flacco.id})`);
    
    // Compare with explicit 2024 season
    console.log('\nComparing with explicit season=2024...');
    const result = await nflComparison.comparePlayers(mahomes.id, flacco.id, 2024, 'QB');
    
    console.log('\n' + '=' .repeat(80));
    console.log(`${result.player1.name} vs ${result.player2.name}`);
    console.log('=' .repeat(80));
    
    console.log(`\nWinner: ${result.overallWinner === 'player1' ? result.player1.name : result.player2.name}`);
    console.log(`Summary: ${result.summary}`);
    
    console.log('\n✅ SUCCESS: Explicit season parameter works!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

test2024Season();
