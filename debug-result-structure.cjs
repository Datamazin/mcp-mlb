/**
 * Simple test to see the actual comparison result structure
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testResult() {
  console.log('🏈 Checking NFL Comparison Result Structure\n');
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    // Search for players
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    const flaccoResults = await nflClient.searchPlayers('Joe Flacco');
    
    const mahomes = mahomesResults[0];
    const flacco = flaccoResults[0];
    
    console.log(`Comparing: ${mahomes.fullName} vs ${flacco.fullName}\n`);
    
    // Perform comparison
    const result = await nflComparison.comparePlayers(mahomes.id, flacco.id, 'QB');
    
    console.log('Result structure:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testResult();
