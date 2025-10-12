#!/usr/bin/env node

/**
 * Dynamic Pitcher Career Comparison Analysis
 * Constitutional Compliance: Dynamic API-First Development
 * Compares any two pitchers' careers with comprehensive statistical analysis
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const readline = require('readline');

// Function to prompt user for selection
function promptUserChoice(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Dynamic player search function
async function searchPlayerByName(playerName) {
    const searchYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000, 1999, 1998, 1997, 1996, 1995, 1994, 1993, 1992, 1991, 1990, 1989, 1988, 1987, 1986, 1985, 1980, 1975, 1970, 1965, 1960];
    let allPlayers = [];
    
    for (const year of searchYears) {
        try {
            const url = `${MLB_API_BASE}/sports/1/players?season=${year}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.people) {
                const matchingPlayers = data.people.filter(player => 
                    player.fullName && player.fullName.toLowerCase().includes(playerName.toLowerCase())
                );
                
                for (const player of matchingPlayers) {
                    const existing = allPlayers.find(p => p.id === player.id);
                    if (!existing) {
                        allPlayers.push({
                            id: player.id,
                            fullName: player.fullName,
                            firstYear: year,
                            lastYear: year
                        });
                    } else {
                        existing.firstYear = Math.min(existing.firstYear, year);
                        existing.lastYear = Math.max(existing.lastYear, year);
                    }
                }
            }
        } catch (error) {
            // Skip failed years silently
        }
    }
    
    return allPlayers.sort((a, b) => b.lastYear - a.lastYear);
}

// Helper function to select player from multiple matches
async function selectPlayer(players, playerName) {
    if (players.length === 0) {
        throw new Error(`❌ No players found matching "${playerName}"`);
    }
    
    if (players.length === 1) {
        console.log(`✅ Found unique player: ${players[0].fullName} (ID: ${players[0].id})`);
        return players[0];
    }
    
    // Multiple players found - try to find exact match first
    let exactMatch = players.find(p => p.fullName.toLowerCase() === playerName.toLowerCase());
    
    if (exactMatch) {
        console.log(`✅ Found exact match: ${exactMatch.fullName} (ID: ${exactMatch.id})`);
        return exactMatch;
    }
    
    // Multiple players found - prompt user for selection
    console.log(`\n🔄 Found ${players.length} players matching "${playerName}":`);
    console.log();
    
    players.forEach((player, index) => {
        console.log(`${index + 1}. ${player.fullName} (ID: ${player.id})`);
        console.log(`   📅 Career: ${player.firstYear}-${player.lastYear}`);
        if (index < players.length - 1) console.log();
    });
    
    console.log();
    
    let selectedNumber;
    do {
        const answer = await promptUserChoice(`Please select a player (1-${players.length}): `);
        selectedNumber = parseInt(answer);
        
        if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > players.length) {
            console.log(`❌ Invalid selection. Please enter a number between 1 and ${players.length}.`);
        }
    } while (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > players.length);
    
    const selectedPlayer = players[selectedNumber - 1];
    console.log(`✅ Selected: ${selectedPlayer.fullName} (ID: ${selectedPlayer.id})`);
    return selectedPlayer;
}

// Command line argument parsing
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.log('🥎 Dynamic Pitcher Career Comparison Tool\n');
    console.log('Usage: node compare-pitchers.cjs "Pitcher 1 Name" "Pitcher 2 Name"');
    console.log('\nExamples:');
    console.log('  node compare-pitchers.cjs "Al Leiter" "Jack Leiter"');
    console.log('  node compare-pitchers.cjs "Max Scherzer" "Jacob deGrom"');
    console.log('  node compare-pitchers.cjs "Gerrit Cole" "Shane Bieber"');
    console.log('  node compare-pitchers.cjs "CC Sabathia" "Max Scherzer"');
    console.log('\n� Tool automatically searches for player IDs by name');
    process.exit(1);
}

const pitcher1Name = args[0];
const pitcher2Name = args[1];

// Dynamic pitcher data fetching function
async function getPitcherCareerStats(playerId, playerName) {
    try {
        // Fetch career stats, player info, and yearly stats for team history
        const [statsResponse, playerResponse, yearlyStatsResponse] = await Promise.all([
            fetch(`${MLB_API_BASE}/people/${playerId}/stats?stats=career&gameType=R`),
            fetch(`${MLB_API_BASE}/people/${playerId}`),
            fetch(`${MLB_API_BASE}/people/${playerId}/stats?stats=yearByYear&gameType=R`)
        ]);
        
        const data = await statsResponse.json();
        const playerData = await playerResponse.json();
        const yearlyData = await yearlyStatsResponse.json();
        
        const pitchingStats = data.stats?.find(stat => 
            stat.group && stat.group.displayName === 'pitching'
        );
        
        // Extract player career information
        const player = playerData.people?.[0];
        let teams = ["Data Not Available"];
        let careerYears = "Career Span Data Not Available";
        
        if (player) {
            // Calculate career span from MLB debut
            if (player.mlbDebutDate) {
                const debutYear = new Date(player.mlbDebutDate).getFullYear();
                const currentYear = new Date().getFullYear();
                careerYears = `${debutYear}-${currentYear}`;
            }
            
            // Get team information from current team or yearly stats
            if (player.currentTeam) {
                teams = [player.currentTeam.name];
            } else {
                // Extract teams from yearly stats
                const yearlyPitchingStats = yearlyData.stats?.find(stat => 
                    stat.group && stat.group.displayName === 'pitching'
                );
                
                if (yearlyPitchingStats && yearlyPitchingStats.splits) {
                    const uniqueTeams = new Set();
                    yearlyPitchingStats.splits.forEach(split => {
                        if (split.team && split.team.name) {
                            uniqueTeams.add(split.team.name);
                        }
                    });
                    if (uniqueTeams.size > 0) {
                        teams = Array.from(uniqueTeams);
                    }
                }
            }
        }
        
        let careerStats = {
            name: playerName,
            playerId: playerId,
            seasons: 0,
            wins: 0,
            losses: 0,
            era: 0.00,
            gamesStarted: 0,
            gamesPlayed: 0,
            completeGames: 0,
            shutouts: 0,
            saves: 0,
            inningsPitched: 0,
            hits: 0,
            runs: 0,
            earnedRuns: 0,
            homeRuns: 0,
            baseOnBalls: 0,
            strikeOuts: 0,
            whip: 0.00,
            teams: teams,
            years: careerYears
        };
        
        if (pitchingStats && pitchingStats.splits && pitchingStats.splits.length > 0) {
            const stats = pitchingStats.splits[0].stat;
            
            careerStats = {
                name: playerName,
                playerId: playerId,
                seasons: stats.numberOfPitches ? Math.ceil(stats.gamesPlayed / 30) : 0, // Estimate
                wins: stats.wins || 0,
                losses: stats.losses || 0,
                era: parseFloat(stats.era) || 0.00,
                gamesStarted: stats.gamesStarted || 0,
                gamesPlayed: stats.gamesPlayed || 0,
                completeGames: stats.completeGames || 0,
                shutouts: stats.shutouts || 0,
                saves: stats.saves || 0,
                inningsPitched: parseFloat(stats.inningsPitched) || 0,
                hits: stats.hits || 0,
                runs: stats.runs || 0,
                earnedRuns: stats.earnedRuns || 0,
                homeRuns: stats.homeRuns || 0,
                baseOnBalls: stats.baseOnBalls || 0,
                strikeOuts: stats.strikeOuts || 0,
                whip: parseFloat(stats.whip) || 0.00,
                teams: teams,
                years: careerYears
            };
        }
        
        return careerStats;
        
    } catch (error) {
        console.log(`⚠️ Could not fetch live data for ${playerName}, using placeholder data`);
        return {
            name: playerName,
            playerId: playerId,
            seasons: 0,
            wins: 0,
            losses: 0,
            era: 0.00,
            gamesStarted: 0,
            gamesPlayed: 0,
            completeGames: 0,
            shutouts: 0,
            saves: 0,
            inningsPitched: 0,
            hits: 0,
            runs: 0,
            earnedRuns: 0,
            homeRuns: 0,
            baseOnBalls: 0,
            strikeOuts: 0,
            whip: 0.00,
            teams: ["Data Not Available"],
            years: "Data Not Available"
        };
    }
}

// Main comparison function
async function comparePitchers() {
    console.log(`🥎 PITCHER COMPARISON: ${pitcher1Name.toUpperCase()} vs ${pitcher2Name.toUpperCase()}\n`);
    console.log('═'.repeat(80));
    
    console.log('� Searching for players...\n');
    
    // Search for both players
    const [pitcher1Players, pitcher2Players] = await Promise.all([
        searchPlayerByName(pitcher1Name),
        searchPlayerByName(pitcher2Name)
    ]);
    
    // Select players (handle multiple matches)
    const selectedPitcher1 = await selectPlayer(pitcher1Players, pitcher1Name);
    const selectedPitcher2 = await selectPlayer(pitcher2Players, pitcher2Name);
    
    console.log('\n�📊 Fetching pitcher career statistics...\n');
    
    const pitcher1 = await getPitcherCareerStats(selectedPitcher1.id, selectedPitcher1.fullName);
    const pitcher2 = await getPitcherCareerStats(selectedPitcher2.id, selectedPitcher2.fullName);

    console.log('🏆 CAREER OVERVIEW COMPARISON');
    console.log('─'.repeat(80));
    console.log(`Pitcher 1: ${pitcher1.name} (${pitcher1.years}) - Est. ${pitcher1.seasons} MLB seasons`);
    console.log(`Pitcher 2: ${pitcher2.name} (${pitcher2.years}) - Est. ${pitcher2.seasons} MLB seasons`);
    console.log();

    console.log('📊 CAREER TOTALS COMPARISON');
    console.log('─'.repeat(80));
    console.log('Statistic           │ Pitcher 1 │ Pitcher 2 │ Leader');
    console.log('─'.repeat(80));
    console.log(`Wins                │ ${pitcher1.wins.toString().padStart(9)} │ ${pitcher2.wins.toString().padStart(9)} │ ${pitcher1.wins > pitcher2.wins ? pitcher1.name : pitcher2.wins > pitcher1.wins ? pitcher2.name : 'Tied'}`);
    console.log(`Losses              │ ${pitcher1.losses.toString().padStart(9)} │ ${pitcher2.losses.toString().padStart(9)} │ ${pitcher1.losses < pitcher2.losses ? pitcher1.name + ' (Lower)' : pitcher2.losses < pitcher1.losses ? pitcher2.name + ' (Lower)' : 'Tied'}`);
    console.log(`Career ERA          │ ${pitcher1.era.toString().padStart(9)} │ ${pitcher2.era.toString().padStart(9)} │ ${pitcher1.era < pitcher2.era && pitcher1.era > 0 ? pitcher1.name + ' (Lower)' : pitcher2.era < pitcher1.era && pitcher2.era > 0 ? pitcher2.name + ' (Lower)' : 'TBD'}`);
    console.log(`Games Started       │ ${pitcher1.gamesStarted.toString().padStart(9)} │ ${pitcher2.gamesStarted.toString().padStart(9)} │ ${pitcher1.gamesStarted > pitcher2.gamesStarted ? pitcher1.name : pitcher2.gamesStarted > pitcher1.gamesStarted ? pitcher2.name : 'Tied'}`);
    console.log(`Innings Pitched     │ ${pitcher1.inningsPitched.toString().padStart(9)} │ ${pitcher2.inningsPitched.toString().padStart(9)} │ ${pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher1.name : pitcher2.inningsPitched > pitcher1.inningsPitched ? pitcher2.name : 'Tied'}`);
    console.log(`Strikeouts          │ ${pitcher1.strikeOuts.toString().padStart(9)} │ ${pitcher2.strikeOuts.toString().padStart(9)} │ ${pitcher1.strikeOuts > pitcher2.strikeOuts ? pitcher1.name : pitcher2.strikeOuts > pitcher1.strikeOuts ? pitcher2.name : 'Tied'}`);
    console.log(`WHIP                │ ${pitcher1.whip.toString().padStart(9)} │ ${pitcher2.whip.toString().padStart(9)} │ ${pitcher1.whip < pitcher2.whip && pitcher1.whip > 0 ? pitcher1.name + ' (Lower)' : pitcher2.whip < pitcher1.whip && pitcher2.whip > 0 ? pitcher2.name + ' (Lower)' : 'TBD'}`);
    console.log();

    console.log('🎯 RATE STATS COMPARISON (Career Averages)');
    console.log('─'.repeat(80));
    
    // Calculate rate stats safely
    const p1WinsPerSeason = pitcher1.seasons > 0 ? (pitcher1.wins / pitcher1.seasons).toFixed(1) : 'N/A';
    const p2WinsPerSeason = pitcher2.seasons > 0 ? (pitcher2.wins / pitcher2.seasons).toFixed(1) : 'N/A';
    
    const p1K9 = pitcher1.inningsPitched > 0 ? ((pitcher1.strikeOuts * 9) / pitcher1.inningsPitched).toFixed(1) : 'N/A';
    const p2K9 = pitcher2.inningsPitched > 0 ? ((pitcher2.strikeOuts * 9) / pitcher2.inningsPitched).toFixed(1) : 'N/A';
    
    const p1BB9 = pitcher1.inningsPitched > 0 ? ((pitcher1.baseOnBalls * 9) / pitcher1.inningsPitched).toFixed(1) : 'N/A';
    const p2BB9 = pitcher2.inningsPitched > 0 ? ((pitcher2.baseOnBalls * 9) / pitcher2.inningsPitched).toFixed(1) : 'N/A';
    
    const p1StartsPerSeason = pitcher1.seasons > 0 ? (pitcher1.gamesStarted / pitcher1.seasons).toFixed(1) : 'N/A';
    const p2StartsPerSeason = pitcher2.seasons > 0 ? (pitcher2.gamesStarted / pitcher2.seasons).toFixed(1) : 'N/A';
    
    console.log(`Wins per Season:    ${pitcher1.name} ${p1WinsPerSeason} vs ${pitcher2.name} ${p2WinsPerSeason}`);
    console.log(`K/9 Rate:           ${pitcher1.name} ${p1K9} vs ${pitcher2.name} ${p2K9}`);
    console.log(`BB/9 Rate:          ${pitcher1.name} ${p1BB9} vs ${pitcher2.name} ${p2BB9}`);
    console.log(`Starts per Season:  ${pitcher1.name} ${p1StartsPerSeason} vs ${pitcher2.name} ${p2StartsPerSeason}`);
    console.log();

    console.log('�️ TEAM & CAREER INFORMATION');
    console.log('─'.repeat(80));
    console.log(`${pitcher1.name} Teams: ${pitcher1.teams.join(' → ')}`);
    console.log(`${pitcher2.name} Teams: ${pitcher2.teams.join(' → ')}`);
    console.log();

    console.log('⚖️ STATISTICAL ANALYSIS');
    console.log('─'.repeat(80));
    
    // Determine statistical leaders
    const betterRecord = pitcher1.wins > pitcher2.wins ? pitcher1.name : 
                        pitcher2.wins > pitcher1.wins ? pitcher2.name : 'Tied';
    const betterERA = (pitcher1.era > 0 && pitcher2.era > 0) ? 
                     (pitcher1.era < pitcher2.era ? pitcher1.name : pitcher2.name) : 'Insufficient Data';
    const moreStrikeouts = pitcher1.strikeOuts > pitcher2.strikeOuts ? pitcher1.name : 
                          pitcher2.strikeOuts > pitcher1.strikeOuts ? pitcher2.name : 'Tied';
    
    console.log(`📊 Statistical Leaders:`);
    console.log(`   • More Career Wins: ${betterRecord}`);
    console.log(`   • Better ERA: ${betterERA}`);
    console.log(`   • More Strikeouts: ${moreStrikeouts}`);
    console.log(`   • More Innings: ${pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher1.name : pitcher2.name}`);
    console.log();

    console.log('� CONCLUSION');
    console.log('─'.repeat(80));
    console.log(`Comparison between ${pitcher1.name} and ${pitcher2.name}:`);
    console.log();
    
    if (pitcher1.inningsPitched === 0 && pitcher2.inningsPitched === 0) {
        console.log('📊 STATUS: Both pitchers have insufficient career data for meaningful comparison');
        console.log('⏰ RECOMMENDATION: Re-evaluate when more career data is available');
    } else if (pitcher1.inningsPitched === 0 || pitcher2.inningsPitched === 0) {
        const establishedPitcher = pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher1.name : pitcher2.name;
        const emergingPitcher = pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher2.name : pitcher1.name;
        console.log(`📊 STATUS: ${establishedPitcher} has established MLB career data`);
        console.log(`🔮 PROJECTION: ${emergingPitcher} is in early career development phase`);
        console.log(`🏆 CURRENT EDGE: ${establishedPitcher} (proven track record)`);
    } else {
        // Determine overall winner based on key metrics
        let pitcher1Points = 0;
        let pitcher2Points = 0;
        
        // ERA comparison (lower is better)
        if (pitcher1.era > 0 && pitcher2.era > 0) {
            if (pitcher1.era < pitcher2.era) pitcher1Points++;
            else if (pitcher2.era < pitcher1.era) pitcher2Points++;
        }
        
        // WHIP comparison (lower is better)
        if (pitcher1.whip > 0 && pitcher2.whip > 0) {
            if (pitcher1.whip < pitcher2.whip) pitcher1Points++;
            else if (pitcher2.whip < pitcher1.whip) pitcher2Points++;
        }
        
        // Wins comparison
        if (pitcher1.wins > pitcher2.wins) pitcher1Points++;
        else if (pitcher2.wins > pitcher1.wins) pitcher2Points++;
        
        // Strikeouts comparison
        if (pitcher1.strikeOuts > pitcher2.strikeOuts) pitcher1Points++;
        else if (pitcher2.strikeOuts > pitcher1.strikeOuts) pitcher2Points++;
        
        // Innings pitched (durability)
        if (pitcher1.inningsPitched > pitcher2.inningsPitched) pitcher1Points++;
        else if (pitcher2.inningsPitched > pitcher1.inningsPitched) pitcher2Points++;
        
        console.log('📊 STATUS: Both pitchers have sufficient data for statistical comparison');
        console.log();
        
        if (pitcher1Points > pitcher2Points) {
            console.log(`🏆 OVERALL WINNER: ${pitcher1.name}`);
            console.log(`📈 STATISTICAL EDGE: ${pitcher1Points}-${pitcher2Points} in key categories`);
            console.log(`🎯 KEY STRENGTHS: ${pitcher1.name} leads in more critical pitching metrics`);
        } else if (pitcher2Points > pitcher1Points) {
            console.log(`🏆 OVERALL WINNER: ${pitcher2.name}`);
            console.log(`📈 STATISTICAL EDGE: ${pitcher2Points}-${pitcher1Points} in key categories`);
            console.log(`🎯 KEY STRENGTHS: ${pitcher2.name} leads in more critical pitching metrics`);
        } else {
            console.log(`⚖️ STATISTICAL TIE: ${pitcher1Points}-${pitcher2Points} in key categories`);
            console.log(`🤝 CONCLUSION: Both pitchers have remarkably similar overall value`);
            console.log(`🎯 EDGE: Contest decided by specific situational needs or personal preference`);
        }
        
        console.log();
        
        // Career context analysis
        if (Math.abs(pitcher1.inningsPitched - pitcher2.inningsPitched) > 500) {
            const longevityLeader = pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher1.name : pitcher2.name;
            const otherPitcher = pitcher1.inningsPitched > pitcher2.inningsPitched ? pitcher2.name : pitcher1.name;
            console.log(`📅 CAREER CONTEXT: ${longevityLeader} has significantly more career longevity`);
            console.log(`⚡ PEAK vs LONGEVITY: ${otherPitcher} may have higher peak value per inning`);
        }
        
        // ERA differential analysis
        if (pitcher1.era > 0 && pitcher2.era > 0 && Math.abs(pitcher1.era - pitcher2.era) > 0.50) {
            const eraLeader = pitcher1.era < pitcher2.era ? pitcher1.name : pitcher2.name;
            const eraDiff = Math.abs(pitcher1.era - pitcher2.era).toFixed(2);
            console.log(`🎯 ERA DOMINANCE: ${eraLeader} has a significant ERA advantage (${eraDiff} difference)`);
        }
    }
    
    console.log();
    console.log('⚾ Dynamic pitcher comparison complete!');
    console.log('═'.repeat(80));
}

// Execute the comparison
comparePitchers().catch(error => {
    console.error('\n❌ Error during comparison:', error.message);
    process.exit(1);
});