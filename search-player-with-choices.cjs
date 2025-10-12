#!/usr/bin/env node

/**
 * Enhanced Player Search with Multiple Choice Selection
 * Constitutional Compliance: Dynamic API-First Development
 * Handles multiple players with the same name by showing career periods
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

async function searchPlayersWithChoices(playerName) {
    console.log(`🔍 Searching for players named: "${playerName}"\n`);
    
    const candidates = [];
    
    // Search across multiple years to catch retired players (extended for historical players)
    const searchYears = [2024, 2020, 2015, 2010, 2005, 2000, 1995, 1990, 1985, 1980, 1975, 1970, 1965, 1960];
    
    for (const year of searchYears) {
        try {
            const url = `${MLB_API_BASE}/sports/1/players?sportId=1&season=${year}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.people) {
                const matches = data.people.filter(player => {
                    const fullName = player.fullName?.toLowerCase() || '';
                    const nameSearch = playerName.toLowerCase();
                    return fullName.includes(nameSearch) || nameSearch.includes(fullName);
                });
                
                matches.forEach(player => {
                    // Check if we already have this player (by ID)
                    if (!candidates.find(c => c.id === player.id)) {
                        candidates.push({
                            id: player.id,
                            fullName: player.fullName,
                            position: player.primaryPosition?.name || 'Unknown',
                            team: player.currentTeam?.name || 'Unknown',
                            debut: player.mlbDebutDate,
                            foundInYear: year
                        });
                    }
                });
            }
        } catch (error) {
            // Continue searching other years
        }
    }
    
    if (candidates.length === 0) {
        console.log('❌ No players found with that name');
        console.log('\n💡 Try searching with:');
        console.log('   • First and last name: "Vladimir Guerrero"');
        console.log('   • Just last name: "Guerrero"');
        console.log('   • Nickname variations');
        return null;
    }
    
    if (candidates.length === 1) {
        const player = candidates[0];
        console.log(`✅ Found unique player: ${player.fullName} (ID: ${player.id})`);
        await getPlayerCareerPeriod(player.id, player.fullName);
        return player;
    }
    
    // Multiple players found - show choices
    console.log(`🔄 Found ${candidates.length} players with similar names:\n`);
    
    for (let i = 0; i < candidates.length; i++) {
        const player = candidates[i];
        console.log(`${i + 1}. ${player.fullName} (ID: ${player.id})`);
        
        // Get career period for each candidate
        const careerInfo = await getPlayerCareerPeriod(player.id, player.fullName, false);
        if (careerInfo) {
            console.log(`   📅 Career: ${careerInfo.firstYear}-${careerInfo.lastYear}`);
            console.log(`   🏟️ Teams: ${careerInfo.teams.join(', ')}`);
            console.log(`   📊 ${careerInfo.games} games, ${careerInfo.homeRuns} HRs\n`);
        } else {
            console.log(`   📅 Career: ${player.debut ? player.debut.substring(0, 4) : 'Unknown'}-Present`);
            console.log(`   🏟️ Current Team: ${player.team}`);
            console.log(`   📊 Position: ${player.position}\n`);
        }
    }
    
    console.log('Please specify which player you want by using their Player ID:');
    console.log(`Example: node get-player-career-by-year.cjs ${candidates[0].id} "${candidates[0].fullName}"`);
    
    return candidates;
}

async function getPlayerCareerPeriod(playerId, playerName, showDetails = true) {
    try {
        const url = `${MLB_API_BASE}/people/${playerId}/stats?stats=yearByYear&gameType=R`;
        const response = await fetch(url);
        const data = await response.json();
        
        const hittingStats = data.stats?.find(stat => 
            stat.group && stat.group.displayName === 'hitting'
        );
        
        if (!hittingStats?.splits || hittingStats.splits.length === 0) {
            return null;
        }
        
        const seasons = hittingStats.splits.sort((a, b) => 
            parseInt(a.season) - parseInt(b.season)
        );
        
        const firstYear = seasons[0].season;
        const lastYear = seasons[seasons.length - 1].season;
        
        // Get unique teams
        const teams = [...new Set(seasons.map(s => {
            const teamName = s.team?.name || 'Unknown';
            const teamMap = {
                'Montreal Expos': 'MON',
                'Los Angeles Angels': 'LAA',
                'Texas Rangers': 'TEX',
                'Baltimore Orioles': 'BAL',
                'New York Mets': 'NYM',
                'New York Yankees': 'NYY',
                'Toronto Blue Jays': 'TOR'
            };
            return teamMap[teamName] || teamName.substring(0, 3).toUpperCase();
        }))];
        
        // Calculate totals
        let totalGames = 0;
        let totalHRs = 0;
        
        seasons.forEach(season => {
            totalGames += season.stat?.gamesPlayed || 0;
            totalHRs += season.stat?.homeRuns || 0;
        });
        
        const careerInfo = {
            firstYear,
            lastYear,
            teams,
            games: totalGames,
            homeRuns: totalHRs
        };
        
        if (showDetails) {
            console.log(`📊 ${playerName} Career Summary:`);
            console.log(`   📅 Years: ${firstYear}-${lastYear} (${seasons.length} seasons)`);
            console.log(`   🏟️ Teams: ${teams.join(', ')}`);
            console.log(`   📈 Games: ${totalGames}, Home Runs: ${totalHRs}`);
        }
        
        return careerInfo;
        
    } catch (error) {
        return null;
    }
}

// Command line execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('🔍 Enhanced Player Search with Multiple Choice Selection\n');
    console.log('Usage: node search-player-with-choices.cjs "Player Name"');
    console.log('\nExamples:');
    console.log('  node search-player-with-choices.cjs "Vladimir Guerrero"');
    console.log('  node search-player-with-choices.cjs "Ken Griffey"');
    console.log('  node search-player-with-choices.cjs "Tony Gwynn"');
    console.log('\n💡 This will show all players with similar names and their career periods');
} else {
    const playerName = args[0];
    searchPlayersWithChoices(playerName);
}