/**
 * Compare NFL Players using known IDs
 * 
 * Patrick Mahomes: 3139477
 * Joe Flacco: 11252
 */

const { NFLAPIClient } = require('./build/api/nfl-api.js');
const { NFLComparison } = require('./build/comparison/nfl-comparison.js');

async function compareQBs() {
  const client = new NFLAPIClient();
  const comparison = new NFLComparison(client);
  
  console.log('\n🏈 Comparing NFL Quarterbacks\n');
  console.log('Patrick Mahomes vs Joe Flacco');
  console.log('━'.repeat(80));
  console.log('');
  
  try {
    // Compare using player IDs
    console.log('\nComparing...\n');
    const result = await comparison.comparePlayers(3139477, 11252, 'QB');
    
    // Display results
    console.log(`\n📊 Comparison Results\n`);
    console.log('Result structure:', JSON.stringify(result, null, 2));
    
    if (!result) {
      console.error('❌ No comparison result received');
      return;
    }
    
    console.log(`Player 1: ${result.player1Name || 'Unknown'}`);
    console.log(`Player 2: ${result.player2Name || 'Unknown'}\n`);
    
    // Display metrics
    if (result.metrics && Array.isArray(result.metrics)) {
      console.log('\n📈 Metric Comparison:\n');
      for (const metric of result.metrics) {
        const winner = metric.winner === 1 ? '🏆' : metric.winner === 2 ? '🏆' : '🤝';
        const winnerName = metric.winner === 1 ? ' (Mahomes wins)' : metric.winner === 2 ? ' (Flacco wins)' : ' (tie)';
        console.log(`${metric.metric}: ${metric.player1Value} vs ${metric.player2Value} ${winner}${winnerName}`);
      }
    }
    
    // Overall winner
    console.log(`\n${'='.repeat(80)}`);
    const overallWinner = result.overallWinner === 1 ? '🎉 Patrick Mahomes' : result.overallWinner === 2 ? '🎉 Joe Flacco' : '🤝 Tie';
    console.log(`\n🏆 Overall Winner: ${overallWinner}`);
    console.log(`   Score: ${result.player1Score} - ${result.player2Score}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

compareQBs();
