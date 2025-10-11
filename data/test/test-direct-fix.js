import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';

async function testDirectFix() {
  console.log('🔧 Testing direct fix for home run data...');
  
  // Start the MCP server using the compiled build
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
    console.log('🔌 Connected to MLB MCP Server');

    // Test visualization tool with Pete Alonso home runs
    console.log('📊 Testing visualization tool...');
    const result = await client.callTool('visualize-player-stats', {
      playerId: 624413,
      season: 2024,
      gameType: 'R',
      statCategory: 'homeRuns',
      chartType: 'bar',
      saveToFile: false
    });

    console.log('📋 Visualization result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    try {
      await client.close();
      serverProcess.kill();
    } catch (e) {
      serverProcess.kill('SIGKILL');
    }
  }
}

testDirectFix();