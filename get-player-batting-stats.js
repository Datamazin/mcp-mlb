/**
 * Dynamic MLB Player Batting Stats Analysis
 * Constitutional Compliance: Dynamic API-First Development using MLB-StatsAPI patterns
 * 
 * Purpose: Get batting statistics for any player in any season
 * Dynamic Parameters: player search, season, stat types, game type
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function getPlayerBattingStats(playerName = 'Pete Alonso', season = new Date().getFullYear()) {
    console.log('⚾ MLB DYNAMIC BATTING STATS ANALYSIS');
    console.log('=' .repeat(50));
    console.log(`🔍 Searching for: ${playerName}`);
    console.log(`📅 Season: ${season}`);
    
    const mlbClient = new MLBAPIClient('https://statsapi.mlb.com/api/v1');
    
    try {
        // Search for player using corrected constitutional endpoint
        console.log('\n📡 Searching player database...');
        const searchResults = await mlbClient.searchPlayers(playerName);
        
        if (!searchResults.people || searchResults.people.length === 0) {
            throw new Error(`No players found matching "${playerName}"`);
        }

        const player = searchResults.people[0];
        console.log(`✅ Found: ${player.fullName} (ID: ${player.id})`);
        console.log(`   Position: ${player.primaryPosition?.name || 'N/A'}`);
        console.log(`   Team: ${player.currentTeam?.name || 'N/A'}`);

        // Get season stats
        console.log(`\n📊 Fetching ${season} batting statistics...`);
        const playerStats = await mlbClient.getPlayerStats(player.id, season, 'R');
        
        console.log(`\n📈 ${season} SEASON BATTING STATS`);
        console.log('─' .repeat(40));
        
        if (playerStats.stats && playerStats.stats.length > 0) {
            const hittingStats = playerStats.stats.find(stat => 
                stat.group && stat.group.displayName && 
                stat.group.displayName.toLowerCase().includes('hitting')
            );
            
            if (hittingStats && hittingStats.stats) {
                const stats = hittingStats.stats;
                
                // Display key batting statistics
                console.log(`Games Played: ${stats.gamesPlayed || 0}`);
                console.log(`At Bats: ${stats.atBats || 0}`);
                console.log(`Hits: ${stats.hits || 0}`);
                console.log(`Home Runs: ${stats.homeRuns || 0}`);
                console.log(`RBI: ${stats.rbi || 0}`);
                console.log(`Runs: ${stats.runs || 0}`);
                console.log(`Batting Average: ${stats.avg || '.000'}`);
                console.log(`On-Base Percentage: ${stats.obp || '.000'}`);
                console.log(`Slugging Percentage: ${stats.slg || '.000'}`);
                console.log(`OPS: ${stats.ops || '.000'}`);
                console.log(`Doubles: ${stats.doubles || 0}`);
                console.log(`Triples: ${stats.triples || 0}`);
                console.log(`Walks: ${stats.baseOnBalls || 0}`);
                console.log(`Strikeouts: ${stats.strikeOuts || 0}`);
                console.log(`Stolen Bases: ${stats.stolenBases || 0}`);
                
                // Monthly breakdown note
                console.log('\n📅 MONTHLY BREAKDOWN:');
                console.log('Note: Detailed monthly splits require game log analysis');
                console.log(`Current stats represent full ${season} season totals`);
                
                // Calculate some derived stats
                if (stats.atBats > 0) {
                    const contactRate = ((stats.atBats - stats.strikeOuts) / stats.atBats) * 100;
                    console.log(`\n🎯 ADDITIONAL METRICS:`);
                    console.log(`Contact Rate: ${contactRate.toFixed(1)}%`);
                    
                    if (stats.homeRuns > 0) {
                        const atBatsPerHR = stats.atBats / stats.homeRuns;
                        console.log(`At-Bats per Home Run: ${atBatsPerHR.toFixed(1)}`);
                    }
                }
                
            } else {
                console.log(`⚠️ No hitting stats found for ${season} season`);
            }
        } else {
            console.log(`⚠️ No stats available for ${season} season`);
        }
        
        console.log('\n🏛️ CONSTITUTIONAL COMPLIANCE:');
        console.log('✅ MLB-StatsAPI Reference Architecture: IMPLEMENTED');
        console.log('✅ Dynamic Player Search: OPERATIONAL');
        console.log('✅ Constitutional Search Endpoints: CORRECTED');
        console.log('✅ Reusable Analysis Framework: ACTIVE');
        
        // Extract hitting stats for return value
        let returnStats = {};
        if (playerStats.stats && playerStats.stats.length > 0) {
            const hittingStatsForReturn = playerStats.stats.find(stat => 
                stat.group && stat.group.displayName && 
                stat.group.displayName.toLowerCase().includes('hitting')
            );
            returnStats = hittingStatsForReturn ? hittingStatsForReturn.stats : {};
        }
        
        return {
            player: player.fullName,
            playerId: player.id,
            team: player.currentTeam?.name || 'N/A',
            position: player.primaryPosition?.name || 'N/A',
            stats: returnStats,
            season: season
        };
        
    } catch (error) {
        console.error('\n❌ Analysis Failed:', error.message);
        
        console.log('\n🔧 Troubleshooting Tips:');
        console.log('1. Check player name spelling');
        console.log('2. Try using partial names (e.g., "Judge" instead of "Aaron Judge")');
        console.log(`3. Verify player is active in ${season} season`);
        
        throw error;
    }
}

// Dynamic execution with command line arguments
async function main() {
    const args = process.argv.slice(2);
    let playerName = 'Pete Alonso'; // Default player
    let season = new Date().getFullYear(); // Default to current year
    
    // Parse command line arguments
    if (args.length > 0) {
        if (args[0] === '--help' || args[0] === '-h') {
            console.log('📋 Usage:');
            console.log('  node get-player-batting-stats.js [player-name] [season]');
            console.log('  node get-player-batting-stats.js "Aaron Judge" 2024');
            console.log('  node get-player-batting-stats.js "Pete Alonso" 2025');
            console.log('  node get-player-batting-stats.js "Vladimir Guerrero Jr." 2023');
            console.log('\n🔧 Parameters:');
            console.log('  player-name: Any MLB player name (required)');
            console.log('  season: Year (optional, defaults to current year)');
            return;
        }
        
        // Check if last argument is a year (4 digits)
        const lastArg = args[args.length - 1];
        if (/^\d{4}$/.test(lastArg)) {
            season = parseInt(lastArg);
            playerName = args.slice(0, -1).join(' '); // All args except last
        } else {
            playerName = args.join(' '); // All arguments as player name
        }
    }
    
    console.log(`💡 Analyzing ${playerName} for ${season} season`);
    console.log(`💡 Usage: node get-player-batting-stats.js "Player Name" [season]`);
    
    try {
        await getPlayerBattingStats(playerName, season);
    } catch (error) {
        process.exit(1);
    }
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('get-player-batting-stats.js')) {
    main();
}

export { getPlayerBattingStats };