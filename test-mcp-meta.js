/**
 * Test MLB MCP Server Meta Endpoint
 * 
 * This script tests the meta endpoint through the MCP server interface.
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function testMCPMetaEndpoint() {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  
  console.log('=== Testing MCP Meta Endpoint Integration ===\n');
  
  // Test specific metadata types that are commonly used
  const importantMetaTypes = [
    { type: 'gameTypes', description: 'Game type codes for filtering schedules/standings' },
    { type: 'jobTypes', description: 'Job type codes for personnel queries' },
    { type: 'positions', description: 'Player position codes and details' },
    { type: 'gameStatus', description: 'Game status codes for live games' },
    { type: 'standingsTypes', description: 'Available standings types' },
    { type: 'statTypes', description: 'Statistical analysis types' }
  ];
  
  for (const meta of importantMetaTypes) {
    try {
      console.log(`\n--- ${meta.type.toUpperCase()} ---`);
      console.log(`Purpose: ${meta.description}`);
      
      const result = await client.getMeta(meta.type);
      
      console.log(`✅ Retrieved ${result.totalItems} ${meta.type} entries`);
      
      // Show practical examples
      if (result.data && result.data.length > 0) {
        console.log('Key entries:');
        
        if (meta.type === 'gameTypes') {
          const key = result.data.filter(item => ['R', 'P', 'S'].includes(item.id));
          key.forEach(item => console.log(`  • ${item.id}: ${item.description}`));
        } else if (meta.type === 'positions') {
          const key = result.data.filter(item => ['1', '2', '3', '4', '5', '6'].includes(item.code));
          key.forEach(item => console.log(`  • ${item.code}: ${item.fullName}`));
        } else if (meta.type === 'jobTypes') {
          const key = result.data.filter(item => ['UMPR', 'MNGR', 'COAC'].includes(item.code));
          key.forEach(item => console.log(`  • ${item.code}: ${item.job}`));
        } else {
          result.data.slice(0, 3).forEach((item, idx) => {
            if (item.name) console.log(`  • ${item.name}: ${item.description || item.displayName || ''}`);
            else if (item.id) console.log(`  • ${item.id}: ${item.description || item.detailedState || ''}`);
            else if (item.displayName) console.log(`  • ${item.displayName}`);
          });
        }
      }
      
    } catch (error) {
      console.log(`❌ Error for ${meta.type}: ${error.message}`);
    }
  }
  
  console.log('\n=== Practical Usage Examples ===');
  
  // Show how metadata can be used with other endpoints
  console.log('\n🔧 How to use this metadata:');
  console.log('  • gameTypes: Use with get-schedule (gameType="R" for regular season)');
  console.log('  • jobTypes: Use with get-mlb-jobs (jobType="UMPR" for umpires)');
  console.log('  • positions: Filter player searches by position code');
  console.log('  • gameStatus: Understand live game states');
  console.log('  • standingsTypes: Get different standings views');
  
  console.log('\n=== MCP Meta Endpoint Testing Complete ===');
}

// Run the test
testMCPMetaEndpoint().catch(console.error);