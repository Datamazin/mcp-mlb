// Test the enhanced boxscore functionality for last night's playoff game
import { MLBAPIClient } from './build/mlb-api.js';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const mlbClient = new MLBAPIClient(MLB_API_BASE);

async function testBoxscoreAPI() {
    console.log('Testing enhanced boxscore API for October 11, 2025 playoff game...');
    
    // Game ID from our previous discovery: Cubs @ Brewers NLDS Game 5
    const gamePk = 813046;
    
    try {
        console.log(`\nFetching boxscore for Game ${gamePk}: Cubs @ Brewers NLDS Game 5`);
        
        const boxscore = await mlbClient.getBoxscore(gamePk);
        
        console.log('✅ Boxscore retrieved successfully!');
        console.log('\n=== GAME INFO ===');
        console.log(`Game: ${boxscore.teams.away.team.name} @ ${boxscore.teams.home.team.name}`);
        console.log(`Attendance: ${boxscore.gameInfo.attendance || 'N/A'}`);
        console.log(`Weather: ${boxscore.gameInfo.weather || 'N/A'}`);
        console.log(`Time of Game: ${boxscore.gameInfo.timeOfGame || 'N/A'}`);
        
        // Display batting statistics for both teams
        console.log('\n=== BATTING STATISTICS ===');
        
        ['away', 'home'].forEach(teamType => {
            const team = boxscore.teams[teamType];
            console.log(`\n--- ${team.team.name} ---`);
            console.log(`Team Batting Stats:`);
            console.log(`  Runs: ${team.teamStats.batting.runs || 0}`);
            console.log(`  Hits: ${team.teamStats.batting.hits || 0}`);
            console.log(`  RBI: ${team.teamStats.batting.rbi || 0}`);
            console.log(`  Home Runs: ${team.teamStats.batting.homeRuns || 0}`);
            
            console.log(`\nTop Batting Performances:`);
            const batters = team.players.filter(p => p.battingStats && Object.keys(p.battingStats).length > 0);
            batters.slice(0, 5).forEach(player => {
                const stats = player.battingStats;
                if (stats.atBats > 0) {
                    console.log(`  ${player.fullName}: ${stats.hits || 0}-${stats.atBats || 0}, ${stats.runs || 0}R, ${stats.rbi || 0}RBI`);
                }
            });
        });
        
        console.log('\n=== PITCHING STATISTICS ===');
        ['away', 'home'].forEach(teamType => {
            const team = boxscore.teams[teamType];
            console.log(`\n--- ${team.team.name} Pitching ---`);
            
            const pitchers = team.players.filter(p => p.pitchingStats && Object.keys(p.pitchingStats).length > 0);
            pitchers.forEach(pitcher => {
                const stats = pitcher.pitchingStats;
                if (stats.inningsPitched) {
                    console.log(`  ${pitcher.fullName}: ${stats.inningsPitched}IP, ${stats.hits || 0}H, ${stats.runs || 0}R, ${stats.earnedRuns || 0}ER, ${stats.strikeOuts || 0}K`);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error fetching boxscore:', error.message);
        
        // Try with a different approach - test with a known working 2024 game
        console.log('\n--- Trying with 2024 World Series Game for comparison ---');
        try {
            const ws2024 = await mlbClient.getBoxscore(775299); // 2024 World Series Game 1
            console.log('✅ 2024 boxscore works - API client is functional');
            console.log(`Sample: ${ws2024.teams.away.team.name} @ ${ws2024.teams.home.team.name}`);
        } catch (err2) {
            console.error('❌ Even 2024 game failed:', err2.message);
        }
    }
}

testBoxscoreAPI();