import { MLBAPIClient } from './build/mlb-api.js';

async function showAvailableStatTypes() {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  
  try {
    console.log('🔍 Fetching available stat types from MLB API...\n');
    const data = await client.getMeta('statTypes');
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log('📊 Available MLB Stat Types:');
      console.log('=' .repeat(50));
      
      // Group stat types by category for better display
      const commonTypes = [];
      const advancedTypes = [];
      const logTypes = [];
      const splitTypes = [];
      const otherTypes = [];
      
      data.data.forEach(stat => {
        const name = stat.displayName;
        if (['season', 'career', 'yearByYear', 'standard'].includes(name)) {
          commonTypes.push(name);
        } else if (name.includes('Advanced')) {
          advancedTypes.push(name);
        } else if (name.includes('Log')) {
          logTypes.push(name);
        } else if (name.includes('by') || name.includes('vs') || name.includes('And')) {
          splitTypes.push(name);
        } else {
          otherTypes.push(name);
        }
      });
      
      if (commonTypes.length > 0) {
        console.log('\n📈 Common Stat Types:');
        commonTypes.forEach(type => console.log(`   • ${type}`));
      }
      
      if (splitTypes.length > 0) {
        console.log('\n📊 Split/Situational Stats:');
        splitTypes.forEach(type => console.log(`   • ${type}`));
      }
      
      if (logTypes.length > 0) {
        console.log('\n📋 Log Types:');
        logTypes.forEach(type => console.log(`   • ${type}`));
      }
      
      if (advancedTypes.length > 0) {
        console.log('\n⚡ Advanced Stats:');
        advancedTypes.forEach(type => console.log(`   • ${type}`));
      }
      
      if (otherTypes.length > 0) {
        console.log('\n🔧 Other Types:');
        otherTypes.forEach(type => console.log(`   • ${type}`));
      }
      
      console.log(`\n📝 Total: ${data.data.length} stat types available`);
      
    } else {
      console.log('❌ Unexpected response format');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching stat types:', error.message);
  }
}

showAvailableStatTypes();