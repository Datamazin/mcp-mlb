#!/usr/bin/env node

/**
 * Debug script to inspect sacks stats in ESPN NFL API responses
 */

import { SportAPIFactory } from './build/api/sport-api-factory.js';

async function debugSacksStats() {
  console.log('🔧 Debugging NFL Sacks Stats...\n');

  try {
    const nflApi = SportAPIFactory.getClient('nfl');
    
    // Test with Lamar Jackson who should have sack data
    console.log('📊 Fetching Lamar Jackson 2023 stats...');
    const playerStats = await nflApi.getPlayerStats('3916387', { 
      statGroup: 'passing', 
      season: '2023' 
    });
    
    console.log('\n📋 Raw Player Stats Structure:');
    console.log('playerStats keys:', Object.keys(playerStats || {}));
    
    if (playerStats?.splits?.categories) {
      console.log('\n📊 Categories found:');
      playerStats.splits.categories.forEach((category, index) => {
        console.log(`\nCategory ${index}: ${category.name || 'Unknown'}`);
        console.log('Stats in this category:');
        category.stats?.forEach(stat => {
          console.log(`  - ${stat.name}: ${stat.value} (${stat.displayValue || stat.value})`);
        });
      });
      
      // Look specifically for sack-related stats
      console.log('\n🔍 Searching for sack-related stats:');
      const allStats = [];
      playerStats.splits.categories.forEach(category => {
        category.stats?.forEach(stat => {
          allStats.push({ category: category.name, name: stat.name, value: stat.value, displayValue: stat.displayValue });
          if (stat.name.toLowerCase().includes('sack')) {
            console.log(`  ⭐ FOUND: ${stat.name} = ${stat.value} (category: ${category.name})`);
          }
        });
      });
      
      console.log('\n📝 All available stat names:');
      const uniqueStatNames = [...new Set(allStats.map(s => s.name))].sort();
      uniqueStatNames.forEach(name => {
        console.log(`  - ${name}`);
      });
      
    } else {
      console.log('❌ No splits.categories found in response');
      console.log('Full response:', JSON.stringify(playerStats, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugSacksStats();