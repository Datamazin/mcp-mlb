/**
 * Test NFL player search
 */

const { NFLAPIClient } = require('./build/api/nfl-api.js');

async function testSearch() {
  const client = new NFLAPIClient();
  
  console.log('\n🔍 Testing NFL Player Search\n');
  
  try {
    // Test search
    console.log('Searching for "Patrick Mahomes"...');
    const results = await client.searchPlayers('Patrick Mahomes');
    
    console.log(`\nFound ${results.length} results:\n`);
    results.forEach((player, index) => {
      console.log(`${index + 1}. ${player.fullName}`);
      console.log(`   ID: ${player.id}`);
      console.log(`   First: ${player.firstName}`);
      console.log(`   Last: ${player.lastName}`);
      console.log('');
    });
    
    // Test another search
    console.log('Searching for "Joe Flacco"...');
    const results2 = await client.searchPlayers('Joe Flacco');
    
    console.log(`\nFound ${results2.length} results:\n`);
    results2.forEach((player, index) => {
      console.log(`${index + 1}. ${player.fullName}`);
      console.log(`   ID: ${player.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSearch();
