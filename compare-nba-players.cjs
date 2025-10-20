/**
 * Compare NBA Players Example
 * 
 * Usage: node compare-nba-players.cjs "LeBron James" "Michael Jordan"
 */

const { NBAComparison } = require('./build/comparison/nba-comparison.js');

async function main() {
  const player1Name = process.argv[2];
  const player2Name = process.argv[3];

  if (!player1Name || !player2Name) {
    console.error('Usage: node compare-nba-players.cjs "Player 1 Name" "Player 2 Name"');
    console.error('Example: node compare-nba-players.cjs "LeBron James" "Michael Jordan"');
    process.exit(1);
  }

  try {
    console.log(`\n🏀 NBA PLAYER COMPARISON\n`);
    console.log(`Comparing: ${player1Name} vs ${player2Name}\n`);
    console.log('Fetching data from NBA.com Stats API...\n');

    const comparison = new NBAComparison();
    
    // Search for players
    console.log(`Searching for ${player1Name}...`);
    const player1Id = await comparison.searchPlayer(player1Name);
    
    if (!player1Id) {
      console.error(`❌ Error: Could not find player "${player1Name}"`);
      process.exit(1);
    }
    
    console.log(`Searching for ${player2Name}...`);
    const player2Id = await comparison.searchPlayer(player2Name);
    
    if (!player2Id) {
      console.error(`❌ Error: Could not find player "${player2Name}"`);
      process.exit(1);
    }

    // Compare players
    console.log('\nComparing career statistics...\n');
    const result = await comparison.comparePlayers(player1Id, player2Id);
    
    // Format and display results
    const formatted = comparison.formatComparisonResult(result);
    console.log(formatted);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
