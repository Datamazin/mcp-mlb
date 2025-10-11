// Test the enhanced MCP server with the new get-team-roster tool
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('🧪 Testing Enhanced MLB MCP Server with Historical Roster Data...\n');
  
  // Start the MCP server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  // Test cases
  const testCases = [
    {
      name: "1985 Mets Roster (World Series Champions)",
      method: "tools/call",
      params: {
        name: "get-team-roster",
        arguments: {
          teamName: "mets",
          season: 1985
        }
      }
    },
    {
      name: "1998 Yankees Roster (125-win season)",
      method: "tools/call", 
      params: {
        name: "get-team-roster",
        arguments: {
          teamName: "yankees",
          season: 1998
        }
      }
    },
    {
      name: "Current Dodgers Roster",
      method: "tools/call",
      params: {
        name: "get-team-roster", 
        arguments: {
          teamName: "dodgers"
        }
      }
    }
  ];
  
  let testIndex = 0;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.result.content) {
          const content = JSON.parse(response.result.content[0].text);
          console.log(`✅ ${testCases[testIndex - 1]?.name || 'Test'} Results:`);
          console.log(`   Team: ${content.team} (${content.season})`);
          console.log(`   Total Players: ${content.totalPlayers}`);
          console.log(`   Position Players: ${content.positionPlayers.length}`);
          console.log(`   Pitchers: ${content.pitchers.length}`);
          
          // Show sample players
          if (content.positionPlayers.length > 0) {
            console.log(`   Sample Hitters:`);
            content.positionPlayers.slice(0, 5).forEach((player, idx) => {
              console.log(`     ${idx + 1}. ${player.name} (${player.position}) #${player.jerseyNumber}`);
            });
          }
          console.log('');
        }
        
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  });
  
  server.stderr.on('data', (data) => {
    console.error(`❌ Server Error: ${data}`);
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
        name: "test-client",
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
      }, index * 2000);
    });
    
    // Close after all tests
    setTimeout(() => {
      server.kill();
      console.log('🎉 Test completed!');
    }, testCases.length * 2000 + 3000);
    
  }, 1000);
}

testMCPServer().catch(console.error);