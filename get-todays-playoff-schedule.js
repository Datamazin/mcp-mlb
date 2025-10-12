// Check today's MLB playoff schedule - October 12, 2025
import { MLBAPIClient } from './build/mlb-api.js';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const mlbClient = new MLBAPIClient(MLB_API_BASE);

async function getTodaysPlayoffSchedule() {
    console.log('Checking today\'s MLB playoff schedule - October 12, 2025...');
    
    try {
        // Get the full 2025 postseason schedule
        console.log('\nFetching 2025 postseason schedule...');
        const postseason2025 = await mlbClient.getPostseasonSchedule(2025);
        
        if (postseason2025 && postseason2025.dates) {
            console.log(`✅ Found ${postseason2025.dates.length} total playoff dates in 2025`);
            
            // Look for today's games - October 12, 2025
            const todaysGames = postseason2025.dates.find(dateData => 
                dateData.date === '2025-10-12'
            );
            
            if (todaysGames && todaysGames.games && todaysGames.games.length > 0) {
                console.log(`\n🎯 TODAY'S PLAYOFF GAMES (October 12, 2025):`);
                console.log(`Found ${todaysGames.games.length} game(s)\n`);
                
                todaysGames.games.forEach((game, index) => {
                    console.log(`--- GAME ${index + 1} ---`);
                    console.log(`Teams: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
                    console.log(`Game ID: ${game.gamePk}`);
                    console.log(`Status: ${game.status.detailedState}`);
                    console.log(`Description: ${game.description || 'N/A'}`);
                    console.log(`Series: Game ${game.seriesGameNumber} of ${game.gamesInSeries}`);
                    console.log(`Venue: ${game.venue?.name || 'N/A'}`);
                    
                    if (game.gameDate) {
                        const gameTime = new Date(game.gameDate);
                        console.log(`Game Time: ${gameTime.toLocaleString()}`);
                    }
                    
                    if (game.teams.away.score !== undefined && game.teams.home.score !== undefined) {
                        console.log(`Score: ${game.teams.away.team.name} ${game.teams.away.score}, ${game.teams.home.team.name} ${game.teams.home.score}`);
                    }
                    
                    console.log('');
                });
            } else {
                console.log(`\n❌ No playoff games scheduled for today (October 12, 2025)`);
                
                // Show nearby dates with games
                console.log('\n📅 Recent playoff game dates:');
                const recentDates = postseason2025.dates
                    .filter(dateData => {
                        const gameDate = new Date(dateData.date);
                        const today = new Date('2025-10-12');
                        const diffDays = Math.abs((gameDate - today) / (1000 * 60 * 60 * 24));
                        return diffDays <= 3 && dateData.games && dateData.games.length > 0;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                
                recentDates.forEach(dateData => {
                    console.log(`  ${dateData.date}: ${dateData.games.length} game(s)`);
                    dateData.games.forEach(game => {
                        console.log(`    - ${game.teams.away.team.name} @ ${game.teams.home.team.name} (${game.status.detailedState})`);
                    });
                });
            }
        } else {
            console.log('❌ No postseason data returned for 2025');
        }
        
    } catch (error) {
        console.error('❌ Error fetching today\'s playoff schedule:', error.message);
        
        // Fallback - show what we know about the postseason structure
        console.log('\n--- Fallback: Testing API connectivity ---');
        try {
            const response = await fetch('https://statsapi.mlb.com/api/v1/schedule/postseason?season=2025');
            console.log(`API Response Status: ${response.status}`);
            if (response.ok) {
                console.log('✅ API is accessible, but data structure may have changed');
            }
        } catch (apiError) {
            console.log('❌ API connectivity issue:', apiError.message);
        }
    }
}

getTodaysPlayoffSchedule();