/**
 * Pete Alonso Monthly Power Stats Visualization
 * 
 * This script creates a visual chart showing Pete Alonso's doubles, triples, and home runs by month.
 */

import { MLBAPIClient } from './build/mlb-api.js';
import { createCanvas } from 'canvas';
import Chart from 'chart.js/auto';
import fs from 'fs';

async function createAlonsoMonthlyPowerChart(season = 2024) {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  const peteAlonsoId = 624413;
  
  console.log(`=== Creating Pete Alonso Monthly Power Stats Chart - ${season} ===\n`);
  
  try {
    // Get Pete Alonso's monthly stats
    const baseUrl = 'https://statsapi.mlb.com/api';
    const url = `${baseUrl}/v1/people/${peteAlonsoId}/stats?stats=byMonth&season=${season}&gameType=R`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Retrieved Pete Alonso's ${season} monthly data`);
    
    if (data.stats && data.stats[0] && data.stats[0].splits) {
      const monthlyStats = data.stats[0];
      
      // Sort by month and prepare data
      const sortedSplits = monthlyStats.splits.sort((a, b) => {
        const monthA = a.month || 0;
        const monthB = b.month || 0;
        return monthA - monthB;
      });
      
      // Extract data for the chart
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = {
        labels: [],
        doubles: [],
        triples: [],
        homeRuns: []
      };
      
      sortedSplits.forEach(split => {
        const monthName = split.month ? monthNames[split.month] : 'Unknown';
        const stat = split.stat;
        
        chartData.labels.push(monthName);
        chartData.doubles.push(stat.doubles || 0);
        chartData.triples.push(stat.triples || 0);
        chartData.homeRuns.push(stat.homeRuns || 0);
      });
      
      console.log('📊 Monthly Power Stats:');
      chartData.labels.forEach((month, index) => {
        console.log(`${month}: ${chartData.doubles[index]} 2B, ${chartData.triples[index]} 3B, ${chartData.homeRuns[index]} HR`);
      });
      
      // Create chart
      console.log('\n🎨 Creating visualization...');
      
      const width = 1200;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Configure Chart.js to use canvas
      Chart.defaults.font.family = 'Arial, sans-serif';
      Chart.defaults.font.size = 14;
      
      const config = {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Home Runs',
              data: chartData.homeRuns,
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2
            },
            {
              label: 'Doubles',
              data: chartData.doubles,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2
            },
            {
              label: 'Triples',
              data: chartData.triples,
              backgroundColor: 'rgba(255, 206, 86, 0.8)',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            title: {
              display: true,
              text: `Pete Alonso - Power Stats by Month (${season})`,
              font: {
                size: 24,
                weight: 'bold'
              },
              padding: {
                top: 20,
                bottom: 30
              }
            },
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 16
                },
                padding: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Hits',
                font: {
                  size: 18,
                  weight: 'bold'
                }
              },
              ticks: {
                font: {
                  size: 14
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Month',
                font: {
                  size: 18,
                  weight: 'bold'
                }
              },
              ticks: {
                font: {
                  size: 14
                }
              }
            }
          },
          layout: {
            padding: {
              left: 20,
              right: 20,
              top: 20,
              bottom: 20
            }
          }
        }
      };
      
      const chart = new Chart(ctx, config);
      
      // Save the chart
      const buffer = canvas.toBuffer('image/png');
      const filename = `pete-alonso-monthly-power-${season}.png`;
      const filepath = `data/visualizations/${filename}`;
      
      // Ensure directory exists
      if (!fs.existsSync('data/visualizations')) {
        fs.mkdirSync('data/visualizations', { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      
      console.log(`✅ Chart saved as: ${filepath}`);
      
      // Calculate totals
      const totals = {
        doubles: chartData.doubles.reduce((a, b) => a + b, 0),
        triples: chartData.triples.reduce((a, b) => a + b, 0),
        homeRuns: chartData.homeRuns.reduce((a, b) => a + b, 0)
      };
      
      console.log(`\n📈 ${season} Season Totals:`);
      console.log(`   Doubles: ${totals.doubles}`);
      console.log(`   Triples: ${totals.triples}`);
      console.log(`   Home Runs: ${totals.homeRuns}`);
      console.log(`   Extra Base Hits: ${totals.doubles + totals.triples + totals.homeRuns}`);
      
      // Find best months
      const maxHR = Math.max(...chartData.homeRuns);
      const maxDoubles = Math.max(...chartData.doubles);
      const bestHRMonth = chartData.labels[chartData.homeRuns.indexOf(maxHR)];
      const bestDoublesMonth = chartData.labels[chartData.doubles.indexOf(maxDoubles)];
      
      console.log(`\n🏆 Best Months:`);
      console.log(`   Most Home Runs: ${bestHRMonth} (${maxHR} HRs)`);
      console.log(`   Most Doubles: ${bestDoublesMonth} (${maxDoubles} doubles)`);
      
    } else {
      console.log('❌ No monthly data found');
    }
    
  } catch (error) {
    console.log(`❌ Error creating chart: ${error.message}`);
  }
  
  console.log('\n=== Chart Creation Complete ===');
}

// Parse command line arguments
const args = process.argv.slice(2);
const season = parseInt(args[0]) || 2024;

console.log(`ℹ️ Creating Pete Alonso power stats chart for ${season}`);
console.log('ℹ️ Usage: node pete-alonso-power-chart.js YYYY\n');

// Create the chart
createAlonsoMonthlyPowerChart(season).catch(console.error);