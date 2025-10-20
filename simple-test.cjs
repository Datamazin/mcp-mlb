/**
 * Simple test of enhanced player search
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');

async function simpleTest() {
  console.log('Testing enhanced NFL player search...');
  
  try {
    const nfl = SportAPIFactory.getClient('nfl');
    
    console.log('Searching for Barry Sanders...');
    const results = await nfl.searchPlayers('Barry Sanders');
    
    console.log(`Results: ${results.length}`);
    results.forEach(player => {
      console.log(`- ${player.fullName} (ID: ${player.id})`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

simpleTest();