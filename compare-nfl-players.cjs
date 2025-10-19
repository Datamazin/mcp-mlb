/**
 * Compare NFL Players - Test Script
 * 
 * Usage: node compare-nfl-players.cjs "Player 1 Name" "Player 2 Name"
 * Example: node compare-nfl-players.cjs "Patrick Mahomes" "Joe Flacco"
 */

const { NFLAPIClient } = require('./build/api/nfl-api.js');
const { NFLComparison } = require('./build/comparison/nfl-comparison.js');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node compare-nfl-players.cjs "Player 1 Name" "Player 2 Name"');
    console.error('Example: node compare-nfl-players.cjs "Patrick Mahomes" "Joe Flacco"');
    process.exit(1);
  }

  const player1Name = args[0];
  const player2Name = args[1];

  console.log(`\n🏈 Comparing NFL Players: ${player1Name} vs ${player2Name}\n`);
  console.log('━'.repeat(80));

  try {
    const apiClient = new NFLAPIClient();

    // Search for both players
    console.log(`\n🔍 Searching for "${player1Name}"...`);
    const player1Results = await apiClient.searchPlayers(player1Name);
    
    if (player1Results.length === 0) {
      console.error(`❌ No results found for "${player1Name}"`);
      process.exit(1);
    }

    console.log(`✅ Found ${player1Results.length} result(s):`);
    player1Results.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.team} (${p.position}) #${p.number || 'N/A'}`);
    });

    console.log(`\n🔍 Searching for "${player2Name}"...`);
    const player2Results = await apiClient.searchPlayers(player2Name);
    
    if (player2Results.length === 0) {
      console.error(`❌ No results found for "${player2Name}"`);
      process.exit(1);
    }

    console.log(`✅ Found ${player2Results.length} result(s):`);
    player2Results.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.team} (${p.position}) #${p.number || 'N/A'}`);
    });

    // Use first result for each player
    const player1 = player1Results[0];
    const player2 = player2Results[0];

    console.log(`\n📊 Comparing: ${player1.name} (${player1.position}) vs ${player2.name} (${player2.position})`);
    console.log('━'.repeat(80));

    // Compare players
    const comparison = new NFLComparison(apiClient);
    const result = await comparison.comparePlayers(player1.id, player2.id);

    // Display results
    console.log(`\n🏆 COMPARISON RESULTS\n`);
    
    console.log(`${result.player1.name} (${result.player1.team})`);
    console.log(`  Position: ${result.player1.position}`);
    console.log(`  Wins: ${result.player1Wins} categories\n`);
    
    console.log(`${result.player2.name} (${result.player2.team})`);
    console.log(`  Position: ${result.player2.position}`);
    console.log(`  Wins: ${result.player2Wins} categories\n`);

    console.log('━'.repeat(80));
    console.log('📈 CATEGORY BREAKDOWN\n');

    // Display each category
    result.categories.forEach((category, index) => {
      const winner = category.winner === 'player1' ? result.player1.name :
                     category.winner === 'player2' ? result.player2.name :
                     'Tie';
      
      const winnerIcon = category.winner === 'player1' ? '🏆' :
                        category.winner === 'player2' ? '🏆' :
                        '🤝';

      console.log(`${index + 1}. ${category.name}`);
      console.log(`   ${result.player1.name}: ${category.player1Value}`);
      console.log(`   ${result.player2.name}: ${category.player2Value}`);
      console.log(`   ${winnerIcon} Winner: ${winner}\n`);
    });

    console.log('━'.repeat(80));
    console.log('🎯 OVERALL WINNER\n');

    if (result.winner === 'player1') {
      console.log(`🏆 ${result.player1.name} wins! (${result.player1Wins} - ${result.player2Wins})`);
    } else if (result.winner === 'player2') {
      console.log(`🏆 ${result.player2.name} wins! (${result.player2Wins} - ${result.player1Wins})`);
    } else {
      console.log(`🤝 It's a tie! (${result.player1Wins} - ${result.player2Wins})`);
    }

    console.log('\n━'.repeat(80));
    console.log('\n✨ Comparison complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
