/**
 * Compare Patrick Mahomes to Joe Flacco using the working ESPN NFL API endpoints
 */

const fetch = globalThis.fetch;

const TEAM_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34
];

async function searchPlayer(name) {
  console.log(`\n🔍 Searching for: ${name}...`);
  
  // Search through all team rosters
  for (const teamId of TEAM_IDS) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.athletes) {
        for (const position of data.athletes) {
          for (const athlete of position.items) {
            if (athlete.displayName.toLowerCase().includes(name.toLowerCase())) {
              return {
                id: athlete.id,
                fullName: athlete.displayName,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                teamId: teamId
              };
            }
          }
        }
      }
    } catch (error) {
      // Continue to next team
    }
  }
  
  return null;
}

async function getPlayerStats(playerId) {
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${playerId}/statistics/0?lang=en&region=us`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract stats from the splits.categories structure
    const stats = {};
    if (data.splits?.categories) {
      for (const category of data.splits.categories) {
        for (const stat of category.stats) {
          stats[stat.name] = {
            value: stat.value,
            displayValue: stat.displayValue,
            rank: stat.rank,
            rankDisplayValue: stat.rankDisplayValue
          };
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error.message);
    return {};
  }
}

function displayComparison(player1, player2, stats1, stats2) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${player1.fullName} vs ${player2.fullName}`);
  console.log('='.repeat(80));
  
  // Passing stats
  console.log('\n📊 PASSING STATS:');
  console.log('-'.repeat(80));
  
  const passingMetrics = [
    { key: 'completions', label: 'Completions' },
    { key: 'attempts', label: 'Attempts' },
    { key: 'completionPct', label: 'Completion %' },
    { key: 'passingYards', label: 'Passing Yards' },
    { key: 'yardsPerPassAttempt', label: 'Yards/Attempt' },
    { key: 'passingTouchdowns', label: 'Passing TDs' },
    { key: 'interceptions', label: 'Interceptions' },
    { key: 'QBRating', label: 'QB Rating' }
  ];
  
  let p1Wins = 0;
  let p2Wins = 0;
  
  for (const metric of passingMetrics) {
    const val1 = stats1[metric.key];
    const val2 = stats2[metric.key];
    
    if (val1 && val2) {
      const v1 = val1.value;
      const v2 = val2.value;
      
      // For interceptions, lower is better
      const better = metric.key === 'interceptions' 
        ? (v1 < v2 ? 1 : v1 > v2 ? 2 : 0)
        : (v1 > v2 ? 1 : v1 < v2 ? 2 : 0);
      
      if (better === 1) p1Wins++;
      if (better === 2) p2Wins++;
      
      const winner = better === 1 ? '✓' : better === 2 ? ' ' : '=';
      const loser = better === 2 ? '✓' : better === 1 ? ' ' : '=';
      
      console.log(`${winner} ${metric.label.padEnd(20)} ${val1.displayValue.padStart(10)} ${loser}`);
      console.log(`  ${' '.repeat(20)} ${val2.displayValue.padStart(10)}`);
      console.log();
    }
  }
  
  console.log('='.repeat(80));
  console.log('\n🏆 OVERALL WINNER:');
  if (p1Wins > p2Wins) {
    console.log(`   ${player1.fullName} (${p1Wins} categories won)`);
  } else if (p2Wins > p1Wins) {
    console.log(`   ${player2.fullName} (${p2Wins} categories won)`);
  } else {
    console.log(`   TIE (${p1Wins}-${p2Wins})`);
  }
  console.log('='.repeat(80));
}

async function main() {
  const [,, name1, name2] = process.argv;
  
  if (!name1 || !name2) {
    console.log('Usage: node compare-mahomes-flacco-v2.cjs "Player 1" "Player 2"');
    console.log('Example: node compare-mahomes-flacco-v2.cjs "Patrick Mahomes" "Joe Flacco"');
    process.exit(1);
  }
  
  // Search for both players
  const player1 = await searchPlayer(name1);
  const player2 = await searchPlayer(name2);
  
  if (!player1) {
    console.log(`❌ Could not find player: ${name1}`);
    process.exit(1);
  }
  
  if (!player2) {
    console.log(`❌ Could not find player: ${name2}`);
    process.exit(1);
  }
  
  console.log(`✅ Found: ${player1.fullName} (ID: ${player1.id})`);
  console.log(`✅ Found: ${player2.fullName} (ID: ${player2.id})`);
  
  // Get stats for both players
  console.log('\n📈 Fetching statistics...');
  const stats1 = await getPlayerStats(player1.id);
  const stats2 = await getPlayerStats(player2.id);
  
  // Display comparison
  displayComparison(player1, player2, stats1, stats2);
}

main().catch(console.error);
