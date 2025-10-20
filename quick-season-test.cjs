/**
 * Quick test - what season are we detecting and does it have data?
 */

async function quickTest() {
  // Replicate the season detection logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  console.log(`Current Date: ${now.toISOString().split('T')[0]}`);
  console.log(`Year: ${currentYear}, Month: ${currentMonth}\n`);
  
  let detectedSeason;
  if (currentMonth >= 8) {
    detectedSeason = currentYear;
  } else if (currentMonth <= 2) {
    detectedSeason = currentYear - 1;
  } else {
    detectedSeason = currentYear - 1;
  }
  
  console.log(`Detected Season: ${detectedSeason}\n`);
  
  // Test Mahomes with detected season
  const mahomesId = '3139477';
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${detectedSeason}/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
  
  console.log(`Testing URL: ${url}\n`);
  
  const response = await fetch(url);
  console.log(`Status: ${response.status} ${response.statusText}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ SUCCESS - Data found for ${detectedSeason} season!`);
    
    if (data.splits?.categories) {
      for (const cat of data.splits.categories) {
        const yards = cat.stats?.find(s => s.name === 'passingYards');
        if (yards) {
          console.log(`Passing Yards: ${yards.value}`);
          break;
        }
      }
    }
  } else {
    console.log(`❌ FAIL - No data for ${detectedSeason} season`);
    console.log(`Try 2024 instead...`);
    
    const url2024 = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
    const response2024 = await fetch(url2024);
    console.log(`2024 Status: ${response2024.status} ${response2024.statusText}`);
  }
}

quickTest();
