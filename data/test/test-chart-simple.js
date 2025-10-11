// Simple test to check chart generation without MCP
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';

async function testChartGeneration() {
  try {
    console.log('🧪 Testing basic chart generation...');
    
    const width = 400;
    const height = 300;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: 'bar',
      data: {
        labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
        datasets: [{
          label: 'Test Data',
          data: [1, 2, 0, 1, 3],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Test Chart'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    console.log('📊 Generating chart...');
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    
    console.log('💾 Saving chart...');
    fs.writeFileSync('test-chart.png', imageBuffer);
    
    console.log('✅ Chart generated successfully! Check test-chart.png');
    
  } catch (error) {
    console.error('❌ Chart generation failed:', error.message);
    console.error('Full error:', error);
  }
}

testChartGeneration();