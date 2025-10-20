/**
 * Test Josh Allen API call
 */

async function testJoshAllen() {
  console.log('Testing Josh Allen API...\n');
  
  const allenId = '3918298';
  
  // Test 2024
  console.log('Testing 2024 season:');
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${allenId}/statistics/0?lang=en&region=us`;
  console.log(`URL: ${url}\n`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Data found!`);
      console.log(`Splits available: ${data.splits ? 'Yes' : 'No'}`);
      
      if (data.splits?.categories) {
        console.log(`Categories: ${data.splits.categories.length}`);
        for (const cat of data.splits.categories) {
          const passingYards = cat.stats?.find(s => s.name === 'passingYards');
          if (passingYards) {
            console.log(`Passing Yards: ${passingYards.value}`);
          }
        }
      }
    } else {
      console.log(`❌ Not found`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testJoshAllen();
