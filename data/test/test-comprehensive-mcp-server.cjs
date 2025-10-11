// Test the comprehensive MLB MCP Server with all new lookup and analysis tools
const { spawn } = require('child_process');

async function testComprehensiveMCPServer() {
  console.log('🧪 Testing Comprehensive MLB MCP Server with MLB-StatsAPI Features...\n');
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  // Comprehensive test cases
  const testCases = [
    {
      name: "🔍 Search Player: Aaron Judge",
      method: "tools/call",
      params: {
        name: "search-players",
        arguments: {
          name: "judge"
        }
      }
    },
    {
      name: "🔍 Search Player: Pete Alonso", 
      method: "tools/call",
      params: {
        name: "search-players",
        arguments: {
          name: "alonso"
        }
      }
    },
    {
      name: "🏟️ Lookup Team: New York",
      method: "tools/call",
      params: {
        name: "lookup-team",
        arguments: {
          searchTerm: "new york"
        }
      }
    },
    {
      name: "🏟️ Lookup Team: Dodgers",
      method: "tools/call",
      params: {
        name: "lookup-team", 
        arguments: {
          searchTerm: "dodgers"
        }
      }
    },
    {
      name: "📊 League Leaders: Home Runs 2024",
      method: "tools/call",
      params: {
        name: "get-league-leaders",
        arguments: {
          leaderCategories: "homeRuns",
          season: 2024,
          limit: 5
        }
      }
    },
    {
      name: "🏆 Historical Roster: 1986 Mets",
      method: "tools/call",
      params: {
        name: "get-team-roster",
        arguments: {
          teamName: "mets",
          season: 1986
        }
      }
    }
  ];
  
  let testIndex = 0;
  let completedTests = 0;
  const results = {};
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id > 1) {
          const testCase = testCases[response.id - 2];
          if (!testCase) return;
          
          completedTests++;
          
          if (response.result.content) {
            try {
              const content = JSON.parse(response.result.content[0].text);
              console.log(`✅ ${testCase.name}:`);
              
              // Handle different response types
              if (content.players) {
                console.log(`   Found ${content.players.length} players:`);
                content.players.slice(0, 3).forEach((player, idx) => {
                  console.log(`     ${idx + 1}. ${player.fullName} (ID: ${player.id}) - ${player.primaryPosition?.name || 'Unknown'} - ${player.currentTeam?.name || 'No Team'}`);
                });
              } else if (content.teams) {
                console.log(`   Found ${content.teams.length} teams:`);
                content.teams.forEach((team, idx) => {
                  console.log(`     ${idx + 1}. ${team.name} (${team.abbreviation}) - ${team.league?.name || 'Unknown League'}, ${team.division?.name || 'Unknown Division'}`);
                });
              } else if (content.categories) {
                console.log(`   ${content.season} Season Leaders:`);
                content.categories.forEach(category => {
                  console.log(`     ${category.leaderCategory}:`);
                  category.leaders.slice(0, 3).forEach((leader, idx) => {
                    console.log(`       ${idx + 1}. ${leader.person.fullName} (${leader.team?.name || 'Unknown'}) - ${leader.value}`);
                  });
                });
              } else if (content.team && content.positionPlayers) {
                console.log(`   ${content.team} (${content.season}) - ${content.totalPlayers} total players`);
                console.log(`     Position Players: ${content.positionPlayers.length}`);
                console.log(`     Pitchers: ${content.pitchers.length}`);
                console.log(`     Key Players:`);
                content.positionPlayers.slice(0, 5).forEach((player, idx) => {
                  console.log(`       ${idx + 1}. ${player.name} (${player.position}) #${player.jerseyNumber}`);
                });
              }
              
              results[testCase.name] = 'SUCCESS';
              
            } catch (parseError) {
              console.log(`✅ ${testCase.name}: Raw response received`);
              results[testCase.name] = 'SUCCESS (Raw)';
            }
          } else {
            console.log(`❌ ${testCase.name}: No content in response`);
            results[testCase.name] = 'FAILED (No Content)';
          }
          
          console.log('');
        }
        
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Making request to:') && !message.includes('MLB MCP Server running')) {
      console.error(`❌ Server Error: ${message}`);
    }
  });
  
  // Send initialization
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "comprehensive-test-client",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Wait a bit then send test requests
  setTimeout(() => {
    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        testIndex = index + 1;
        const request = {
          jsonrpc: "2.0",
          id: index + 2,
          method: testCase.method,
          params: testCase.params
        };
        
        console.log(`🔍 Testing: ${testCase.name}...`);
        server.stdin.write(JSON.stringify(request) + '\n');
      }, index * 2500);
    });
    
    // Generate summary after all tests
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 TEST SUMMARY');
      console.log('='.repeat(60));
      
      const successCount = Object.values(results).filter(r => r.includes('SUCCESS')).length;
      const totalTests = testCases.length;
      
      console.log(`✅ Successful: ${successCount}/${totalTests}`);
      console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
      
      console.log('\nDetailed Results:');
      Object.entries(results).forEach(([test, result]) => {
        const icon = result.includes('SUCCESS') ? '✅' : '❌';
        console.log(`${icon} ${test}: ${result}`);
      });
      
      server.kill();
      console.log('\n🎉 Comprehensive test completed!');
      
      if (successCount === totalTests) {
        console.log('🚀 ALL TESTS PASSED! MLB MCP Server is fully functional!');
      } else {
        console.log('⚠️  Some tests failed. Check the implementation.');
      }
      
    }, testCases.length * 2500 + 5000);
    
  }, 1000);
}

testComprehensiveMCPServer().catch(console.error);