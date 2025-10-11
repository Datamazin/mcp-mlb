// Test MLB.com integration features in the enhanced MCP server
const { spawn } = require('child_process');

async function testMLBcomIntegration() {
  console.log(`🌐 MLB.com Integration Test`);
  console.log(`📅 Testing enhanced MCP server with MLB.com resource links\n`);
  
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  let requestId = 2;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id >= 2) {
          const testCases = [
            'MLB.com Team Links (Mets)',
            'MLB.com Player Links (Pete Alonso)',
            'Enhanced Player Info with MLB.com',
            'Enhanced Team Info with MLB.com',
            'MLB.com Schedule Links',
            'MLB.com News Links'
          ];
          
          const testIndex = response.id - 2;
          const testCase = testCases[testIndex];
          
          console.log(`🎯 ${testCase}:`);
          console.log('=' .repeat(60));
          
          try {
            const content = JSON.parse(response.result.content[0].text);
            
            if (testCase.includes('Team Links')) {
              console.log(`🏟️  Primary URL: ${content.primaryUrl}`);
              console.log(`📋 Description: ${content.description}\n`);
              console.log(`🔗 Related MLB.com Pages:`);
              content.relatedUrls.forEach((link, idx) => {
                console.log(`   ${idx + 1}. ${link.title}: ${link.url}`);
                console.log(`      📝 ${link.description}`);
              });
              
            } else if (testCase.includes('Player Links')) {
              console.log(`👤 Primary URL: ${content.primaryUrl}`);
              console.log(`📋 Description: ${content.description}\n`);
              console.log(`🔗 Related MLB.com Pages:`);
              content.relatedUrls.forEach((link, idx) => {
                console.log(`   ${idx + 1}. ${link.title}: ${link.url}`);
                console.log(`      📝 ${link.description}`);
              });
              
            } else if (testCase.includes('Enhanced Player')) {
              console.log(`👤 Player: ${content.player.fullName}`);
              console.log(`🏟️  Team: ${content.player.currentTeam?.name || 'N/A'}`);
              console.log(`📍 Position: ${content.player.primaryPosition.name}\n`);
              
              if (content.mlbComLinks) {
                console.log(`🌐 MLB.com Profile Links:`);
                console.log(`   🏠 Profile: ${content.mlbComLinks.profileUrl}`);
                console.log(`   📊 Stats: ${content.mlbComLinks.statsUrl}`);
                console.log(`   📅 Game Logs: ${content.mlbComLinks.gameLogsUrl}`);
                console.log(`   📖 Bio: ${content.mlbComLinks.bioUrl}`);
                if (content.mlbComLinks.teamUrl) {
                  console.log(`   🏟️  Team Page: ${content.mlbComLinks.teamUrl}`);
                }
              }
              
            } else if (testCase.includes('Enhanced Team')) {
              console.log(`🏟️  Team: ${content.team.name}`);
              console.log(`🏛️  Division: ${content.team.division.name}`);
              console.log(`🏟️  Venue: ${content.team.venue?.name || 'N/A'}\n`);
              
              if (content.mlbComLinks) {
                console.log(`🌐 MLB.com Team Pages:`);
                console.log(`   🏠 Team Home: ${content.mlbComLinks.teamUrl}`);
                console.log(`   📅 Schedule: ${content.mlbComLinks.scheduleUrl}`);
                console.log(`   👥 Roster: ${content.mlbComLinks.rosterUrl}`);
                console.log(`   📊 Stats: ${content.mlbComLinks.statsUrl}`);
                console.log(`   📰 News: ${content.mlbComLinks.newsUrl}`);
                console.log(`   🎫 Tickets: ${content.mlbComLinks.ticketsUrl}`);
              }
              
            } else if (testCase.includes('Schedule Links')) {
              console.log(`📅 Primary URL: ${content.primaryUrl}`);
              console.log(`📋 Description: ${content.description}\n`);
              console.log(`🔗 Schedule-Related Pages:`);
              content.relatedUrls.forEach((link, idx) => {
                console.log(`   ${idx + 1}. ${link.title}: ${link.url}`);
                console.log(`      📝 ${link.description}`);
              });
              
            } else if (testCase.includes('News Links')) {
              console.log(`📰 Primary URL: ${content.primaryUrl}`);
              console.log(`📋 Description: ${content.description}\n`);
              console.log(`🔗 News Categories:`);
              content.relatedUrls.forEach((link, idx) => {
                console.log(`   ${idx + 1}. ${link.title}: ${link.url}`);
                console.log(`      📝 ${link.description}`);
              });
            }
            
          } catch (parseError) {
            console.log(`❌ Could not parse response data`);
          }
          
          console.log('\n');
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Making request to:') && !message.includes('MLB MCP Server')) {
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
        name: "mlb-com-integration-test",
        version: "1.0.0"
      }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Test different MLB.com integration features
  const testRequests = [
    // Test 1: Get MLB.com team links for Mets
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get-mlb-com-links",
        arguments: {
          linkType: "team",
          teamId: 121 // Mets
        }
      }
    },
    // Test 2: Get MLB.com player links for Pete Alonso
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get-mlb-com-links",
        arguments: {
          linkType: "player",
          playerId: 624413 // Pete Alonso
        }
      }
    },
    // Test 3: Get enhanced player info with MLB.com links
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "get-enhanced-player-info",
        arguments: {
          playerId: 624413, // Pete Alonso
          includeMLBcomLinks: true,
          season: 2024
        }
      }
    },
    // Test 4: Get enhanced team info with MLB.com links
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "get-enhanced-team-info",
        arguments: {
          teamId: 121, // Mets
          includeMLBcomLinks: true,
          includeCurrentStats: true
        }
      }
    },
    // Test 5: Get MLB.com schedule links
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "get-mlb-com-links",
        arguments: {
          linkType: "schedule"
        }
      }
    },
    // Test 6: Get MLB.com news links
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "get-mlb-com-links",
        arguments: {
          linkType: "news"
        }
      }
    }
  ];
  
  setTimeout(() => {
    testRequests.forEach((request, index) => {
      setTimeout(() => {
        server.stdin.write(JSON.stringify(request) + '\n');
      }, index * 2000);
    });
  }, 1000);
  
  // Close after testing
  setTimeout(() => {
    console.log('=' .repeat(80));
    console.log('🌐 MLB.com Integration Summary');
    console.log('=' .repeat(80));
    console.log('✅ NEW FEATURES ADDED:');
    console.log('   🔗 get-mlb-com-links: Generate official MLB.com URLs');
    console.log('   👤 get-enhanced-player-info: Player data + MLB.com profile links');
    console.log('   🏟️  get-enhanced-team-info: Team data + MLB.com team pages');
    console.log('');
    console.log('🎯 MLB.com RESOURCE CATEGORIES:');
    console.log('   📰 News & Analysis | 📊 Statistics & Leaders');
    console.log('   📅 Schedules & Games | 🏆 Postseason Coverage');
    console.log('   👥 Player Profiles | 🏟️  Team Pages');
    console.log('   🎫 Tickets & Events | 🔍 Prospects & Draft');
    console.log('');
    console.log('🚀 Your MCP server now integrates with MLB.com official resources!');
    console.log('=' .repeat(80));
    
    server.kill();
  }, 14000);
}

testMLBcomIntegration().catch(console.error);