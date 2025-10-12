/**
 * Debug Aaron Judge Monthly Data
 * 
 * This script examines the raw API response to understand how months are actually coded.
 */

async function debugJudgeMonthlyData() {
  const baseUrl = 'https://statsapi.mlb.com/api';
  const judgeId = 592450;
  const url = `${baseUrl}/v1/people/${judgeId}/stats?stats=byMonth&season=2024&gameType=R`;
  
  console.log('=== Debugging Aaron Judge Monthly Data ===\n');
  console.log(`API URL: ${url}\n`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('Raw API Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.stats && data.stats[0] && data.stats[0].splits) {
      console.log('\n=== Analyzing Split Data ===');
      
      data.stats[0].splits.forEach((split, index) => {
        console.log(`\nSplit ${index + 1}:`);
        console.log(`  Full split object:`, JSON.stringify(split.split || 'No split info', null, 2));
        console.log(`  Games: ${split.stat.gamesPlayed}`);
        console.log(`  At Bats: ${split.stat.atBats}`);
        console.log(`  Description: ${split.split ? split.split.description : 'No description'}`);
      });
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Run the debug
debugJudgeMonthlyData().catch(console.error);