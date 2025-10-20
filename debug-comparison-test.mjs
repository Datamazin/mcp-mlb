// Simple comparison debug test
import { SportAPIFactory } from './build/api/sport-api-factory.js';
import { ComparisonFactory } from './build/comparison/comparison-factory.js';

async function debugComparison() {
    try {
        console.log('🔧 Starting comparison debug test...');
        
        // Initialize
        const nfl = SportAPIFactory.getClient('nfl');
        const nflComparison = ComparisonFactory.getComparison('nfl');
        
        console.log('✅ APIs initialized');
        
        // Search for Barry Sanders
        console.log('\n1. Searching for Barry Sanders...');
        const sandersResults = await nfl.searchPlayers('Barry Sanders');
        
        if (sandersResults.length === 0) {
            console.log('❌ Barry Sanders not found');
            return;
        }
        
        console.log(`✅ Found Barry Sanders: ${sandersResults[0].fullName} (ID: ${sandersResults[0].id})`);
        
        // Get stats  
        console.log('\n2. Getting Barry Sanders stats...');
        const sandersStats = await nfl.getPlayerStats(sandersResults[0].id, { 
            statCategory: 'rushing' 
        });
        
        console.log('✅ Stats retrieved');
        console.log('Sample stats keys:', Object.keys(sandersStats).slice(0, 5));
        
        // Try comparison with self first (simpler test)
        console.log('\n3. Testing comparison (Barry vs Barry)...');
        const comparison = await nflComparison.comparePlayers(
            sandersResults[0].id, 
            sandersResults[0].id, 
            'rushing'
        );
        
        console.log('✅ Comparison completed');
        console.log('Comparison structure:');
        console.log('- player1:', comparison.player1 ? '✅' : '❌');
        console.log('- player2:', comparison.player2 ? '✅' : '❌');
        console.log('- comparison array length:', comparison.comparison?.length || 0);
        console.log('- overallWinner:', comparison.overallWinner);
        console.log('- summary:', comparison.summary ? '✅' : '❌');
        
        if (comparison.comparison && comparison.comparison.length > 0) {
            console.log('\nFirst comparison item:');
            console.log(JSON.stringify(comparison.comparison[0], null, 2));
        }
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugComparison();