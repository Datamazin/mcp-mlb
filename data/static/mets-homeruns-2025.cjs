// Create line chart for Mets players' 2025 home runs
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const https = require('https');

// Key Mets players for home run analysis
const metsPlayers = [
  { id: 624413, name: "Pete Alonso", position: "1B" },
  { id: 665742, name: "Juan Soto", position: "OF" },
  { id: 596019, name: "Francisco Lindor", position: "SS" },
  { id: 607043, name: "Brandon Nimmo", position: "OF" },
  { id: 668901, name: "Mark Vientos", position: "3B" },
  { id: 682626, name: "Francisco Alvarez", position: "C" },
  { id: 516782, name: "Starling Marte", position: "OF" },
  { id: 643446, name: "Jeff McNeil", position: "2B" }
];

async function getMetsHomeRunData() {
  console.log('📊 Getting 2025 home run data for Mets players...');
  
  const playerStats = [];
  
  for (const player of metsPlayers) {
    console.log(`🔍 Getting data for ${player.name}...`);
    
    const stats = await getPlayerHomeRuns(player.id, player.name, 2025);
    if (stats) {
      playerStats.push(stats);
    }
    
    // Add delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return playerStats;
}

function getPlayerHomeRuns(playerId, playerName, season) {
  return new Promise((resolve) => {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&season=${season}&gameType=R`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.stats && json.stats[0] && json.stats[0].splits && json.stats[0].splits[0]) {
            const stats = json.stats[0].splits[0].stat;
            const homeRuns = stats.homeRuns || 0;
            
            console.log(`  ✅ ${playerName}: ${homeRuns} home runs`);
            resolve({
              name: playerName,
              homeRuns: homeRuns,
              games: stats.gamesPlayed || 0,
              avg: stats.avg || '.000'
            });
          } else {
            console.log(`  ⚠️ ${playerName}: No 2025 stats found`);
            resolve({
              name: playerName,
              homeRuns: 0,
              games: 0,
              avg: '.000'
            });
          }
        } catch (error) {
          console.log(`  ❌ ${playerName}: Error parsing data`);
          resolve({
            name: playerName,
            homeRuns: 0,
            games: 0,
            avg: '.000'
          });
        }
      });
    }).on('error', () => {
      console.log(`  ❌ ${playerName}: Request failed`);
      resolve({
        name: playerName,
        homeRuns: 0,
        games: 0,
        avg: '.000'
      });
    });
  });
}

async function createMetsHomeRunChart(playerStats) {
  console.log('\n📈 Creating Mets home run line chart...');
  
  // Sort players by home runs for better visualization
  const sortedStats = playerStats.sort((a, b) => b.homeRuns - a.homeRuns);
  
  const playerNames = sortedStats.map(p => p.name.split(' ').pop()); // Use last names
  const homeRunData = sortedStats.map(p => p.homeRuns);
  
  console.log('📊 Player home run totals:');
  sortedStats.forEach(player => {
    console.log(`  - ${player.name}: ${player.homeRuns} HRs in ${player.games} games`);
  });
  
  // Create chart
  const chartCanvas = new ChartJSNodeCanvas({ width: 1200, height: 700 });
  
  const config = {
    type: 'line',
    data: {
      labels: playerNames,
      datasets: [{
        label: '2025 Home Runs',
        data: homeRunData,
        borderColor: 'rgba(255, 69, 0, 1)', // Mets orange
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(0, 71, 161, 1)', // Mets blue
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 8,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'New York Mets - 2025 Home Run Leaders',
          font: { size: 20, weight: 'bold' },
          color: 'rgba(0, 71, 161, 1)'
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Home Runs',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Players',
            font: { size: 14, weight: 'bold' }
          },
          grid: {
            display: false
          }
        }
      },
      elements: {
        point: {
          hoverRadius: 10
        }
      }
    }
  };
  
  const imageBuffer = await chartCanvas.renderToBuffer(config);
  
  // Save to file
  const filename = 'data/visualizations/mets-homeruns-2025-line-chart.png';
  fs.writeFileSync(filename, imageBuffer);
  
  console.log(`✅ Chart saved to: ${filename}`);
  
  // Summary stats
  const totalHomeRuns = homeRunData.reduce((sum, hrs) => sum + hrs, 0);
  const avgHomeRuns = totalHomeRuns / homeRunData.length;
  const topHitter = sortedStats[0];
  
  console.log('\n📈 Mets 2025 Home Run Summary:');
  console.log(`  - Total team home runs: ${totalHomeRuns}`);
  console.log(`  - Average per player: ${avgHomeRuns.toFixed(1)}`);
  console.log(`  - Team leader: ${topHitter.name} (${topHitter.homeRuns} HRs)`);
  
  return { totalHomeRuns, avgHomeRuns, topHitter, filename };
}

// Main execution
async function main() {
  try {
    const playerStats = await getMetsHomeRunData();
    const results = await createMetsHomeRunChart(playerStats);
    
    console.log('\n🎯 Mets 2025 Home Run Analysis Complete!');
    console.log(`📊 Chart: ${results.filename}`);
    console.log(`📋 Documentation: data/Markdown/METS_2025_HOMERUN_ANALYSIS.md`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();