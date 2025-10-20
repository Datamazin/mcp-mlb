/**
 * Inspect ESPN NFL API stat categories
 * Understand what categories are available
 */

async function inspectStatCategories() {
  console.log('🔍 Inspecting ESPN NFL Stat Categories\n');
  console.log('=' .repeat(80));
  
  // Test with different players to see category structure
  const players = [
    { id: '3139477', name: 'Patrick Mahomes', position: 'QB' },
    { id: '4241457', name: 'Derrick Henry', position: 'RB' },
    { id: '4361370', name: 'Rome Odunze', position: 'WR' }
  ];
  
  for (const player of players) {
    console.log(`\n📊 ${player.name} (${player.position}) - ID: ${player.id}`);
    console.log('-'.repeat(80));
    
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${player.id}/statistics/0?lang=en&region=us`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Examine the structure
      if (data.splits && data.splits.categories) {
        console.log(`   Categories Found: ${data.splits.categories.length}`);
        
        for (const category of data.splits.categories) {
          console.log(`\n   📁 Category: ${category.name || 'Unnamed'}`);
          console.log(`      Type: ${category.type || 'N/A'}`);
          console.log(`      Display Name: ${category.displayName || 'N/A'}`);
          
          if (category.stats && category.stats.length > 0) {
            console.log(`      Stats Count: ${category.stats.length}`);
            console.log(`      Sample Stats:`);
            
            // Show first 5 stats
            category.stats.slice(0, 5).forEach(stat => {
              console.log(`        - ${stat.name}: ${stat.value} (${stat.displayName})`);
            });
            
            if (category.stats.length > 5) {
              console.log(`        ... and ${category.stats.length - 5} more`);
            }
          }
        }
      } else {
        console.log('   ⚠️  No categories found in response');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n✅ Inspection Complete');
}

inspectStatCategories();
