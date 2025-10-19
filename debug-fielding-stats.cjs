#!/usr/bin/env node

const fetch = globalThis.fetch;

async function checkFieldingStats() {
  try {
    console.log('Fetching Pete Alonso career stats...\n');
    const response = await fetch('https://statsapi.mlb.com/api/v1/people/624413/stats?stats=career&season=2025&gameType=R');
    const data = await response.json();
    
    console.log('Available stat groups:');
    data.stats.forEach(stat => {
      console.log(`- ${stat.group.displayName} (${stat.type.displayName})`);
      if (stat.splits && stat.splits[0]) {
        console.log('  Sample stats:', Object.keys(stat.splits[0].stat).slice(0, 10).join(', '));
      }
    });

    console.log('\n\nFielding stats:');
    const fieldingStats = data.stats.find(s => s.group.displayName.toLowerCase().includes('fielding'));
    if (fieldingStats) {
      console.log(JSON.stringify(fieldingStats, null, 2));
    } else {
      console.log('No fielding stats found in career stats');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFieldingStats();
