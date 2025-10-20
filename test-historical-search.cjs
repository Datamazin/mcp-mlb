/**
 * Test the enhanced global player search for historical NFL players
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');

async function testHistoricalSearch() {
  console.log('🔍 Testing Enhanced NFL Player Search (Current + Historical)\n');
  console.log('=' .repeat(80));
  
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    
    // Test search for Barry Sanders
    console.log('\n1. Searching for Barry Sanders...');
    const sandersResults = await nflClient.searchPlayers('Barry Sanders');
    console.log(`   Found ${sandersResults.length} results:`);
    sandersResults.forEach((player, i) => {
      console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
    });
    
    // Test search for Franco Harris  
    console.log('\n2. Searching for Franco Harris...');
    const harrisResults = await nflClient.searchPlayers('Franco Harris');
    console.log(`   Found ${harrisResults.length} results:`);
    harrisResults.forEach((player, i) => {
      console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
    });
    
    // Test search for a current player (Mahomes)
    console.log('\n3. Searching for Patrick Mahomes (current player)...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    console.log(`   Found ${mahomesResults.length} results:`);
    mahomesResults.forEach((player, i) => {
      console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
    });
    
    // Test search for Tom Brady (recently retired)
    console.log('\n4. Searching for Tom Brady (recently retired)...');
    const bradyResults = await nflClient.searchPlayers('Tom Brady');
    console.log(`   Found ${bradyResults.length} results:`);
    bradyResults.forEach((player, i) => {
      console.log(`     ${i + 1}. ${player.fullName} (ID: ${player.id})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Enhanced search test complete!');
    
    // If we found both legends, try to get their IDs for future comparison
    if (sandersResults.length > 0 && harrisResults.length > 0) {
      console.log('\n🎯 Players found for comparison:');
      console.log(`   Barry Sanders ID: ${sandersResults[0].id}`);
      console.log(`   Franco Harris ID: ${harrisResults[0].id}`);
      console.log('\n   Ready for statistical comparison!');
    }
    
  } catch (error) {
    console.error('❌ Error during enhanced search test:', error);
  }
}

testHistoricalSearch().catch(console.error);