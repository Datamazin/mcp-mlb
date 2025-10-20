#!/usr/bin/env node

/**
 * NFL Web Scraping Demo
 * 
 * Demonstrates enhanced NFL data collection using web scraping
 * Shows how to access NFL.com, ESPN, and other sources directly
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

class NFLWebScrapingDemo {
  
  /**
   * Demo: Get current week NFL standings from NFL.com
   */
  async getNFLStandings() {
    console.log('📊 Scraping NFL Standings from NFL.com...\n');
    
    try {
      const url = 'https://www.nfl.com/standings/';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const standings = {};
      
      // Parse AFC and NFC standings
      $('.d3-l-grid--3 .d3-l-col--1-1').each((i, division) => {
        const $division = $(division);
        const divisionName = $division.find('.d3-o-section-title').text().trim();
        
        if (divisionName.includes('AFC') || divisionName.includes('NFC')) {
          const teams = [];
          
          $division.find('tbody tr').each((j, row) => {
            const $row = $(row);
            const team = {
              name: $row.find('.d3-o-club-fullname').text().trim(),
              wins: $row.find('td').eq(1).text().trim(),
              losses: $row.find('td').eq(2).text().trim(),
              ties: $row.find('td').eq(3).text().trim(),
              pct: $row.find('td').eq(4).text().trim()
            };
            
            if (team.name) teams.push(team);
          });
          
          standings[divisionName] = teams;
        }
      });
      
      return standings;
      
    } catch (error) {
      console.error('❌ Failed to scrape NFL standings:', error.message);
      return null;
    }
  }

  /**
   * Demo: Get live game scores during active games
   */
  async getLiveScores() {
    console.log('🏈 Scraping Live NFL Scores from ESPN...\n');
    
    try {
      const url = 'https://www.espn.com/nfl/scoreboard';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const games = [];
      
      $('.ScoreCell').each((i, gameElement) => {
        const $game = $(gameElement);
        
        const game = {
          homeTeam: $game.find('.home .sb-team-short').text() || 
                   $game.find('.home .team-name').text(),
          awayTeam: $game.find('.away .sb-team-short').text() || 
                   $game.find('.away .team-name').text(),
          homeScore: $game.find('.home .sb-score').text() || '0',
          awayScore: $game.find('.away .sb-score').text() || '0',
          gameStatus: $game.find('.game-status').text() ||
                     $game.find('.status-detail').text(),
          quarter: $game.find('.game-status-detail').text() || 'N/A'
        };
        
        if (game.homeTeam && game.awayTeam) {
          games.push(game);
        }
      });
      
      return games;
      
    } catch (error) {
      console.error('❌ Failed to scrape live scores:', error.message);
      return [];
    }
  }

  /**
   * Demo: Get player profile from Pro Football Reference
   */
  async getPlayerProfilePFR(playerName) {
    console.log(`🔍 Scraping ${playerName} profile from Pro Football Reference...\n`);
    
    try {
      // First search for the player
      const searchUrl = `https://www.pro-football-reference.com/search/search.fcgi?search=${encodeURIComponent(playerName)}`;
      const searchResponse = await axios.get(searchUrl);
      const $search = cheerio.load(searchResponse.data);
      
      // Look for direct player page link
      let playerUrl = null;
      $search('div.search-item').first().each((i, item) => {
        const $item = $(item);
        const link = $item.find('div.search-item-url a').attr('href');
        if (link && link.includes('/players/')) {
          playerUrl = `https://www.pro-football-reference.com${link}`;
        }
      });
      
      if (!playerUrl) {
        console.log('❌ Player not found in Pro Football Reference');
        return null;
      }
      
      // Get player page
      await this.sleep(1000); // Be respectful with rate limiting
      const playerResponse = await axios.get(playerUrl);
      const $ = cheerio.load(playerResponse.data);
      
      const profile = {
        name: $('#meta h1').text().trim(),
        position: $('#meta p').first().text().match(/Position: (\w+)/)?.[1] || 'Unknown',
        heightWeight: $('#meta p').first().text().match(/(\d+-\d+, \d+lb)/)?.[1] || 'Unknown',
        college: $('#meta p').first().text().match(/College: ([^,\n]+)/)?.[1]?.trim() || 'Unknown',
        born: $('#meta p').first().text().match(/Born: ([^,\n]+)/)?.[1]?.trim() || 'Unknown'
      };
      
      // Get career stats from the main stats table
      const careerStats = {};
      $('#stats tbody tr').each((i, row) => {
        const $row = $(row);
        const year = $row.find('th').text();
        if (year === 'Career') {
          $row.find('td').each((j, cell) => {
            const $cell = $(cell);
            const value = $cell.text().trim();
            if (value && value !== '') {
              // Map column index to stat name (simplified)
              const statNames = ['games', 'gamesStarted', 'completions', 'attempts', 'passingYards', 'touchdowns', 'interceptions'];
              if (statNames[j]) {
                careerStats[statNames[j]] = value;
              }
            }
          });
        }
      });
      
      profile.careerStats = careerStats;
      return profile;
      
    } catch (error) {
      console.error('❌ Failed to scrape player profile:', error.message);
      return null;
    }
  }

  /**
   * Demo: Get team injury report from official team site
   */
  async getTeamInjuryReport(teamName) {
    console.log(`🏥 Scraping ${teamName} injury report...\n`);
    
    // Example team URLs (would need complete mapping)
    const teamUrls = {
      'ravens': 'https://www.baltimoreravens.com',
      'bills': 'https://www.buffalobills.com',
      'chiefs': 'https://www.chiefs.com'
    };
    
    const baseUrl = teamUrls[teamName.toLowerCase()];
    if (!baseUrl) {
      console.log(`❌ Team URL not configured for ${teamName}`);
      return [];
    }
    
    try {
      // Most teams have injury reports at /news/injury-report or similar
      const injuryUrl = `${baseUrl}/news/injury-report/`;
      const response = await axios.get(injuryUrl);
      const $ = cheerio.load(response.data);
      
      const injuries = [];
      
      // Parse injury report table (format varies by team)
      $('.injury-report-table tr, .roster-injury tr').each((i, row) => {
        const $row = $(row);
        const player = $row.find('td').eq(0).text().trim();
        const position = $row.find('td').eq(1).text().trim();
        const injury = $row.find('td').eq(2).text().trim();
        const status = $row.find('td').eq(3).text().trim();
        
        if (player && status) {
          injuries.push({ player, position, injury, status });
        }
      });
      
      return injuries;
      
    } catch (error) {
      console.error(`❌ Failed to scrape ${teamName} injury report:`, error.message);
      
      // Fallback to ESPN injury report
      return await this.getESPNInjuryReport(teamName);
    }
  }

  /**
   * Fallback: Get injury data from ESPN
   */
  async getESPNInjuryReport(teamName) {
    try {
      const url = `https://www.espn.com/nfl/team/injuries/_/name/${teamName.toLowerCase()}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const injuries = [];
      
      $('.injuries tbody tr').each((i, row) => {
        const $row = $(row);
        const player = $row.find('.player-name').text().trim();
        const status = $row.find('.injury-status').text().trim();
        const details = $row.find('.injury-details').text().trim();
        
        if (player) {
          injuries.push({ player, status, injury: details });
        }
      });
      
      return injuries;
      
    } catch (error) {
      console.error('❌ ESPN injury fallback also failed:', error.message);
      return [];
    }
  }

  /**
   * Demo: Multi-source player comparison with web scraped data
   */
  async enhancedPlayerComparison(player1Name, player2Name) {
    console.log(`🆚 Enhanced comparison: ${player1Name} vs ${player2Name}\n`);
    
    const [player1Data, player2Data] = await Promise.all([
      this.gatherPlayerData(player1Name),
      this.gatherPlayerData(player2Name)
    ]);
    
    return this.generateComparison(player1Data, player2Data);
  }

  /**
   * Gather comprehensive player data from multiple sources
   */
  async gatherPlayerData(playerName) {
    console.log(`📊 Gathering comprehensive data for ${playerName}...`);
    
    const data = {
      name: playerName,
      sources: [],
      stats: {},
      profile: {},
      recentNews: [],
      injuryStatus: 'Unknown'
    };
    
    try {
      // Source 1: Pro Football Reference for historical stats
      const pfrProfile = await this.getPlayerProfilePFR(playerName);
      if (pfrProfile) {
        data.profile = { ...data.profile, ...pfrProfile };
        data.stats.career = pfrProfile.careerStats;
        data.sources.push('Pro Football Reference');
      }
      
      await this.sleep(1000); // Rate limiting
      
      // Source 2: ESPN for current season stats (would implement)
      // Source 3: NFL.com for official stats (would implement)
      // Source 4: Team site for injury status (would implement)
      
    } catch (error) {
      console.error(`❌ Error gathering data for ${playerName}:`, error.message);
    }
    
    return data;
  }

  /**
   * Generate intelligent comparison report
   */
  generateComparison(player1Data, player2Data) {
    const comparison = {
      players: [player1Data.name, player2Data.name],
      dataSources: [...new Set([...player1Data.sources, ...player2Data.sources])],
      analysis: {
        career: this.compareCareerStats(player1Data.stats.career, player2Data.stats.career),
        experience: this.compareExperience(player1Data.profile, player2Data.profile),
        currentStatus: this.compareCurrentStatus(player1Data, player2Data)
      },
      confidence: this.calculateComparisonConfidence(player1Data, player2Data),
      recommendations: this.generateRecommendations(player1Data, player2Data)
    };
    
    return comparison;
  }

  /**
   * Utility functions
   */
  compareCareerStats(stats1, stats2) {
    // Implement intelligent stat comparison
    return { winner: 'TBD', details: 'Statistical analysis would go here' };
  }

  compareExperience(profile1, profile2) {
    return { analysis: 'Experience comparison would go here' };
  }

  compareCurrentStatus(data1, data2) {
    return { analysis: 'Current status comparison would go here' };
  }

  calculateComparisonConfidence(data1, data2) {
    const sourceCount = data1.sources.length + data2.sources.length;
    return Math.min((sourceCount / 4) * 100, 100); // Max confidence with 2+ sources each
  }

  generateRecommendations(data1, data2) {
    return ['Would provide actionable insights based on the comparison'];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Demo execution
async function runDemo() {
  const scraper = new NFLWebScrapingDemo();
  
  console.log('🚀 NFL Web Scraping Enhancement Demo\n');
  console.log('=====================================\n');
  
  // Demo 1: NFL Standings
  try {
    const standings = await scraper.getNFLStandings();
    if (standings) {
      console.log('✅ Successfully scraped NFL standings');
      Object.keys(standings).slice(0, 2).forEach(division => {
        console.log(`\n${division}:`);
        standings[division].slice(0, 2).forEach(team => {
          console.log(`  ${team.name}: ${team.wins}-${team.losses} (${team.pct})`);
        });
      });
    }
  } catch (error) {
    console.log('⚠️ Standings demo failed (expected in offline mode)');
  }
  
  console.log('\n=====================================\n');
  
  // Demo 2: Live Scores
  try {
    const scores = await scraper.getLiveScores();
    if (scores && scores.length > 0) {
      console.log('✅ Successfully scraped live scores');
      scores.slice(0, 3).forEach(game => {
        console.log(`${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam} (${game.gameStatus})`);
      });
    } else {
      console.log('📋 No live games currently (or demo mode)');
    }
  } catch (error) {
    console.log('⚠️ Live scores demo failed (expected in offline mode)');
  }
  
  console.log('\n=====================================\n');
  
  // Demo 3: Player Profile
  try {
    const profile = await scraper.getPlayerProfilePFR('Tom Brady');
    if (profile) {
      console.log('✅ Successfully scraped player profile');
      console.log(`Name: ${profile.name}`);
      console.log(`Position: ${profile.position}`);
      console.log(`College: ${profile.college}`);
      if (profile.careerStats.passingYards) {
        console.log(`Career Passing Yards: ${profile.careerStats.passingYards}`);
      }
    }
  } catch (error) {
    console.log('⚠️ Player profile demo failed (expected in offline mode)');
  }
  
  console.log('\n=====================================\n');
  console.log('🎯 Enhancement Benefits Summary:');
  console.log('• Real-time data access without API limitations');
  console.log('• Comprehensive historical player database');  
  console.log('• Multi-source data validation and confidence scoring');
  console.log('• Live injury reports and roster updates');
  console.log('• Enhanced player comparisons with rich context');
  console.log('• Fallback systems for maximum reliability');
  
  console.log('\n🔮 Future Capabilities:');
  console.log('• Predictive analytics based on trends');
  console.log('• Fantasy football integration');
  console.log('• Weather impact analysis');
  console.log('• Social media sentiment tracking');
  console.log('• Video highlight integration');
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}