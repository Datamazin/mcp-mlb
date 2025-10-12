// Test the MCP server postseason functionality directly
import { MLBAPIClient } from './build/mlb-api.js';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const mlbClient = new MLBAPIClient(MLB_API_BASE);

async function testMCPPostseason() {
    console.log('Testing MCP MLB API client postseason endpoint...');
    
    try {
        // Test the postseason endpoint directly through our client
        console.log('\n1. Testing 2025 postseason schedule:');
        const postseason2025 = await mlbClient.getPostseasonSchedule(2025);
        
        if (postseason2025 && postseason2025.dates) {
            console.log(`✅ 2025: Found ${postseason2025.dates.length} dates`);
            
            // Look for October 11, 2025 specifically
            const oct11Games = postseason2025.dates.find(dateData => 
                dateData.date === '2025-10-11'
            );
            
            if (oct11Games) {
                console.log(`🎯 October 11, 2025 games found:`);
                oct11Games.games.forEach(game => {
                    console.log(`   - Game ${game.gamePk}: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
                    console.log(`     Status: ${game.status.detailedState}`);
                    console.log(`     Description: ${game.description || 'N/A'}`);
                });
            } else {
                console.log('❌ No games found for October 11, 2025');
                
                // Show what dates are available
                console.log('Available dates in 2025 postseason:');
                postseason2025.dates.slice(0, 10).forEach(dateData => {
                    console.log(`   - ${dateData.date}: ${dateData.games?.length || 0} games`);
                });
            }
        } else {
            console.log('❌ No postseason data returned for 2025');
        }
        
        // Test 2024 for comparison
        console.log('\n2. Testing 2024 postseason schedule:');
        const postseason2024 = await mlbClient.getPostseasonSchedule(2024);
        
        if (postseason2024 && postseason2024.dates) {
            console.log(`✅ 2024: Found ${postseason2024.dates.length} dates`);
            
            // Show some sample games
            const sampleDate = postseason2024.dates[0];
            if (sampleDate && sampleDate.games) {
                console.log(`Sample from ${sampleDate.date}:`);
                sampleDate.games.slice(0, 2).forEach(game => {
                    console.log(`   - ${game.teams.away.team.name} @ ${game.teams.home.team.name} (${game.status.detailedState})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing postseason API:', error.message);
    }
}

testMCPPostseason();