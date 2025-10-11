// Quick test of the fixed player lookup functionality
const { spawn } = require('child_process');

async function testPlayerLookup() {
  console.log('🔍 Testing Fixed Player Lookup Functionality...\n');
  
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });
  
  const testCases = [
    {
      name: "Aaron Judge",
      searchTerm: "judge"
    },
    {
      name: "Pete Alonso", 
      searchTerm: "alonso"
    },
    {
      name: "Shohei Ohtani",
      searchTerm: "ohtani"
    }
  ];
  
  let currentTest = 0;
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.result && response.id > 1) {
          const testCase = testCases[response.id - 2];
          if (!testCase) return;
          
          if (response.result.content) {
            const content = JSON.parse(response.result.content[0].text);
            console.log(`✅ ${testCase.name} Search Results:`);
            
            if (content.players && content.players.length > 0) {
              console.log(`   Found ${content.players.length} players:`);
              content.players.slice(0, 5).forEach((player, idx) => {
                console.log(`     ${idx + 1}. ${player.fullName} (ID: ${player.id})`);
                console.log(`        Position: ${player.primaryPosition?.name || 'Unknown'}`);
                console.log(`        Team: ${player.currentTeam?.name || 'No current team'}`);
                console.log(`        Active: ${player.active ? 'Yes' : 'No'}`);
              });
            } else {
              console.log(`   No players found`);
            }
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
  
  // Initialize
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "player-lookup-test", version: "1.0.0" }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
  
  // Send test requests
  setTimeout(() => {
    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        const request = {
          jsonrpc: "2.0",
          id: index + 2,
          method: "tools/call",
          params: {
            name: "lookup-player",
            arguments: {
              searchTerm: testCase.searchTerm
            }
          }
        };
        
        console.log(`🔍 Searching for: ${testCase.name} ("${testCase.searchTerm}")...`);
        server.stdin.write(JSON.stringify(request) + '\n');
      }, index * 2000);
    });
    
    setTimeout(() => {
      server.kill();
      console.log('🎉 Player lookup test completed!');
    }, testCases.length * 2000 + 3000);
    
  }, 1000);
}

testPlayerLookup().catch(console.error);