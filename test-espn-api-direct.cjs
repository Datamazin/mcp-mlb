/**
 * Test direct ESPN API calls to see what's available
 */

async function testDirectAPI() {
  console.log('Testing ESPN NFL API directly...\n');
  
  const mahomesId = '3139477';
  
  // Test 2024
  console.log('1. Testing 2024 season:');
  const url2024 = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
  console.log(`   URL: ${url2024}`);
  
  try {
    const response = await fetch(url2024);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Data found!`);
      console.log(`   Splits available: ${data.splits ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2023
  console.log('\n2. Testing 2023 season:');
  const url2023 = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2023/types/2/athletes/${mahomesId}/statistics/0?lang=en&region=us`;
  console.log(`   URL: ${url2023}`);
  
  try {
    const response = await fetch(url2023);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Data found!`);
      console.log(`   Splits available: ${data.splits ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

testDirectAPI();
