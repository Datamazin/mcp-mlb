#!/usr/bin/env node

/**
 * Quick Fielding Comparison
 * Fetches and compares fielding stats between two players
 */

const fetch = globalThis.fetch;

async function getFieldingStats(playerId, playerName) {
  console.error(`Fetching fielding stats for ${playerName}...`);
  const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=career&group=fielding`);
  const data = await response.json();
  
  if (!data.stats || data.stats.length === 0) {
    throw new Error(`No fielding stats found for ${playerName}`);
  }
  
  const fieldingData = data.stats[0];
  if (!fieldingData.splits || fieldingData.splits.length === 0) {
    throw new Error(`No fielding data available for ${playerName}`);
  }
  
  return {
    name: playerName,
    stats: fieldingData.splits[0].stat,
    position: fieldingData.splits[0].stat.position?.name || 'Unknown'
  };
}

async function compareFielding(player1Id, player1Name, player2Id, player2Name) {
  const [p1, p2] = await Promise.all([
    getFieldingStats(player1Id, player1Name),
    getFieldingStats(player2Id, player2Name)
  ]);
  
  console.log('\n' + '='.repeat(80));
  console.log(`FIELDING COMPARISON: ${p1.name} vs ${p2.name}`);
  console.log('='.repeat(80) + '\n');
  
  console.log(`Position: ${p1.name} (${p1.position}) vs ${p2.name} (${p2.position})\n`);
  
  const metrics = [
    { key: 'fielding', name: 'Fielding %', higherIsBetter: true },
    { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
    { key: 'putOuts', name: 'Putouts', higherIsBetter: true },
    { key: 'assists', name: 'Assists', higherIsBetter: true },
    { key: 'errors', name: 'Errors', higherIsBetter: false },
    { key: 'doublePlays', name: 'Double Plays', higherIsBetter: true },
    { key: 'rangeFactorPerGame', name: 'Range Factor/Game', higherIsBetter: true }
  ];
  
  let p1Wins = 0;
  let p2Wins = 0;
  
  metrics.forEach(metric => {
    const v1 = parseFloat(p1.stats[metric.key]) || 0;
    const v2 = parseFloat(p2.stats[metric.key]) || 0;
    
    let winner;
    if (v1 > v2) {
      winner = metric.higherIsBetter ? p1.name : p2.name;
      if (metric.higherIsBetter) p1Wins++; else p2Wins++;
    } else if (v2 > v1) {
      winner = metric.higherIsBetter ? p2.name : p1.name;
      if (metric.higherIsBetter) p2Wins++; else p1Wins++;
    } else {
      winner = 'TIE';
    }
    
    console.log(`${metric.name}:`);
    console.log(`  ${p1.name}: ${v1}`);
    console.log(`  ${p2.name}: ${v2}`);
    console.log(`  Winner: ${winner}\n`);
  });
  
  console.log('='.repeat(80));
  console.log(`SUMMARY: ${p1Wins > p2Wins ? p1.name : p2Wins > p1Wins ? p2.name : 'TIE'} leads in ${Math.max(p1Wins, p2Wins)} out of ${metrics.length} key fielding categories.`);
  console.log('='.repeat(80) + '\n');
  
  // Additional context
  console.log('Additional Stats:');
  console.log(`  ${p1.name}: ${p1.stats.innings} innings, ${p1.stats.chances} total chances`);
  console.log(`  ${p2.name}: ${p2.stats.innings} innings, ${p2.stats.chances} total chances`);
}

// Main
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('Usage: node compare-fielding.cjs <player1Id> "Player 1 Name" <player2Id> "Player 2 Name"');
  process.exit(1);
}

const [p1Id, p1Name, p2Id, p2Name] = args;

console.log('\n🧤 FIELDING COMPARISON TOOL');
console.log('━'.repeat(80) + '\n');

compareFielding(parseInt(p1Id), p1Name, parseInt(p2Id), p2Name)
  .then(() => console.log('\n✅ Fielding comparison complete!\n'))
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
