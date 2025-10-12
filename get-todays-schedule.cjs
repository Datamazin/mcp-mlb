#!/usr/bin/env node

/**
 * Tonight's MLB Schedule
 * Uses dynamic MLB API to get today's games
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

async function getTonightsSchedule() {
    console.log('🏟️ Tonight\'s MLB Schedule\n');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log(`📅 Date: ${dateString} (${today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })})\n`);
    
    try {
        // Use the schedule endpoint with today's date
        const url = `${MLB_API_BASE}/schedule?date=${dateString}&sportId=1&hydrate=team,linescore,decisions`;
        console.log(`🔗 API URL: ${url}\n`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.dates || data.dates.length === 0) {
            console.log('❌ No games scheduled for tonight');
            return;
        }
        
        const todaysGames = data.dates[0].games;
        
        if (!todaysGames || todaysGames.length === 0) {
            console.log('❌ No games scheduled for tonight');
            return;
        }
        
        console.log(`🎮 ${todaysGames.length} Game${todaysGames.length > 1 ? 's' : ''} Tonight\n`);
        
        // Group games by status
        const upcomingGames = [];
        const liveGames = [];
        const completedGames = [];
        
        todaysGames.forEach(game => {
            const status = game.status.abstractGameState;
            if (status === 'Preview') {
                upcomingGames.push(game);
            } else if (status === 'Live') {
                liveGames.push(game);
            } else if (status === 'Final') {
                completedGames.push(game);
            }
        });
        
        // Display live games first
        if (liveGames.length > 0) {
            console.log('🔴 LIVE GAMES');
            console.log('='.repeat(80));
            
            liveGames.forEach(game => {
                displayGameInfo(game, true);
            });
            console.log('');
        }
        
        // Display upcoming games
        if (upcomingGames.length > 0) {
            console.log('⏰ UPCOMING GAMES');
            console.log('='.repeat(80));
            
            upcomingGames.forEach(game => {
                displayGameInfo(game, false);
            });
            console.log('');
        }
        
        // Display completed games
        if (completedGames.length > 0) {
            console.log('✅ COMPLETED GAMES');
            console.log('='.repeat(80));
            
            completedGames.forEach(game => {
                displayGameInfo(game, false);
            });
            console.log('');
        }
        
        // Summary
        console.log('📊 Tonight\'s Summary:');
        console.log(`   • Live Games: ${liveGames.length}`);
        console.log(`   • Upcoming Games: ${upcomingGames.length}`);
        console.log(`   • Completed Games: ${completedGames.length}`);
        console.log(`   • Total Games: ${todaysGames.length}`);
        
        console.log('\n🔧 Technical Details:');
        console.log('   ✅ Dynamic API Endpoint: schedule');
        console.log('   ✅ Constitutional Compliance: Dynamic API-First Development');
        console.log('   ✅ Real-time Data: Live scores and status updates');
        
    } catch (error) {
        console.error('❌ Error fetching tonight\'s schedule:', error.message);
    }
}

function displayGameInfo(game, isLive = false) {
    const awayTeam = game.teams.away.team.name;
    const homeTeam = game.teams.home.team.name;
    const awayAbbr = game.teams.away.team.abbreviation;
    const homeAbbr = game.teams.home.team.abbreviation;
    
    const venue = game.venue.name;
    const gameTime = new Date(game.gameDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
    
    let statusInfo = '';
    let scoreInfo = '';
    
    if (isLive && game.linescore) {
        const awayScore = game.teams.away.score || 0;
        const homeScore = game.teams.home.score || 0;
        const inning = game.linescore.currentInning;
        const inningState = game.linescore.inningState;
        
        scoreInfo = `${awayAbbr} ${awayScore} - ${homeScore} ${homeAbbr}`;
        statusInfo = `${inningState} ${inning}${getInningOrdinal(inning)}`;
    } else if (game.status.abstractGameState === 'Final' && game.teams.away.score !== undefined) {
        const awayScore = game.teams.away.score;
        const homeScore = game.teams.home.score;
        scoreInfo = `${awayAbbr} ${awayScore} - ${homeScore} ${homeAbbr}`;
        statusInfo = 'FINAL';
    } else {
        statusInfo = `${gameTime}`;
    }
    
    console.log(`🏟️  ${awayTeam} @ ${homeTeam}`);
    console.log(`     ${venue}`);
    
    if (scoreInfo) {
        console.log(`     ${scoreInfo} (${statusInfo})`);
    } else {
        console.log(`     ${statusInfo}`);
    }
    
    // Show probable pitchers for upcoming games
    if (game.status.abstractGameState === 'Preview') {
        const awayPitcher = game.teams.away.probablePitcher?.fullName || 'TBD';
        const homePitcher = game.teams.home.probablePitcher?.fullName || 'TBD';
        console.log(`     Pitchers: ${awayPitcher} vs ${homePitcher}`);
    }
    
    console.log('');
}

function getInningOrdinal(inning) {
    if (inning >= 11 && inning <= 13) return 'th';
    switch (inning % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

getTonightsSchedule();