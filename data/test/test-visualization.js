// Test the new visualization functionality
// Generate charts for player game-by-game statistics

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';

async function testVisualization() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
  });

  const client = new Client({
    name: 'visualization-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('🔌 Connected to MLB MCP Server');

    // Test visualization for Pete Alonso's home runs in 2024
    console.log('\n📊 Generating Home Run visualization for Pete Alonso 2024...');
    
    const homeRunResult = await client.callTool({
      name: 'visualize-player-stats',
      arguments: {
        playerId: 624413, // Pete Alonso
        season: 2024,
        gameType: 'R',
        statCategory: 'homeRuns',
        chartType: 'bar',
        title: 'Pete Alonso - Home Runs by Game (2024)'
      }
    });

    const homeRunData = homeRunResult.content[0];
    if (homeRunData.type === 'text') {
      const result = JSON.parse(homeRunData.text);
      console.log(`✅ Home Run Chart Generated!`);
      console.log(`   Total Games: ${result.totalGames}`);
      console.log(`   Min: ${result.statSummary.min}, Max: ${result.statSummary.max}`);
      console.log(`   Average: ${result.statSummary.average}, Total: ${result.statSummary.total}`);
      
      // Check if file was automatically saved
      if (result.savedFile) {
        console.log(`   📁 Automatically saved to: ${result.savedFile}`);
      } else {
        // Manual save as fallback
        const homeRunImageData = result.chartUrl.split(',')[1];
        const filePath = 'data/visualizations/pete-alonso-homeruns-2024.png';
        fs.writeFileSync(filePath, homeRunImageData, 'base64');
        console.log(`   📁 Manually saved to: ${filePath}`);
      }
    }

    // Test visualization for Vladimir Guerrero Jr's RBIs in playoffs
    console.log('\n📊 Generating RBI visualization for Vladimir Guerrero Jr 2025 Playoffs...');
    
    const rbiResult = await client.callTool({
      name: 'visualize-player-stats',
      arguments: {
        playerId: 665489, // Vladimir Guerrero Jr
        season: 2025,
        gameType: 'P',
        statCategory: 'rbi',
        chartType: 'line',
        title: 'Vladimir Guerrero Jr - RBIs by Playoff Game (2025)'
      }
    });

    const rbiData = rbiResult.content[0];
    if (rbiData.type === 'text') {
      const result = JSON.parse(rbiData.text);
      console.log(`✅ RBI Chart Generated!`);
      console.log(`   Total Games: ${result.totalGames}`);
      console.log(`   Min: ${result.statSummary.min}, Max: ${result.statSummary.max}`);
      console.log(`   Average: ${result.statSummary.average}, Total: ${result.statSummary.total}`);
      
      // Check if file was automatically saved
      if (result.savedFile) {
        console.log(`   📁 Automatically saved to: ${result.savedFile}`);
      } else {
        // Manual save as fallback
        const rbiImageData = result.chartUrl.split(',')[1];
        const filePath = 'data/visualizations/vlady-rbis-playoffs-2025.png';
        fs.writeFileSync(filePath, rbiImageData, 'base64');
        console.log(`   📁 Manually saved to: ${filePath}`);
      }
    }

    // Test visualization for Aaron Judge's batting average trend
    console.log('\n📊 Generating Batting Average visualization for Aaron Judge 2024...');
    
    const avgResult = await client.callTool({
      name: 'visualize-player-stats',
      arguments: {
        playerId: 592450, // Aaron Judge
        season: 2024,
        gameType: 'R',
        statCategory: 'avg',
        chartType: 'line',
        title: 'Aaron Judge - Batting Average Trend (2024)'
      }
    });

    const avgData = avgResult.content[0];
    if (avgData.type === 'text') {
      const result = JSON.parse(avgData.text);
      console.log(`✅ Batting Average Chart Generated!`);
      console.log(`   Total Games: ${result.totalGames}`);
      console.log(`   Min: ${result.statSummary.min}, Max: ${result.statSummary.max}`);
      console.log(`   Average: ${result.statSummary.average}, Total: ${result.statSummary.total}`);
      
      // Save the chart to a file
      const avgImageData = result.chartUrl.split(',')[1];
      fs.writeFileSync('aaron-judge-avg-2024.png', avgImageData, 'base64');
      console.log('   📁 Saved as: aaron-judge-avg-2024.png');
    }

    console.log('\n🎉 All visualizations generated successfully!');
    console.log('📊 Check the generated PNG files to view the charts.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

console.log('🎯 Testing MLB MCP Server Visualization Functionality...\n');
testVisualization().catch(console.error);