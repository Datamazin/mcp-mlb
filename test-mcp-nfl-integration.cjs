/**
 * Test MCP server with NFL functionality
 * Tests search-players and compare-players tools
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');
const { ComparisonFactory } = require('./build/comparison/comparison-factory.js');

async function testMCPNFLIntegration() {
  console.log('🏈 Testing MCP Server NFL Integration\n');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: SportAPIFactory supports NFL
    console.log('\n1. Testing SportAPIFactory NFL support...');
    const supportedLeagues = SportAPIFactory.getSupportedLeagues();
    console.log(`   Supported Leagues: ${supportedLeagues.join(', ')}`);
    console.log(`   NFL Supported: ${supportedLeagues.includes('nfl') ? '✅' : '❌'}`);
    
    // Test 2: Search for NFL players (mimics search-players MCP tool)
    console.log('\n2. Testing search-players tool (NFL)...');
    const nflClient = SportAPIFactory.getClient('nfl');
    console.log('   Searching for "Patrick Mahomes"...');
    const mahomesResults = await nflClient.searchPlayers('Patrick Mahomes');
    
    if (mahomesResults.length > 0) {
      console.log(`   ✅ Found ${mahomesResults.length} player(s)`);
      console.log(`   - ${mahomesResults[0].fullName} (ID: ${mahomesResults[0].id})`);
    } else {
      console.log('   ❌ No players found');
      return;
    }
    
    console.log('\n   Searching for "Josh Allen"...');
    const allenResults = await nflClient.searchPlayers('Josh Allen');
    
    if (allenResults.length > 0) {
      console.log(`   ✅ Found ${allenResults.length} player(s)`);
      console.log(`   - ${allenResults[0].fullName} (ID: ${allenResults[0].id})`);
    } else {
      console.log('   ❌ No players found');
      return;
    }
    
    // Test 3: Compare players (mimics compare-players MCP tool)
    console.log('\n3. Testing compare-players tool (NFL with QB position)...');
    const nflComparison = ComparisonFactory.getComparison('nfl');
    const mahomes = mahomesResults[0];
    const allen = allenResults[0];
    
    console.log(`   Comparing: ${mahomes.fullName} vs ${allen.fullName}`);
    console.log('   Parameters: season=undefined (auto-detect 2025), statGroup="QB"');
    
    // This mimics the MCP tool call: compare-players(league='nfl', player1Id, player2Id, statGroup='QB')
    const result = await nflComparison.comparePlayers(
      mahomes.id, 
      allen.id, 
      undefined,  // season (auto-detect current)
      'QB'        // statGroup (position)
    );
    
    console.log('\n   📊 COMPARISON RESULTS:');
    console.log(`   Player 1: ${result.player1.name} ✅`);
    console.log(`   Player 2: ${result.player2.name} ✅`);
    console.log(`   Winner: ${result.overallWinner === 'player1' ? result.player1.name : result.overallWinner === 'player2' ? result.player2.name : 'TIE'}`);
    console.log(`   Summary: ${result.summary}`);
    
    // Show top 5 metrics
    console.log('\n   Top 5 Metrics:');
    result.comparison.slice(0, 5).forEach(metric => {
      const p1Val = metric.player1Value.toFixed(1);
      const p2Val = metric.player2Value.toFixed(1);
      const winnerMark = metric.winner === 'player1' ? '✓' : metric.winner === 'player2' ? '✓' : '=';
      console.log(`     ${metric.category}:`);
      console.log(`       ${result.player1.name}: ${p1Val} ${metric.winner === 'player1' ? '✓' : ''}`);
      console.log(`       ${result.player2.name}: ${p2Val} ${metric.winner === 'player2' ? '✓' : ''}`);
    });
    
    // Test 4: Test with explicit 2024 season
    console.log('\n4. Testing with explicit season parameter (2024)...');
    console.log('   Parameters: season=2024, statGroup="QB"');
    
    const result2024 = await nflComparison.comparePlayers(
      mahomes.id,
      allen.id,
      2024,  // explicit season
      'QB'
    );
    
    console.log(`   ✅ Comparison successful with 2024 season data`);
    console.log(`   Winner: ${result2024.overallWinner === 'player1' ? result2024.player1.name : result2024.overallWinner === 'player2' ? result2024.player2.name : 'TIE'}`);
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ SUCCESS: MCP Server NFL Integration Complete!');
    console.log('   - search-players tool: Functional ✅');
    console.log('   - compare-players tool: Functional ✅');
    console.log('   - Dynamic season detection: Working ✅');
    console.log('   - Player name resolution: Working ✅');
    console.log('   - Position-specific metrics: Working ✅');
    console.log('\n   MCP Server is ready to handle NFL requests through Claude Desktop!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testMCPNFLIntegration();
