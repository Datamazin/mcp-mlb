/**
 * Pete Alonso Power Stats Analysis & Text Visualization
 * 
 * This script provides detailed analysis and text-based visualization of Pete Alonso's power stats.
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function analyzePeteAlonsoPowerStats(season = 2024) {
  const client = new MLBAPIClient('https://statsapi.mlb.com/api');
  const peteAlonsoId = 624413;
  
  console.log(`=== Pete Alonso Power Stats Analysis - ${season} ===\n`);
  
  try {
    const baseUrl = 'https://statsapi.mlb.com/api';
    const url = `${baseUrl}/v1/people/${peteAlonsoId}/stats?stats=byMonth&season=${season}&gameType=R`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.stats && data.stats[0] && data.stats[0].splits) {
      const sortedSplits = data.stats[0].splits.sort((a, b) => (a.month || 0) - (b.month || 0));
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      console.log('📊 Monthly Power Stats Breakdown:');
      console.log('=' .repeat(80));
      console.log('Month    | 2B  | 3B  | HR  | XBH | AB  | 2B% | HR%');
      console.log('-' .repeat(80));
      
      let totals = { doubles: 0, triples: 0, homeRuns: 0, atBats: 0 };
      let monthlyData = [];
      
      sortedSplits.forEach(split => {
        const month = monthNames[split.month] || 'Unk';
        const stat = split.stat;
        const doubles = stat.doubles || 0;
        const triples = stat.triples || 0;
        const homeRuns = stat.homeRuns || 0;
        const atBats = stat.atBats || 0;
        const extraBaseHits = doubles + triples + homeRuns;
        
        const doublesRate = atBats > 0 ? ((doubles / atBats) * 100).toFixed(1) : '0.0';
        const homeRunRate = atBats > 0 ? ((homeRuns / atBats) * 100).toFixed(1) : '0.0';
        
        console.log(`${month.padEnd(8)} | ${doubles.toString().padStart(2)} | ${triples.toString().padStart(2)} | ${homeRuns.toString().padStart(2)} | ${extraBaseHits.toString().padStart(3)} | ${atBats.toString().padStart(3)} | ${doublesRate.padStart(3)}% | ${homeRunRate.padStart(3)}%`);
        
        totals.doubles += doubles;
        totals.triples += triples;
        totals.homeRuns += homeRuns;
        totals.atBats += atBats;
        
        monthlyData.push({
          month,
          doubles,
          triples,
          homeRuns,
          extraBaseHits,
          atBats
        });
      });
      
      console.log('-' .repeat(80));
      const totalXBH = totals.doubles + totals.triples + totals.homeRuns;
      const seasonDoublesRate = totals.atBats > 0 ? ((totals.doubles / totals.atBats) * 100).toFixed(1) : '0.0';
      const seasonHRRate = totals.atBats > 0 ? ((totals.homeRuns / totals.atBats) * 100).toFixed(1) : '0.0';
      
      console.log(`TOTAL    | ${totals.doubles.toString().padStart(2)} | ${totals.triples.toString().padStart(2)} | ${totals.homeRuns.toString().padStart(2)} | ${totalXBH.toString().padStart(3)} | ${totals.atBats.toString().padStart(3)} | ${seasonDoublesRate.padStart(3)}% | ${seasonHRRate.padStart(3)}%`);
      
      // Text-based visualization
      console.log('\n📈 Visual Breakdown - Home Runs by Month:');
      console.log('=' .repeat(50));
      
      const maxHR = Math.max(...monthlyData.map(m => m.homeRuns));
      const scale = maxHR > 0 ? 40 / maxHR : 1; // Scale to fit 40 characters max
      
      monthlyData.forEach(month => {
        const barLength = Math.round(month.homeRuns * scale);
        const bar = '█'.repeat(barLength);
        console.log(`${month.month}: ${bar} ${month.homeRuns} HR`);
      });
      
      console.log('\n📈 Visual Breakdown - Doubles by Month:');
      console.log('=' .repeat(50));
      
      const maxDoubles = Math.max(...monthlyData.map(m => m.doubles));
      const doublesScale = maxDoubles > 0 ? 40 / maxDoubles : 1;
      
      monthlyData.forEach(month => {
        const barLength = Math.round(month.doubles * doublesScale);
        const bar = '▓'.repeat(barLength);
        console.log(`${month.month}: ${bar} ${month.doubles} 2B`);
      });
      
      // Analysis
      console.log('\n🔍 Power Stats Analysis:');
      console.log('=' .repeat(50));
      
      const bestHRMonth = monthlyData.reduce((a, b) => a.homeRuns > b.homeRuns ? a : b);
      const bestDoublesMonth = monthlyData.reduce((a, b) => a.doubles > b.doubles ? a : b);
      const mostConsistentMonth = monthlyData.find(m => m.homeRuns >= 5 && m.doubles >= 5);
      
      console.log(`🏆 Best Power Month: ${bestHRMonth.month} (${bestHRMonth.homeRuns} HR)`);
      console.log(`🏆 Best Doubles Month: ${bestDoublesMonth.month} (${bestDoublesMonth.doubles} 2B)`);
      if (mostConsistentMonth) {
        console.log(`⚖️  Most Balanced: ${mostConsistentMonth.month} (${mostConsistentMonth.homeRuns} HR, ${mostConsistentMonth.doubles} 2B)`);
      }
      
      // Power trends
      const firstHalf = monthlyData.slice(0, Math.ceil(monthlyData.length / 2));
      const secondHalf = monthlyData.slice(Math.ceil(monthlyData.length / 2));
      
      const firstHalfHR = firstHalf.reduce((sum, m) => sum + m.homeRuns, 0);
      const secondHalfHR = secondHalf.reduce((sum, m) => sum + m.homeRuns, 0);
      
      console.log(`\n📊 Season Trends:`);
      console.log(`   First Half HR: ${firstHalfHR}`);
      console.log(`   Second Half HR: ${secondHalfHR}`);
      console.log(`   Trend: ${secondHalfHR > firstHalfHR ? 'Strong Finish 📈' : firstHalfHR > secondHalfHR ? 'Strong Start 📉' : 'Consistent 📊'}`);
      
      console.log(`\n📋 Summary:`);
      console.log(`   Total Extra Base Hits: ${totalXBH}`);
      console.log(`   XBH per Month: ${(totalXBH / monthlyData.length).toFixed(1)}`);
      console.log(`   Power Rating: ${((totals.homeRuns * 4 + totals.triples * 3 + totals.doubles * 2) / totals.atBats * 100).toFixed(1)} points`);
      
    } else {
      console.log('❌ No monthly data found');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n=== Analysis Complete ===');
  console.log(`📊 Chart file: data/visualizations/pete-alonso-monthly-power-${season}.png`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const season = parseInt(args[0]) || 2024;

// Run analysis
analyzePeteAlonsoPowerStats(season).catch(console.error);