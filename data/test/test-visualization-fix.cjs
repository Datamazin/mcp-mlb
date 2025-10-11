// Direct test of the compiled MCP server
const { spawn } = require('child_process');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

async function testVisualizationFix() {
  console.log('🔧 Testing visualization fix...');
  
  // Start the MCP server
  const serverProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const transport = new StdioClientTransport({
    stdin: serverProcess.stdin,
    stdout: serverProcess.stdout,
    stderr: serverProcess.stderr
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  try {
    await client.connect(transport);
    console.log('🔌 Connected to MCP Server');

    // Test the visualization tool
    console.log('📊 Testing Pete Alonso home runs visualization...');
    const result = await client.callTool('visualize-player-stats', {
      playerId: 624413,
      season: 2024,
      gameType: 'R',
      statCategory: 'homeRuns',
      chartType: 'bar',
      saveToFile: false
    });

    console.log('📋 Result:');
    if (result.content && result.content[0]) {
      const content = result.content[0];
      if (content.type === 'text') {
        console.log('Text result:', content.text);
      } else if (content.type === 'image') {
        console.log('✅ Successfully generated chart!');
        console.log('Image format:', content.mimeType);
        console.log('Data length:', content.data ? content.data.length : 'No data');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
    serverProcess.kill();
  }
}

testVisualizationFix().catch(console.error);