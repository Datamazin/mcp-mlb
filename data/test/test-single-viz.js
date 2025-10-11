// Simple test for one visualization
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';

async function testSingleVisualization() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'viz-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('🔌 Connected to MLB MCP Server');

    // Test with Pete Alonso home runs - simple test
    console.log('\n📊 Testing visualization for Pete Alonso home runs...');
    
    const result = await client.callTool({
      name: 'visualize-player-stats',
      arguments: {
        playerId: 624413,
        season: 2024,
        gameType: 'R',
        statCategory: 'homeRuns',
        chartType: 'bar'
      }
    });

    console.log('📋 Result received!');
    
    const data = result.content[0];
    if (data.type === 'text') {
      const resultData = JSON.parse(data.text);
      console.log(`✅ Chart Generated Successfully!`);
      console.log(`   Total Games: ${resultData.totalGames}`);
      console.log(`   Statistics:`);
      console.log(`     Min: ${resultData.statSummary.min}`);
      console.log(`     Max: ${resultData.statSummary.max}`);
      console.log(`     Average: ${resultData.statSummary.average}`);
      console.log(`     Total: ${resultData.statSummary.total}`);
      
      // Check if file was saved automatically
      if (resultData.savedFile) {
        console.log(`   📁 Chart automatically saved to: ${resultData.savedFile}`);
      } else {
        // Manual save as fallback
        const imageData = resultData.chartUrl.split(',')[1];
        const filePath = 'data/visualizations/pete-alonso-homeruns-2024-chart.png';
        fs.writeFileSync(filePath, imageData, 'base64');
        console.log(`   📁 Chart manually saved to: ${filePath}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

console.log('🎯 Testing single visualization...\n');
testSingleVisualization().catch(console.error);