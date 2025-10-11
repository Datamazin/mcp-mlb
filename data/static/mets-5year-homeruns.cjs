// Create comprehensive bar chart for Mets players' home runs across 2021-2025
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const https = require('https');

// Key Mets players to analyze (focusing on players who had significant tenure)
const metsPlayers = [
  { id: 624413, name: "Pete Alonso", position: "1B" },
  { id: 596019, name: "Francisco Lindor", position: "SS" },
  { id: 607043, name: "Brandon Nimmo", position: "OF" },
  { id: 643446, name: "Jeff McNeil", position: "2B" },
  { id: 516782, name: "Starling Marte", position: "OF" },
  { id: 665742, name: "Juan Soto", position: "OF" }, // Recent addition
  { id: 668901, name: "Mark Vientos", position: "3B" },
  { id: 682626, name: "Francisco Alvarez", position: "C" },
  { id: 502110, name: "Robinson Cano", position: "2B" }, // Historical
  { id: 592450, name: "Michael Conforto", position: "OF" } // Historical
];

const seasons = [2021, 2022, 2023, 2024, 2025];

async function getPlayerSeasonStats(playerId, playerName, season) {
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
            
            resolve({
              player: playerName,
              season: season,
              homeRuns: homeRuns,
              games: stats.gamesPlayed || 0,
              team: json.stats[0].splits[0].team ? json.stats[0].splits[0].team.name : 'Unknown'
            });
          } else {
            resolve({
              player: playerName,
              season: season,
              homeRuns: 0,
              games: 0,
              team: 'No Data'
            });
          }
        } catch (error) {
          resolve({
            player: playerName,
            season: season,
            homeRuns: 0,
            games: 0,
            team: 'Error'
          });
        }
      });
    }).on('error', () => {
      resolve({
        player: playerName,
        season: season,
        homeRuns: 0,
        games: 0,
        team: 'Error'
      });
    });
  });
}

async function getAllPlayerSeasonData() {
  console.log('📊 Getting 5-year home run data for Mets players (2021-2025)...');
  
  const allData = [];
  
  for (const player of metsPlayers) {
    console.log(`\n🔍 Getting data for ${player.name}:`);
    
    for (const season of seasons) {
      console.log(`  📅 ${season}...`);
      const stats = await getPlayerSeasonStats(player.id, player.name, season);
      allData.push(stats);
      
      if (stats.homeRuns > 0) {
        console.log(`    ✅ ${stats.homeRuns} HRs in ${stats.games} games`);
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allData;
}

async function createMultiYearBarChart(allData) {
  console.log('\n📈 Creating 5-year Mets home run bar chart...');
  
  // Filter out players with minimal data
  const playerTotals = {};
  allData.forEach(stat => {
    if (!playerTotals[stat.player]) {
      playerTotals[stat.player] = 0;
    }
    playerTotals[stat.player] += stat.homeRuns;
  });
  
  // Keep players with at least 10 total home runs across all seasons
  const significantPlayers = Object.keys(playerTotals)
    .filter(player => playerTotals[player] >= 10)
    .sort((a, b) => playerTotals[b] - playerTotals[a]);
  
  console.log('\n🏆 Players with significant home run totals (2021-2025):');
  significantPlayers.forEach(player => {
    console.log(`  - ${player}: ${playerTotals[player]} total HRs`);
  });
  
  // Create datasets for each season
  const datasets = seasons.map((season, index) => {
    const colors = [
      'rgba(255, 69, 0, 0.8)',   // Mets Orange
      'rgba(0, 71, 161, 0.8)',   // Mets Blue  
      'rgba(255, 165, 0, 0.8)',  // Orange variant
      'rgba(30, 144, 255, 0.8)', // Blue variant
      'rgba(255, 99, 71, 0.8)'   // Red-orange
    ];
    
    const data = significantPlayers.map(player => {
      const playerData = allData.find(d => d.player === player && d.season === season);
      return playerData ? playerData.homeRuns : 0;
    });
    
    return {
      label: season.toString(),
      data: data,
      backgroundColor: colors[index],
      borderColor: colors[index].replace('0.8', '1'),
      borderWidth: 1
    };
  });
  
  // Create chart
  const chartCanvas = new ChartJSNodeCanvas({ width: 1400, height: 800 });
  
  const config = {
    type: 'bar',
    data: {
      labels: significantPlayers,
      datasets: datasets
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'New York Mets - Home Runs by Player (2021-2025)',
          font: { size: 22, weight: 'bold' },
          color: 'rgba(0, 71, 161, 1)',
          padding: 20
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Home Runs',
            font: { size: 16, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Players',
            font: { size: 16, weight: 'bold' }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: { size: 11 }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  };
  
  const imageBuffer = await chartCanvas.renderToBuffer(config);
  
  // Save to file
  const filename = 'data/visualizations/mets-homeruns-5year-comparison.png';
  fs.writeFileSync(filename, imageBuffer);
  
  console.log(`✅ 5-year comparison chart saved to: ${filename}`);
  
  // Generate summary statistics
  const summary = {
    totalPlayers: significantPlayers.length,
    totalHomeRuns: Object.values(playerTotals).reduce((sum, hrs) => sum + hrs, 0),
    topPerformer: significantPlayers[0],
    topPerformerTotal: playerTotals[significantPlayers[0]],
    seasons: seasons,
    filename: filename
  };
  
  console.log('\n📊 5-Year Summary Statistics:');
  console.log(`  - Players analyzed: ${summary.totalPlayers}`);
  console.log(`  - Total home runs: ${summary.totalHomeRuns}`);
  console.log(`  - Top performer: ${summary.topPerformer} (${summary.topPerformerTotal} HRs)`);
  
  // Show yearly breakdown for top performer
  console.log(`\n🏆 ${summary.topPerformer} yearly breakdown:`);
  seasons.forEach(season => {
    const yearData = allData.find(d => d.player === summary.topPerformer && d.season === season);
    if (yearData && yearData.homeRuns > 0) {
      console.log(`    ${season}: ${yearData.homeRuns} HRs in ${yearData.games} games`);
    }
  });
  
  return summary;
}

// Main execution
async function main() {
  try {
    console.log('🏟️ Starting 5-year Mets home run analysis...');
    
    const allData = await getAllPlayerSeasonData();
    const summary = await createMultiYearBarChart(allData);
    
    console.log('\n🎯 5-Year Mets Home Run Analysis Complete!');
    console.log(`📊 Chart saved: ${summary.filename}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();