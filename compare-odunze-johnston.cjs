/**
 * Compare Rome Odunze to Quentin Johnston (WR stats)
 */

const fetch = globalThis.fetch;

async function compareWRs() {
  console.log('\n🏈 Comparing Wide Receivers: Rome Odunze vs Quentin Johnston\n');
  
  // Rome Odunze ID: 4431299
  // Quentin Johnston ID: 4429025
  
  const odunzeUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/4431299/statistics/0?lang=en&region=us';
  const johnstonUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/4429025/statistics/0?lang=en&region=us';
  
  const [odunzeRes, johnstonRes] = await Promise.all([
    fetch(odunzeUrl),
    fetch(johnstonUrl)
  ]);
  
  const odunze = await odunzeRes.json();
  const johnston = await johnstonRes.json();
  
  // Extract receiving stats
  function getReceivingStats(data) {
    const stats = {};
    if (data.splits?.categories) {
      for (const category of data.splits.categories) {
        if (category.name === 'receiving') {
          for (const stat of category.stats) {
            stats[stat.name] = stat;
          }
        }
      }
    }
    return stats;
  }
  
  const odunzeStats = getReceivingStats(odunze);
  const johnstonStats = getReceivingStats(johnston);
  
  console.log('='.repeat(80));
  console.log('Rome Odunze (CHI - Rookie) vs Quentin Johnston (LAC - 2nd Year)');
  console.log('='.repeat(80));
  console.log('\n📊 RECEIVING STATS (2024 Season):\n');
  console.log('METRIC                      Rome Odunze        Quentin Johnston');
  console.log('-'.repeat(80));
  
  const metrics = [
    { key: 'receivingReceptions', label: 'Receptions' },
    { key: 'receivingTargets', label: 'Targets' },
    { key: 'receivingYards', label: 'Receiving Yards' },
    { key: 'yardsPerReception', label: 'Yards/Reception' },
    { key: 'receivingTouchdowns', label: 'Touchdowns' },
    { key: 'longReception', label: 'Longest Reception' },
    { key: 'receivingYardsAfterCatch', label: 'Yards After Catch' }
  ];
  
  let odunzeWins = 0;
  let johnstonWins = 0;
  
  for (const metric of metrics) {
    const o = odunzeStats[metric.key];
    const j = johnstonStats[metric.key];
    
    if (o && j) {
      const winner = o.value > j.value ? '✓' : o.value < j.value ? ' ' : '=';
      const loser = o.value < j.value ? '✓' : o.value > j.value ? ' ' : '=';
      
      if (winner === '✓') odunzeWins++;
      if (loser === '✓') johnstonWins++;
      
      console.log(`${metric.label.padEnd(27)} ${(o.displayValue + ' ' + winner).padStart(15)} ${(j.displayValue + ' ' + loser).padStart(20)}`);
    }
  }
  
  console.log('='.repeat(80));
  console.log('\n🏆 WINNER:');
  if (odunzeWins > johnstonWins) {
    console.log(`   Rome Odunze wins ${odunzeWins}-${johnstonWins}`);
  } else if (johnstonWins > odunzeWins) {
    console.log(`   Quentin Johnston wins ${johnstonWins}-${odunzeWins}`);
  } else {
    console.log(`   TIE (${odunzeWins}-${johnstonWins})`);
  }
  console.log('='.repeat(80));
  console.log();
}

compareWRs().catch(console.error);
