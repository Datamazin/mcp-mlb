// Test the MCP server visualization tool directly
const fs = require('fs');
const { exec } = require('child_process');

// Create a simple MCP request for visualization
const mcpRequest = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "visualize-player-stats",
    "arguments": {
      "playerId": 624413,
      "season": 2024,
      "gameType": "R", 
      "statCategory": "homeRuns",
      "chartType": "bar",
      "saveToFile": true,
      "filename": "pete-alonso-homeruns-2024-mcp-test"
    }
  }
};

console.log('🧪 Testing MCP server visualization tool...');
console.log('📊 Request:', JSON.stringify(mcpRequest, null, 2));

// Start the server and send the request
const child = exec('node build/index.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Server error:', error);
    return;
  }
  if (stderr) {
    console.error('❌ Server stderr:', stderr);
  }
});

// Send the MCP request
child.stdin.write(JSON.stringify(mcpRequest) + '\n');

// Listen for response
child.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('📋 MCP Response received');
    
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      
      if (content.type === 'image') {
        console.log('✅ Successfully generated chart via MCP!');
        console.log('📊 Image format:', content.mimeType);
        console.log('📏 Data length:', content.data ? content.data.length : 'No data');
        
        // If it's a base64 image, we could save it
        if (content.data && content.mimeType === 'image/png') {
          const imageBuffer = Buffer.from(content.data, 'base64');
          fs.writeFileSync('data/visualizations/pete-alonso-mcp-test.png', imageBuffer);
          console.log('💾 Saved chart to: data/visualizations/pete-alonso-mcp-test.png');
        }
      } else if (content.type === 'text') {
        console.log('📝 Text response:', content.text);
      }
    } else if (response.error) {
      console.error('❌ MCP Error:', response.error);
    }
  } catch (parseError) {
    console.log('📄 Raw response:', data.toString());
    console.error('❌ Parse error:', parseError.message);
  }
  
  // Close the server
  child.kill();
});

// Handle server startup
setTimeout(() => {
  console.log('⏱️ Sending request after 2 second delay...');
}, 2000);