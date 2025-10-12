import { MLBAPIClient } from './build/mlb-api.js';

async function checkStatTypes() {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  
  try {
    console.log('🔍 Fetching available stat types from MLB API...');
    const data = await client.getMeta('statTypes');
    
    console.log('\n📊 Available stat types:');
    if (data && Array.isArray(data)) {
      data.forEach(stat => {
        console.log(`- ${stat.displayName} (${stat.name})`);
      });
    } else {
      console.log('Raw data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatTypes();