// Check MLB schedule for games around current date
const { spawn } = require('child_process');

async function checkMLBSchedule() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Check a range of dates to find games
  const dates = [];
  for (let i = -5; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push({
      dateStr: date.toISOString().split('T')[0],
      label: i === 0 ? 'TODAY' : i === -1 ? 'Yesterday' : i === 1 ? 'Tomorrow' : 
             i < 0 ? `${Math.abs(i)} days ago` : `${i} days from now`
    });
  }
  
  console.log(`⚾ MLB Schedule Check`);
  console.log(`📅 Checking dates: ${dates[0].dateStr} to ${dates[dates.length-1].dateStr}`);
  console.log(`🎯 Focus: ${todayStr} (${today.toDateString()})\n`);
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let requestId = 2;
  let gamesFound = 0;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id >= 2) {
          const dateIndex = response.id - 2;
          const dateInfo = dates[dateIndex];
          
          if (!dateInfo) return;
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.games && content.games.length > 0) {
              gamesFound += content.games.length;
              console.log(`📅 ${dateInfo.label} (${dateInfo.dateStr}):`);
              console.log(`   🎯 Found ${content.games.length} games:\n`);
              
              content.games.forEach((game, idx) => {
                const awayTeam = game.teams.away.team.name;
                const homeTeam = game.teams.home.team.name;
                const status = game.status.detailedState;
                const gameTime = new Date(game.gameDate).toLocaleTimeString();
                const gameDate = new Date(game.gameDate).toLocaleDateString();
                
                console.log(`   ${idx + 1}. ${awayTeam} @ ${homeTeam}`);
                console.log(`      📍 ${game.venue.name}`);
                console.log(`      📊 Status: ${status}`);
                console.log(`      🕐 Time: ${gameDate} ${gameTime}`);
                
                // Show game type if it's not regular season
                if (game.gameType && game.gameType !== 'R') {
                  const gameTypes = {
                    'S': 'Spring Training',
                    'P': 'Playoff',
                    'D': 'Division Series',
                    'L': 'League Championship',
                    'W': 'World Series'
                  };
                  console.log(`      🏆 Type: ${gameTypes[game.gameType] || game.gameType}`);
                }
                
                // Show scores for completed or in-progress games
                if (game.teams.away.score !== undefined || game.teams.home.score !== undefined) {
                  const awayScore = game.teams.away.score || 0;
                  const homeScore = game.teams.home.score || 0;
                  console.log(`      ⚾ Score: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
                  
                  if (status.includes('Final')) {
                    const winner = awayScore > homeScore ? awayTeam : homeTeam;
                    console.log(`      🏆 Winner: ${winner}`);
                  }
                }
                
                // Highlight live games
                if (status.includes('In Progress') || status.includes('Live')) {
                  console.log(`      🔴 ** LIVE GAME! **`);
                }
                
                console.log('');
              });
            }
            
          } catch (parseError) {
            // Silently skip parsing errors for dates with no games
          }
        }
        
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Making request to:') && !message.includes('MLB MCP Server running')) {
      console.error(`❌ Error: ${message}`);
    }
  });
  
  // Initialize MCP server
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mlb-schedule-checker",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Send schedule requests for each date
  setTimeout(() => {
    dates.forEach((dateInfo, index) => {
      setTimeout(() => {
        const scheduleRequest = {
          jsonrpc: "2.0",
          id: requestId++,
          method: "tools/call",
          params: {
            name: "get-schedule",
            arguments: {
              startDate: dateInfo.dateStr,
              endDate: dateInfo.dateStr,
              sportId: 1
            }
          }
        };
        
        server.stdin.write(JSON.stringify(scheduleRequest) + '\n');
      }, index * 800);
    });
  }, 1000);
  
  // Close after processing all requests
  setTimeout(() => {
    console.log('=' .repeat(60));
    console.log('📊 MLB Schedule Summary');
    console.log('=' .repeat(60));
    console.log(`📅 Date Range: ${dates[0].dateStr} to ${dates[dates.length-1].dateStr}`);
    console.log(`🎯 Total Games Found: ${gamesFound}`);
    console.log(`🕐 Report Generated: ${today.toLocaleString()}`);
    
    if (gamesFound === 0) {
      console.log('\n📋 No games found in the checked date range.');
      console.log('   This could indicate:');
      console.log('   🏆 Postseason break between series');
      console.log('   ❄️  Off-season period');
      console.log('   📅 All-Star break or scheduled off days');
      console.log('   🌍 International games or special events');
    }
    
    // Provide seasonal context
    const month = today.getMonth() + 1;
    console.log('\n📋 Seasonal Context:');
    if (month === 10) {
      console.log('   🍂 October: MLB Postseason (Division Series, Championship Series)');
    } else if (month === 11) {
      console.log('   🏆 November: World Series and Off-Season begins');
    } else if (month >= 12 || month <= 2) {
      console.log('   ❄️  Winter: MLB Off-Season');
    } else if (month >= 3 && month <= 4) {
      console.log('   🌸 Spring: Training and Season Start');
    } else {
      console.log('   ⚾ Regular Season period');
    }
    
    console.log('=' .repeat(60));
    server.kill();
  }, dates.length * 800 + 5000);
}

checkMLBSchedule().catch(console.error);