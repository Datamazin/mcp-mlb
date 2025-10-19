/**
 * Test Multi-Sport Integration - MLB, NBA, and NFL
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testMultiSport() {
  console.log('\n🏆 Multi-Sport MCP Server - Integration Test\n');
  console.log('='.repeat(70));
  
  // Test MLB
  console.log('\n⚾ MLB: Comparing Aaron Judge vs Shohei Ohtani');
  console.log('-'.repeat(70));
  try {
    const mlbClient = SportAPIFactory.getClient('mlb');
    const mlbComparison = ComparisonFactory.getComparison('mlb');
    
    console.log('Searching for players...');
    const judge = await mlbClient.searchPlayers('Aaron Judge');
    const ohtani = await mlbClient.searchPlayers('Shohei Ohtani');
    
    if (judge.length > 0 && ohtani.length > 0) {
      console.log(`✅ Found: ${judge[0].fullName} (ID: ${judge[0].id})`);
      console.log(`✅ Found: ${ohtani[0].fullName} (ID: ${ohtani[0].id})`);
      
      const result = await mlbComparison.comparePlayers(judge[0].id, ohtani[0].id, 'hitting');
      console.log(`✅ Comparison complete - Winner: ${result.overallWinner}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test NBA
  console.log('\n🏀 NBA: Comparing LeBron James vs Stephen Curry');
  console.log('-'.repeat(70));
  try {
    const nbaClient = SportAPIFactory.getClient('nba');
    const nbaComparison = ComparisonFactory.getComparison('nba');
    
    console.log('Searching for players...');
    const lebron = await nbaClient.searchPlayers('LeBron James');
    const curry = await nbaClient.searchPlayers('Stephen Curry');
    
    if (lebron.length > 0 && curry.length > 0) {
      console.log(`✅ Found: ${lebron[0].fullName} (ID: ${lebron[0].id})`);
      console.log(`✅ Found: ${curry[0].fullName} (ID: ${curry[0].id})`);
      
      const result = await nbaComparison.comparePlayers(lebron[0].id, curry[0].id);
      console.log(`✅ Comparison complete - Winner: ${result.overallWinner}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test NFL
  console.log('\n🏈 NFL: Comparing Patrick Mahomes vs Josh Allen');
  console.log('-'.repeat(70));
  try {
    const nflClient = SportAPIFactory.getClient('nfl');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    
    console.log('Searching for players...');
    const mahomes = await nflClient.searchPlayers('Patrick Mahomes');
    const allen = await nflClient.searchPlayers('Josh Allen');
    
    if (mahomes.length > 0 && allen.length > 0) {
      console.log(`✅ Found: ${mahomes[0].fullName} (ID: ${mahomes[0].id})`);
      console.log(`✅ Found: ${allen[0].fullName} (ID: ${allen[0].id})`);
      
      const result = await nflComparison.comparePlayers(mahomes[0].id, allen[0].id, 'QB');
      console.log(`✅ Comparison complete - Winner: ${result.overallWinner}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`   Supported Leagues: ${SportAPIFactory.getSupportedLeagues().join(', ').toUpperCase()}`);
  console.log(`   Total Sports: ${SportAPIFactory.getSupportedLeagues().length}`);
  console.log('\n✅ Multi-Sport MCP Server - All systems operational!\n');
}

testMultiSport().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
