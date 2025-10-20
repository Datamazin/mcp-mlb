// Debug stat extraction test
import { SportAPIFactory } from './build/api/sport-api-factory.js';
import { ComparisonFactory } from './build/comparison/comparison-factory.js';

async function debugStatExtraction() {
    try {
        console.log('🔧 Debugging stat extraction...');
        
        // Initialize
        const nfl = SportAPIFactory.getClient('nfl');
        const nflComparison = ComparisonFactory.getComparison('nfl');
        
        // Search for Barry Sanders
        console.log('\n1. Searching for Barry Sanders...');
        const sandersResults = await nfl.searchPlayers('Barry Sanders');
        console.log(`✅ Found: ${sandersResults[0].fullName} (ID: ${sandersResults[0].id})`);
        
        // Get stats
        console.log('\n2. Getting stats...');
        const sandersStats = await nfl.getPlayerStats(sandersResults[0].id, { 
            statCategory: 'rushing' 
        });
        
        console.log('\n📊 Raw stats structure:');
        console.log('Keys:', Object.keys(sandersStats));
        console.log('PlayerName:', sandersStats.playerName);
        console.log('PlayerID:', sandersStats.playerId);
        
        console.log('\n📊 Categories:');
        if (sandersStats.splits && sandersStats.splits.categories) {
            sandersStats.splits.categories.forEach((category, i) => {
                console.log(`Category ${i}: ${category.name} (${category.displayName})`);
                console.log('Stats:');
                category.stats.forEach(stat => {
                    console.log(`  - ${stat.name}: ${stat.value} (${stat.displayName})`);
                });
            });
        }
        
        // Test stat extraction directly
        console.log('\n🧮 Testing stat extraction with different categories...');
        
        const testCategories = ['rushing', 'RUSHING', 'RB', 'general'];
        
        for (const category of testCategories) {
            console.log(`\n--- Testing category: "${category}" ---`);
            
            // Get the comparison instance to access protected methods
            const metrics = nflComparison.getMetrics(category);
            console.log('Metrics for this category:', metrics.length);
            
            metrics.slice(0, 5).forEach(metric => {
                console.log(`  - ${metric.key}: ${metric.name} (higher=${metric.higherIsBetter})`);
            });
            
            // Extract stats for this category
            const extractedStats = nflComparison.extractStats(sandersStats, category);
            console.log('Extracted stats:');
            Object.entries(extractedStats).slice(0, 5).forEach(([key, value]) => {
                console.log(`  - ${key}: ${value}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugStatExtraction();