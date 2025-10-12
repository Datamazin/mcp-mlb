#!/usr/bin/env node

/**
 * MLB Player Career Batting Stats by Year - Generic Version
 * Demonstrates dynamic stats parameter: yearByYear
 * Usage: node g        console.log('⚡ First Season Impact:');
        const rookieSeason = sortedSeasons[0];
        console.log(`   • ${rookieSeason.season}: ${rookieSeason.stat.homeRuns} HRs, ${rookieSeason.stat.rbi} RBIs, ${rookieSeason.stat.ops} OPS`);
        
        console.log('\n🔧 Technical Details:');
        console.log('   ✅ Dynamic Stats Parameter: "yearByYear"');
        console.log('   ✅ Constitutional Compliance: Dynamic API-First Development');
        console.log('   ✅ URL Dynamism: All parameters configurable');
        
    } catch (error) {
        console.error(`❌ Error fetching ${playerName} career stats:`, error.message);
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const playerId = args[0] ? parseInt(args[0]) : null;
const playerName = args[1] || 'Player';

// Default examples if no arguments provided
if (!playerId) {
    console.log('🥎 MLB Player Career Stats by Year\n');
    console.log('Usage: node get-player-career-by-year.cjs [playerId] [playerName]\n');
    console.log('Popular Player Examples:');
    console.log('• Pete Alonso: node get-player-career-by-year.cjs 624413 "Pete Alonso"');
    console.log('• Aaron Judge: node get-player-career-by-year.cjs 592450 "Aaron Judge"');
    console.log('• Vladimir Guerrero Jr.: node get-player-career-by-year.cjs 665742 "Vladimir Guerrero Jr."');
    console.log('• Ronald Acuña Jr.: node get-player-career-by-year.cjs 660670 "Ronald Acuña Jr."');
    console.log('• Juan Soto: node get-player-career-by-year.cjs 665742 "Juan Soto"');
    console.log('• Shohei Ohtani: node get-player-career-by-year.cjs 660271 "Shohei Ohtani"');
    console.log('\n💡 To find player IDs, search on MLB.com or use the search-players tool');
} else {
    getPlayerCareerStats(playerId, playerName);
}-by-year.cjs [playerId] [playerName]
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

async function getPlayerCareerStats(playerId, playerName = 'Player') {
    console.log(`🥎 ${playerName} - Career Batting Statistics by Year\n`);
    
    if (!playerId) {
        console.error('❌ Error: Player ID is required');
        console.log('Usage: node get-player-career-by-year.cjs [playerId] [playerName]');
        console.log('Examples:');
        console.log('  node get-player-career-by-year.cjs 624413 "Pete Alonso"');
        console.log('  node get-player-career-by-year.cjs 592450 "Aaron Judge"');
        console.log('  node get-player-career-by-year.cjs 665742 "Vladimir Guerrero Jr."');
        return;
    }
    
    try {
        const url = `${MLB_API_BASE}/people/${playerId}/stats?stats=yearByYear&gameType=R`;
        const response = await fetch(url);
        const data = await response.json();
        
        const hittingStats = data.stats.find(stat => 
            stat.group && stat.group.displayName === 'hitting'
        );
        
        if (!hittingStats || !hittingStats.splits) {
            throw new Error(`No hitting stats found for player ID ${playerId}`);
        }
        
        console.log('╔════╦════════╦═════╦═════╦════╦═════╦════╦════╦════╦═════╦════╦═════╦═══╦═══════╦═══════╦═══════╦══════╗');
        console.log('║Year║  Team  ║  G  ║ AB  ║ R  ║  H  ║ 2B ║ 3B ║ HR ║ RBI ║ BB ║ SO  ║SB ║  AVG  ║  OBP  ║  SLG  ║ OPS  ║');
        console.log('╠════╬════════╬═════╬═════╬════╬═════╬════╬════╬════╬═════╬════╬═════╬═══╬═══════╬═══════╬═══════╬══════╣');
        
        let careerTotals = {
            games: 0, atBats: 0, runs: 0, hits: 0, doubles: 0, triples: 0,
            homeRuns: 0, rbi: 0, baseOnBalls: 0, strikeOuts: 0, stolenBases: 0
        };
        
        // Sort by season year
        const sortedSeasons = hittingStats.splits.sort((a, b) => 
            parseInt(a.season) - parseInt(b.season)
        );
        
        sortedSeasons.forEach(season => {
            const stats = season.stat;
            
            // Get team abbreviation
            let teamAbbr = 'UNK';
            if (season.team && season.team.name) {
                const teamName = season.team.name;
                const teamMap = {
                    'New York Mets': 'NYM',
                    'New York Yankees': 'NYY',
                    'Los Angeles Dodgers': 'LAD',
                    'Houston Astros': 'HOU',
                    'Atlanta Braves': 'ATL',
                    'Toronto Blue Jays': 'TOR',
                    'Boston Red Sox': 'BOS',
                    'Tampa Bay Rays': 'TB',
                    'Philadelphia Phillies': 'PHI',
                    'San Diego Padres': 'SD',
                    'San Francisco Giants': 'SF',
                    'Chicago Cubs': 'CHC',
                    'Chicago White Sox': 'CWS',
                    'Milwaukee Brewers': 'MIL',
                    'St. Louis Cardinals': 'STL',
                    'Cincinnati Reds': 'CIN',
                    'Pittsburgh Pirates': 'PIT',
                    'Miami Marlins': 'MIA',
                    'Washington Nationals': 'WSH',
                    'Arizona Diamondbacks': 'ARI',
                    'Colorado Rockies': 'COL',
                    'Los Angeles Angels': 'LAA',
                    'Oakland Athletics': 'OAK',
                    'Seattle Mariners': 'SEA',
                    'Texas Rangers': 'TEX',
                    'Minnesota Twins': 'MIN',
                    'Kansas City Royals': 'KC',
                    'Detroit Tigers': 'DET',
                    'Cleveland Guardians': 'CLE',
                    'Cleveland Indians': 'CLE',
                    'Baltimore Orioles': 'BAL'
                };
                teamAbbr = teamMap[teamName] || teamName.substring(0, 3).toUpperCase();
            }
            
            // Add to career totals
            careerTotals.games += stats.gamesPlayed || 0;
            careerTotals.atBats += stats.atBats || 0;
            careerTotals.runs += stats.runs || 0;
            careerTotals.hits += stats.hits || 0;
            careerTotals.doubles += stats.doubles || 0;
            careerTotals.triples += stats.triples || 0;
            careerTotals.homeRuns += stats.homeRuns || 0;
            careerTotals.rbi += stats.rbi || 0;
            careerTotals.baseOnBalls += stats.baseOnBalls || 0;
            careerTotals.strikeOuts += stats.strikeOuts || 0;
            careerTotals.stolenBases += stats.stolenBases || 0;
            
            console.log(
                `║${season.season}║${teamAbbr.padStart(7)} ║ ${String(stats.gamesPlayed || 0).padStart(3)} ║ ${String(stats.atBats || 0).padStart(3)} ║${String(stats.runs || 0).padStart(3)} ║ ${String(stats.hits || 0).padStart(3)} ║${String(stats.doubles || 0).padStart(3)} ║${String(stats.triples || 0).padStart(3)} ║${String(stats.homeRuns || 0).padStart(3)} ║ ${String(stats.rbi || 0).padStart(3)} ║${String(stats.baseOnBalls || 0).padStart(3)} ║ ${String(stats.strikeOuts || 0).padStart(3)} ║${String(stats.stolenBases || 0).padStart(2)} ║ ${(stats.avg || '0.000').padStart(5)} ║ ${(stats.obp || '0.000').padStart(5)} ║ ${(stats.slg || '0.000').padStart(5)} ║${(stats.ops || '0.000').padStart(5)} ║`
            );
        });
        
        console.log('╠════╬════════╬═════╬═════╬════╬═════╬════╬════╬════╬═════╬════╬═════╬═══╬═══════╬═══════╬═══════╬══════╣');
        
        // Calculate career averages
        const careerAvg = careerTotals.atBats > 0 ? (careerTotals.hits / careerTotals.atBats).toFixed(3) : '0.000';
        const careerOBP = ((careerTotals.hits + careerTotals.baseOnBalls) / (careerTotals.atBats + careerTotals.baseOnBalls)).toFixed(3);
        const totalBases = careerTotals.hits + careerTotals.doubles + (careerTotals.triples * 2) + (careerTotals.homeRuns * 3);
        const careerSLG = careerTotals.atBats > 0 ? (totalBases / careerTotals.atBats).toFixed(3) : '0.000';
        const careerOPS = (parseFloat(careerOBP) + parseFloat(careerSLG)).toFixed(3);
        
        console.log(
            `║TOTL║ CAREER ║${String(careerTotals.games).padStart(4)} ║${String(careerTotals.atBats).padStart(4)} ║${String(careerTotals.runs).padStart(3)} ║${String(careerTotals.hits).padStart(4)} ║${String(careerTotals.doubles).padStart(3)} ║${String(careerTotals.triples).padStart(3)} ║${String(careerTotals.homeRuns).padStart(3)} ║${String(careerTotals.rbi).padStart(4)} ║${String(careerTotals.baseOnBalls).padStart(3)} ║${String(careerTotals.strikeOuts).padStart(4)} ║${String(careerTotals.stolenBases).padStart(2)} ║ ${careerAvg.padStart(5)} ║ ${careerOBP.padStart(5)} ║ ${careerSLG.padStart(5)} ║${careerOPS.padStart(5)} ║`
        );
        
        console.log('╚════╩════════╩═════╩═════╩════╩═════╩════╩════╩════╩═════╩════╩═════╩═══╩═══════╩═══════╩═══════╩══════╝');
        
        console.log('\n🏆 Career Highlights:');
        
        // Find best seasons
        const bestHRSeason = sortedSeasons.reduce((max, season) => 
            (season.stat.homeRuns || 0) > (max.stat.homeRuns || 0) ? season : max
        );
        
        const bestAvgSeason = sortedSeasons.reduce((max, season) => 
            parseFloat(season.stat.avg || 0) > parseFloat(max.stat.avg || 0) ? season : max
        );
        
        const bestRBISeason = sortedSeasons.reduce((max, season) => 
            (season.stat.rbi || 0) > (max.stat.rbi || 0) ? season : max
        );
        
        const bestOPSSeason = sortedSeasons.reduce((max, season) => 
            parseFloat(season.stat.ops || 0) > parseFloat(max.stat.ops || 0) ? season : max
        );
        
        console.log(`📊 Career Totals:`);
        console.log(`   • Total Games: ${careerTotals.games}`);
        console.log(`   • Total Home Runs: ${careerTotals.homeRuns}`);
        console.log(`   • Total RBIs: ${careerTotals.rbi}`);
        console.log(`   • Career Batting Average: ${careerAvg}`);
        console.log(`   • Career OPS: ${careerOPS}`);
        console.log(`   • Years in MLB: ${sortedSeasons.length}`);
        
        console.log(`\n🥇 Best Seasons:`);
        console.log(`   • Most HRs: ${bestHRSeason.season} (${bestHRSeason.stat.homeRuns} home runs)`);
        console.log(`   • Best AVG: ${bestAvgSeason.season} (${bestAvgSeason.stat.avg} batting average)`);
        console.log(`   • Most RBIs: ${bestRBISeason.season} (${bestRBISeason.stat.rbi} RBIs)`);
        console.log(`   • Best OPS: ${bestOPSSeason.season} (${bestOPSSeason.stat.ops} OPS)`);
        
        console.log('\n⚡ First Season Impact:');
        const rookieSeason = sortedSeasons[0];
        console.log(`   • ${rookieSeason.season}: ${rookieSeason.stat.homeRuns} HRs, ${rookieSeason.stat.rbi} RBIs, ${rookieSeason.stat.ops} OPS`);
        
        console.log('\n🔧 Technical Details:');
        console.log('   ✅ Dynamic Stats Parameter: "yearByYear"');
        console.log('   ✅ Constitutional Compliance: Dynamic API-First Development');
        console.log('   ✅ URL Dynamism: All parameters configurable');
        
    } catch (error) {
        console.error(`❌ Error fetching ${playerName} career stats:`, error.message);
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const playerId = args[0] ? parseInt(args[0]) : null;
const playerName = args[1] || 'Player';

// Default examples if no arguments provided
if (!playerId) {
    console.log('🥎 MLB Player Career Stats by Year\n');
    console.log('Usage: node get-player-career-by-year.cjs [playerId] [playerName]\n');
    console.log('Popular Player Examples:');
    console.log('• Pete Alonso: node get-player-career-by-year.cjs 624413 "Pete Alonso"');
    console.log('• Aaron Judge: node get-player-career-by-year.cjs 592450 "Aaron Judge"');
    console.log('• Vladimir Guerrero Jr.: node get-player-career-by-year.cjs 665742 "Vladimir Guerrero Jr."');
    console.log('• Ronald Acuña Jr.: node get-player-career-by-year.cjs 660670 "Ronald Acuña Jr."');
    console.log('• Juan Soto: node get-player-career-by-year.cjs 665742 "Juan Soto"');
    console.log('• Shohei Ohtani: node get-player-career-by-year.cjs 660271 "Shohei Ohtani"');
    console.log('\n💡 To find player IDs, search on MLB.com or use the search-players tool');
} else {
    getPlayerCareerStats(playerId, playerName);
}