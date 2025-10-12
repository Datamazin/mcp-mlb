/**
 * Test MLB Meta Endpoint
 * 
 * This script tests the MLB meta endpoint to retrieve various types of metadata
 * that can be used within other API calls.
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function testMetaEndpoint() {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  
  console.log('=== Testing MLB Meta Endpoint ===\n');
  
  // Test different metadata types
  const metaTypes = [
    'gameTypes',
    'jobTypes', 
    'positions',
    'gameStatus',
    'standingsTypes',
    'statTypes',
    'baseballStats'
  ];
  
  for (const type of metaTypes) {
    try {
      console.log(`\n--- Testing Meta Type: ${type} ---`);
      const result = await client.getMeta(type);
      
      console.log(`✅ Success for ${type}:`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Version: ${result.version}`);
      console.log(`   Total Items: ${result.totalItems}`);
      
      // Show first few items as examples
      if (result.data && result.data.length > 0) {
        console.log(`   Sample Data (first 3 items):`);
        result.data.slice(0, 3).forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            console.log(`     ${index + 1}. ${JSON.stringify(item, null, 6)}`);
          } else {
            console.log(`     ${index + 1}. ${item}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error for ${type}: ${error.message}`);
    }
  }
  
  console.log('\n=== Meta Endpoint Testing Complete ===');
}

// Run the test
testMetaEndpoint().catch(console.error);