// Test corrected Pete Alonso home run visualization
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const https = require('https');

async function testCorrectedVisualization() {
  console.log('📊 Testing corrected Pete Alonso home run visualization...');
  
  const url = 'https://statsapi.mlb.com/api/v1/people/624413/stats?stats=gameLog&season=2024&gameType=R';
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          const gameLogs = json.stats[0].splits;
          
          // Extract home run data
          const gameData = [];
          const gameLabels = [];
          let totalHomeRuns = 0;
          let gamesWithHomeRuns = 0;
          
          gameLogs.forEach((game, index) => {
            const homeRuns = game.stat.homeRuns || 0;
            gameData.push(homeRuns);
            gameLabels.push(`G${index + 1}`);
            totalHomeRuns += homeRuns;
            if (homeRuns > 0) gamesWithHomeRuns++;
          });
          
          console.log(`📈 Data processed: ${gameLogs.length} games, ${totalHomeRuns} total HRs, ${gamesWithHomeRuns} games with HRs`);
          
          // Create chart
          const chartCanvas = new ChartJSNodeCanvas({ width: 1200, height: 600 });
          
          const config = {
            type: 'bar',
            data: {
              labels: gameLabels,
              datasets: [{
                label: 'Home Runs',
                data: gameData,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: false,
              plugins: {
                title: {
                  display: true,
                  text: `Pete Alonso - Home Runs by Game (2024 Regular Season) - CORRECTED`,
                  font: { size: 16 }
                },
                legend: {
                  display: true
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 3,
                  title: {
                    display: true,
                    text: 'Home Runs'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Game Number'
                  }
                }
              }
            }
          };
          
          const imageBuffer = await chartCanvas.renderToBuffer(config);
          
          // Save to file
          const filename = 'data/visualizations/pete-alonso-homeruns-2024-CORRECTED.png';
          fs.writeFileSync(filename, imageBuffer);
          
          console.log(`✅ Chart saved to: ${filename}`);
          console.log(`📊 Final stats: ${totalHomeRuns} total home runs in ${gamesWithHomeRuns} games`);
          
          // Show first few games with home runs as verification
          const hrGames = [];
          gameLogs.forEach((game, index) => {
            if (game.stat.homeRuns > 0) {
              hrGames.push(`Game ${index + 1} (${game.date}): ${game.stat.homeRuns} HR`);
            }
          });
          
          console.log(`🏠 First 5 games with home runs:`);
          hrGames.slice(0, 5).forEach(game => console.log(`  - ${game}`));
          
          resolve({ totalHomeRuns, gamesWithHomeRuns });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

testCorrectedVisualization()
  .then(result => {
    console.log('\n✅ CORRECTED visualization test completed successfully!');
    console.log(`📊 Pete Alonso 2024: ${result.totalHomeRuns} home runs in ${result.gamesWithHomeRuns} games`);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });