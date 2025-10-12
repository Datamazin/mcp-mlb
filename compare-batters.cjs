#!/usr/bin/env node

/**
 * Dynamic Batter Career Comparison Analysis
 * Constitutional Compliance: Dynamic API-First Development
 * Compares any two batters' careers with comprehensive statistical analysis
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

// Command line argument parsing
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.log('⚾ Dynamic Batter Career Comparison Tool\n');
    console.log('Usage: node compare-batters.cjs "Batter 1 Name" "Batter 2 Name"');
    console.log('\nExamples:');
    console.log('  node compare-batters.cjs "Vladimir Guerrero Sr." "Vladimir Guerrero Jr."');
    console.log('  node compare-batters.cjs "Pete Alonso" "Aaron Judge"');
    console.log('  node compare-batters.cjs "Ronald Acuña Jr." "Juan Soto"');
    console.log('  node compare-batters.cjs "Freddie Freeman" "Bryce Harper"');
    console.log('\n� Tool automatically searches for player IDs by name');
    process.exit(1);
}

const batter1Name = args[0];
const batter2Name = args[1];

// Dynamic batter data fetching function
async function getBatterCareerStats(playerId, playerName) {
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
        
        const hittingStats = data.stats?.find(stat => 
            stat.group && stat.group.displayName === 'hitting'
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
                const yearlyHittingStats = yearlyData.stats?.find(stat => 
                    stat.group && stat.group.displayName === 'hitting'
                );
                
                if (yearlyHittingStats && yearlyHittingStats.splits) {
                    const uniqueTeams = new Set();
                    yearlyHittingStats.splits.forEach(split => {
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
            games: 0,
            atBats: 0,
            hits: 0,
            homeRuns: 0,
            rbis: 0,
            runs: 0,
            doubles: 0,
            triples: 0,
            walks: 0,
            strikeouts: 0,
            stolenBases: 0,
            avg: 0.000,
            obp: 0.000,
            slg: 0.000,
            ops: 0.000,
            teams: teams,
            years: careerYears
        };
        
        if (hittingStats && hittingStats.splits && hittingStats.splits.length > 0) {
            const stats = hittingStats.splits[0].stat;
            
            careerStats = {
                name: playerName,
                playerId: playerId,
                seasons: Math.ceil((stats.gamesPlayed || 0) / 140) || 1, // Estimate seasons
                games: stats.gamesPlayed || 0,
                atBats: stats.atBats || 0,
                hits: stats.hits || 0,
                homeRuns: stats.homeRuns || 0,
                rbis: stats.rbi || 0,
                runs: stats.runs || 0,
                doubles: stats.doubles || 0,
                triples: stats.triples || 0,
                walks: stats.baseOnBalls || 0,
                strikeouts: stats.strikeOuts || 0,
                stolenBases: stats.stolenBases || 0,
                avg: parseFloat(stats.avg) || 0.000,
                obp: parseFloat(stats.obp) || 0.000,
                slg: parseFloat(stats.slg) || 0.000,
                ops: parseFloat(stats.ops) || 0.000,
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
            games: 0,
            atBats: 0,
            hits: 0,
            homeRuns: 0,
            rbis: 0,
            runs: 0,
            doubles: 0,
            triples: 0,
            walks: 0,
            strikeouts: 0,
            stolenBases: 0,
            avg: 0.000,
            obp: 0.000,
            slg: 0.000,
            ops: 0.000,
            teams: teams,
            years: careerYears
        };
    }
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

// Main comparison function
async function compareBatters() {
    console.log(`⚾ BATTER COMPARISON: ${batter1Name.toUpperCase()} vs ${batter2Name.toUpperCase()}\n`);
    console.log('═'.repeat(80));
    
    console.log('🔍 Searching for players...\n');
    
    // Search for both players
    const [batter1Players, batter2Players] = await Promise.all([
        searchPlayerByName(batter1Name),
        searchPlayerByName(batter2Name)
    ]);
    
        // Select players (handle multiple matches)
        const selectedBatter1 = await selectPlayer(batter1Players, batter1Name);
        const selectedBatter2 = await selectPlayer(batter2Players, batter2Name);    console.log('\n📊 Fetching batter career statistics...\n');
    
    const batter1 = await getBatterCareerStats(selectedBatter1.id, selectedBatter1.fullName);
    const batter2 = await getBatterCareerStats(selectedBatter2.id, selectedBatter2.fullName);

    console.log('🏆 CAREER OVERVIEW COMPARISON');
    console.log('─'.repeat(80));
    console.log(`Batter 1: ${batter1.name} (${batter1.years}) - Est. ${batter1.seasons} MLB seasons`);
    console.log(`Batter 2: ${batter2.name} (${batter2.years}) - Est. ${batter2.seasons} MLB seasons`);
    console.log();

    console.log('📊 CAREER TOTALS COMPARISON');
    console.log('─'.repeat(80));
    console.log('Statistic        │ Batter 1  │ Batter 2  │ Leader');
    console.log('─'.repeat(80));
    console.log(`Games            │ ${batter1.games.toString().padStart(9)} │ ${batter2.games.toString().padStart(9)} │ ${batter1.games > batter2.games ? batter1.name : batter2.games > batter1.games ? batter2.name : 'Tied'}`);
    console.log(`Home Runs        │ ${batter1.homeRuns.toString().padStart(9)} │ ${batter2.homeRuns.toString().padStart(9)} │ ${batter1.homeRuns > batter2.homeRuns ? batter1.name : batter2.homeRuns > batter1.homeRuns ? batter2.name : 'Tied'}`);
    console.log(`RBIs             │ ${batter1.rbis.toString().padStart(9)} │ ${batter2.rbis.toString().padStart(9)} │ ${batter1.rbis > batter2.rbis ? batter1.name : batter2.rbis > batter1.rbis ? batter2.name : 'Tied'}`);
    console.log(`Runs             │ ${batter1.runs.toString().padStart(9)} │ ${batter2.runs.toString().padStart(9)} │ ${batter1.runs > batter2.runs ? batter1.name : batter2.runs > batter1.runs ? batter2.name : 'Tied'}`);
    console.log(`Hits             │ ${batter1.hits.toString().padStart(9)} │ ${batter2.hits.toString().padStart(9)} │ ${batter1.hits > batter2.hits ? batter1.name : batter2.hits > batter1.hits ? batter2.name : 'Tied'}`);
    console.log(`Batting Average  │ ${batter1.avg.toString().padStart(9)} │ ${batter2.avg.toString().padStart(9)} │ ${batter1.avg > batter2.avg ? batter1.name : batter2.avg > batter1.avg ? batter2.name : 'Tied'}`);
    console.log(`OPS              │ ${batter1.ops.toString().padStart(9)} │ ${batter2.ops.toString().padStart(9)} │ ${batter1.ops > batter2.ops ? batter1.name : batter2.ops > batter1.ops ? batter2.name : 'Tied'}`);
    console.log();

    console.log('🎯 RATE STATS COMPARISON (Career Averages)');
    console.log('─'.repeat(80));
    
    // Calculate rate stats safely
    const b1HRsPerSeason = batter1.seasons > 0 ? (batter1.homeRuns / batter1.seasons).toFixed(1) : 'N/A';
    const b2HRsPerSeason = batter2.seasons > 0 ? (batter2.homeRuns / batter2.seasons).toFixed(1) : 'N/A';
    
    const b1RBIsPerSeason = batter1.seasons > 0 ? (batter1.rbis / batter1.seasons).toFixed(1) : 'N/A';
    const b2RBIsPerSeason = batter2.seasons > 0 ? (batter2.rbis / batter2.seasons).toFixed(1) : 'N/A';
    
    const b1GamesPerSeason = batter1.seasons > 0 ? (batter1.games / batter1.seasons).toFixed(0) : 'N/A';
    const b2GamesPerSeason = batter2.seasons > 0 ? (batter2.games / batter2.seasons).toFixed(0) : 'N/A';
    
    const b1StrikeoutRate = batter1.atBats > 0 ? ((batter1.strikeouts / batter1.atBats) * 100).toFixed(1) : 'N/A';
    const b2StrikeoutRate = batter2.atBats > 0 ? ((batter2.strikeouts / batter2.atBats) * 100).toFixed(1) : 'N/A';
    
    const b1WalkRate = batter1.atBats > 0 ? ((batter1.walks / batter1.atBats) * 100).toFixed(1) : 'N/A';
    const b2WalkRate = batter2.atBats > 0 ? ((batter2.walks / batter2.atBats) * 100).toFixed(1) : 'N/A';
    
    console.log(`HR per Season:   ${batter1.name} ${b1HRsPerSeason} vs ${batter2.name} ${b2HRsPerSeason}`);
    console.log(`RBI per Season:  ${batter1.name} ${b1RBIsPerSeason} vs ${batter2.name} ${b2RBIsPerSeason}`);
    console.log(`Games per Season: ${batter1.name} ${b1GamesPerSeason} vs ${batter2.name} ${b2GamesPerSeason}`);
    console.log();

    console.log('🏃 ATHLETICISM & STYLE COMPARISON');
    console.log('─'.repeat(80));
    console.log(`Stolen Bases:    ${batter1.name} ${batter1.stolenBases} vs ${batter2.name} ${batter2.stolenBases}`);
    console.log(`Triples:         ${batter1.name} ${batter1.triples} vs ${batter2.name} ${batter2.triples}`);
    console.log(`Strikeout Rate:  ${batter1.name} ${b1StrikeoutRate}% vs ${batter2.name} ${b2StrikeoutRate}%`);
    console.log(`Walk Rate:       ${batter1.name} ${b1WalkRate}% vs ${batter2.name} ${b2WalkRate}%`);
    console.log();

    console.log('🏟️ TEAM & CAREER INFORMATION');
    console.log('─'.repeat(80));
    console.log(`${batter1.name} Teams: ${batter1.teams.join(' → ')}`);
    console.log(`${batter2.name} Teams: ${batter2.teams.join(' → ')}`);
    console.log();

    console.log('⚖️ STATISTICAL ANALYSIS');
    console.log('─'.repeat(80));
    
    // Determine statistical leaders
    const betterAverage = batter1.avg > batter2.avg ? batter1.name : 
                         batter2.avg > batter1.avg ? batter2.name : 'Tied';
    const betterOPS = batter1.ops > batter2.ops ? batter1.name : 
                     batter2.ops > batter1.ops ? batter2.name : 'Tied';
    const moreHomeRuns = batter1.homeRuns > batter2.homeRuns ? batter1.name : 
                        batter2.homeRuns > batter1.homeRuns ? batter2.name : 'Tied';
    const moreRBIs = batter1.rbis > batter2.rbis ? batter1.name : 
                    batter2.rbis > batter1.rbis ? batter2.name : 'Tied';
    
    console.log(`📊 Statistical Leaders:`);
    console.log(`   • Better Batting Average: ${betterAverage}`);
    console.log(`   • Better OPS: ${betterOPS}`);
    console.log(`   • More Home Runs: ${moreHomeRuns}`);
    console.log(`   • More RBIs: ${moreRBIs}`);
    console.log(`   • More Games: ${batter1.games > batter2.games ? batter1.name : batter2.name}`);
    console.log();

    console.log('🎯 CONCLUSION');
    console.log('─'.repeat(80));
    console.log(`Comparison between ${batter1.name} and ${batter2.name}:`);
    console.log();
    
    if (batter1.atBats === 0 && batter2.atBats === 0) {
        console.log('📊 STATUS: Both batters have insufficient career data for meaningful comparison');
        console.log('⏰ RECOMMENDATION: Re-evaluate when more career data is available');
    } else if (batter1.atBats === 0 || batter2.atBats === 0) {
        const establishedBatter = batter1.atBats > batter2.atBats ? batter1.name : batter2.name;
        const emergingBatter = batter1.atBats > batter2.atBats ? batter2.name : batter1.name;
        console.log(`📊 STATUS: ${establishedBatter} has established MLB career data`);
        console.log(`🔮 PROJECTION: ${emergingBatter} is in early career development phase`);
        console.log(`🏆 CURRENT EDGE: ${establishedBatter} (proven track record)`);
    } else {
        // Determine overall winner based on key metrics
        let batter1Points = 0;
        let batter2Points = 0;
        
        // Batting average comparison
        if (batter1.avg > batter2.avg) batter1Points++;
        else if (batter2.avg > batter1.avg) batter2Points++;
        
        // OPS comparison
        if (batter1.ops > batter2.ops) batter1Points++;
        else if (batter2.ops > batter1.ops) batter2Points++;
        
        // Home runs comparison
        if (batter1.homeRuns > batter2.homeRuns) batter1Points++;
        else if (batter2.homeRuns > batter1.homeRuns) batter2Points++;
        
        // RBIs comparison
        if (batter1.rbis > batter2.rbis) batter1Points++;
        else if (batter2.rbis > batter1.rbis) batter2Points++;
        
        // Games/Durability comparison
        if (batter1.games > batter2.games) batter1Points++;
        else if (batter2.games > batter1.games) batter2Points++;
        
        console.log('📊 STATUS: Both batters have sufficient data for statistical comparison');
        console.log();
        
        if (batter1Points > batter2Points) {
            console.log(`🏆 OVERALL WINNER: ${batter1.name}`);
            console.log(`📈 STATISTICAL EDGE: ${batter1Points}-${batter2Points} in key categories`);
            console.log(`� KEY STRENGTHS: ${batter1.name} leads in more critical batting metrics`);
        } else if (batter2Points > batter1Points) {
            console.log(`�🏆 OVERALL WINNER: ${batter2.name}`);
            console.log(`📈 STATISTICAL EDGE: ${batter2Points}-${batter1Points} in key categories`);
            console.log(`🎯 KEY STRENGTHS: ${batter2.name} leads in more critical batting metrics`);
        } else {
            console.log(`⚖️ STATISTICAL TIE: ${batter1Points}-${batter2Points} in key categories`);
            console.log(`🤝 CONCLUSION: Both batters have remarkably similar overall value`);
            console.log(`🎯 EDGE: Contest decided by specific situational needs or personal preference`);
        }
        
        console.log();
        
        // Career context analysis
        if (Math.abs(batter1.games - batter2.games) > 300) {
            const longevityLeader = batter1.games > batter2.games ? batter1.name : batter2.name;
            const otherBatter = batter1.games > batter2.games ? batter2.name : batter1.name;
            console.log(`📅 CAREER CONTEXT: ${longevityLeader} has significantly more career longevity`);
            console.log(`⚡ PEAK vs LONGEVITY: ${otherBatter} may have higher peak value per game`);
        }
        
        // Power differential analysis
        if (Math.abs(batter1.homeRuns - batter2.homeRuns) > 100) {
            const powerLeader = batter1.homeRuns > batter2.homeRuns ? batter1.name : batter2.name;
            const hrDiff = Math.abs(batter1.homeRuns - batter2.homeRuns);
            console.log(`💪 POWER DOMINANCE: ${powerLeader} has a significant power advantage (${hrDiff} more HRs)`);
        }
        
        // Average differential analysis  
        if (Math.abs(batter1.avg - batter2.avg) > 0.030) {
            const avgLeader = batter1.avg > batter2.avg ? batter1.name : batter2.name;
            const avgDiff = Math.abs(batter1.avg - batter2.avg).toFixed(3);
            console.log(`🎯 CONTACT DOMINANCE: ${avgLeader} has a significant batting average advantage (.${avgDiff.substring(2)} difference)`);
        }
    }
    
    console.log();
    console.log('⚾ Dynamic batter comparison complete!');
    console.log('═'.repeat(80));
}

// Execute the comparison
compareBatters().catch(error => {
    console.error('\n❌ Error during comparison:', error.message);
    process.exit(1);
});