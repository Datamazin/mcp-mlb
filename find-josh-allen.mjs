#!/usr/bin/env node

/**
 * Find the correct Josh Allen (Bills QB)
 */

import { SportAPIFactory } from './build/api/sport-api-factory.js';

async function findJoshAllen() {
  console.log('🔍 Finding the correct Josh Allen (Bills QB)...\n');

  try {
    const nflApi = SportAPIFactory.getClient('nfl');
    
    // Search with different variations
    const searches = [
      "Josh Allen",
      "Joshua Allen",
      "Josh Allen QB",
      "Josh Allen Buffalo"
    ];
    
    for (const query of searches) {
      console.log(`\n🔎 Searching for: "${query}"`);
      try {
        const results = await nflApi.searchPlayers(query);
        console.log(`Found ${results.length} results:`);
        
        results.forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.name} (ID: ${player.id})`);
          if (player.team) console.log(`     Team: ${player.team}`);
          if (player.position) console.log(`     Position: ${player.position}`);
        });
        
        // Look for Bills QB specifically
        const billsQB = results.find(p => 
          (p.team?.toLowerCase().includes('buffalo') || p.team?.toLowerCase().includes('bills')) && 
          (p.position?.toLowerCase().includes('qb') || p.position?.toLowerCase().includes('quarterback'))
        );
        
        if (billsQB) {
          console.log(`\n⭐ Found Bills QB: ${billsQB.name} (ID: ${billsQB.id})`);
          return billsQB.id;
        }
        
      } catch (error) {
        console.log(`  ❌ Search failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ Could not find Josh Allen Bills QB');
    
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

// Run the search
findJoshAllen();