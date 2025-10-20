/**
 * Enhanced NFL Web Scraper
 * 
 * Multi-source data collection from official NFL sources without API dependencies
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BasePlayerOverview, PlayerStats } from '../types/player.js';

export interface NFLWebScrapingSource {
  name: string;
  baseUrl: string;
  priority: number;
  rateLimitMs: number;
}

export class NFLWebScraper {
  private sources: NFLWebScrapingSource[] = [
    {
      name: 'NFL.com',
      baseUrl: 'https://www.nfl.com',
      priority: 1,
      rateLimitMs: 2000
    },
    {
      name: 'ESPN',
      baseUrl: 'https://www.espn.com/nfl',
      priority: 2,
      rateLimitMs: 1500
    },
    {
      name: 'Pro Football Reference',
      baseUrl: 'https://www.pro-football-reference.com',
      priority: 3,
      rateLimitMs: 3000
    },
    {
      name: 'Team Official Sites',
      baseUrl: '', // Dynamic based on team
      priority: 4,
      rateLimitMs: 2500
    }
  ];

  private lastRequestTime: { [source: string]: number } = {};

  /**
   * Get current week NFL stats from multiple sources
   */
  async getWeeklyStats(week: number, season: number): Promise<any[]> {
    const sources = [
      () => this.scrapeNFLComWeekly(week, season),
      () => this.scrapeESPNWeekly(week, season),
      () => this.scrapePFRWeekly(week, season)
    ];

    const results = await this.tryMultipleSources(sources, 'weekly stats');
    return this.consolidateWeeklyData(results);
  }

  /**
   * Get live game data during active games
   */
  async getLiveGameData(): Promise<any[]> {
    const sources = [
      () => this.scrapeNFLComLive(),
      () => this.scrapeESPNLive(),
      () => this.scrapeYahooSportsLive()
    ];

    return await this.tryMultipleSources(sources, 'live game data');
  }

  /**
   * Get comprehensive player profiles with career stats
   */
  async getPlayerProfile(playerName: string): Promise<BasePlayerOverview | null> {
    // Try multiple search approaches
    const searchResults = await this.searchPlayerAcrossSources(playerName);
    
    if (searchResults.length === 0) {
      return null;
    }

    // Get detailed profile from best source
    const bestResult = searchResults[0];
    return await this.scrapePlayerProfile(bestResult.url, bestResult.source);
  }

  /**
   * Get team roster and depth chart information
   */
  async getTeamRoster(teamName: string): Promise<any[]> {
    const teamSources = [
      () => this.scrapeNFLComRoster(teamName),
      () => this.scrapeTeamOfficialSite(teamName),
      () => this.scrapeESPNRoster(teamName)
    ];

    return await this.tryMultipleSources(teamSources, `${teamName} roster`);
  }

  /**
   * Get injury reports and player status
   */
  async getInjuryReport(): Promise<any[]> {
    const sources = [
      () => this.scrapeNFLComInjuries(),
      () => this.scrapeESPNInjuries(),
      () => this.scrapeFantasyProsInjuries()
    ];

    return await this.tryMultipleSources(sources, 'injury reports');
  }

  /**
   * NFL.com Weekly Stats Scraping
   */
  private async scrapeNFLComWeekly(week: number, season: number): Promise<any> {
    await this.respectRateLimit('NFL.com');
    
    const url = `https://www.nfl.com/stats/player-stats/category/passing/${season}/REG/${week}/`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const stats = [];

    // Parse NFL.com stats table
    $('.d3-o-table tbody tr').each((i, row) => {
      const $row = $(row);
      const playerData = {
        name: $row.find('.d3-o-player-fullname').text().trim(),
        team: $row.find('.d3-o-club-shortname').text().trim(),
        position: 'QB', // Context-dependent
        stats: this.parseNFLComStatRow($row)
      };
      
      if (playerData.name) {
        stats.push(playerData);
      }
    });

    return { source: 'NFL.com', data: stats };
  }

  /**
   * ESPN Live Game Scraping
   */
  private async scrapeESPNLive(): Promise<any> {
    await this.respectRateLimit('ESPN');
    
    const url = 'https://www.espn.com/nfl/scoreboard';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const games = [];
    
    $('.ScoreCell').each((i, game) => {
      const $game = $(game);
      const gameData = {
        homeTeam: $game.find('.team.home .team-name').text().trim(),
        awayTeam: $game.find('.team.away .team-name').text().trim(),
        homeScore: $game.find('.team.home .score').text().trim(),
        awayScore: $game.find('.team.away .score').text().trim(),
        quarter: $game.find('.game-status').text().trim(),
        timeRemaining: $game.find('.game-time').text().trim()
      };
      
      games.push(gameData);
    });

    return { source: 'ESPN', data: games };
  }

  /**
   * Pro Football Reference Historical Data
   */
  private async scrapePFRHistorical(playerName: string): Promise<any> {
    await this.respectRateLimit('Pro Football Reference');
    
    // Search for player first
    const searchUrl = `https://www.pro-football-reference.com/search/search.fcgi?search=${encodeURIComponent(playerName)}`;
    const searchResponse = await axios.get(searchUrl);
    
    // Parse search results and get player page URL
    const playerUrl = this.extractPlayerUrlFromPFRSearch(searchResponse.data, playerName);
    
    if (!playerUrl) {
      return null;
    }

    // Get player career stats
    const playerResponse = await axios.get(playerUrl);
    const $ = cheerio.load(playerResponse.data);
    
    return this.parsePFRPlayerStats($);
  }

  /**
   * Team Official Site Scraping
   */
  private async scrapeTeamOfficialSite(teamName: string): Promise<any> {
    const teamUrls = this.getTeamOfficialUrls();
    const teamUrl = teamUrls[teamName.toLowerCase()];
    
    if (!teamUrl) {
      return null;
    }

    await this.respectRateLimit('Team Official Sites');
    
    const rosterUrl = `${teamUrl}/team/players-roster/`;
    const response = await axios.get(rosterUrl);
    const $ = cheerio.load(response.data);
    
    const roster = [];
    
    // Parse team-specific roster format
    $('.roster-card, .player-card').each((i, card) => {
      const $card = $(card);
      const player = {
        name: $card.find('.player-name, .name').text().trim(),
        number: $card.find('.number').text().trim(),
        position: $card.find('.position').text().trim(),
        height: $card.find('.height').text().trim(),
        weight: $card.find('.weight').text().trim(),
        college: $card.find('.college').text().trim()
      };
      
      roster.push(player);
    });

    return { source: `${teamName} Official`, data: roster };
  }

  /**
   * Multi-source fallback system
   */
  private async tryMultipleSources(
    sourceFunctions: (() => Promise<any>)[], 
    dataType: string
  ): Promise<any[]> {
    const results = [];
    
    for (const sourceFunc of sourceFunctions) {
      try {
        const result = await sourceFunc();
        if (result && result.data) {
          results.push(result);
          console.log(`✅ Successfully scraped ${dataType} from ${result.source}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to scrape ${dataType} from source: ${error.message}`);
        continue;
      }
    }

    return results;
  }

  /**
   * Rate limiting to be respectful to sources
   */
  private async respectRateLimit(source: string): Promise<void> {
    const sourceConfig = this.sources.find(s => s.name === source);
    if (!sourceConfig) return;

    const lastRequest = this.lastRequestTime[source] || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    if (timeSinceLastRequest < sourceConfig.rateLimitMs) {
      const waitTime = sourceConfig.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime[source] = Date.now();
  }

  /**
   * Data consolidation and validation
   */
  private consolidateWeeklyData(results: any[]): any[] {
    const consolidated = new Map();
    
    for (const result of results) {
      for (const player of result.data) {
        const key = `${player.name}_${player.team}`;
        
        if (!consolidated.has(key)) {
          consolidated.set(key, {
            ...player,
            sources: [result.source],
            confidence: this.calculateConfidence(player, [result.source])
          });
        } else {
          // Merge data from multiple sources
          const existing = consolidated.get(key);
          existing.sources.push(result.source);
          existing.stats = this.mergeStats(existing.stats, player.stats);
          existing.confidence = this.calculateConfidence(existing, existing.sources);
        }
      }
    }
    
    return Array.from(consolidated.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate data confidence based on source reliability and consistency
   */
  private calculateConfidence(player: any, sources: string[]): number {
    let confidence = 0;
    
    // Base confidence from source priority
    for (const source of sources) {
      const sourceConfig = this.sources.find(s => s.name === source);
      if (sourceConfig) {
        confidence += (5 - sourceConfig.priority) * 20; // Higher priority = higher confidence
      }
    }
    
    // Bonus for multiple sources confirming data
    if (sources.length > 1) {
      confidence += sources.length * 10;
    }
    
    // Data completeness bonus
    const statsCount = Object.keys(player.stats || {}).length;
    confidence += Math.min(statsCount * 2, 20);
    
    return Math.min(confidence, 100);
  }

  /**
   * Get team official website URLs
   */
  private getTeamOfficialUrls(): { [key: string]: string } {
    return {
      'bills': 'https://www.buffalobills.com',
      'dolphins': 'https://www.miamidolphins.com',
      'patriots': 'https://www.patriots.com',
      'jets': 'https://www.newyorkjets.com',
      'ravens': 'https://www.baltimoreravens.com',
      'bengals': 'https://www.bengals.com',
      'browns': 'https://www.clevelandbrowns.com',
      'steelers': 'https://www.steelers.com',
      'texans': 'https://www.houstontexans.com',
      'colts': 'https://www.colts.com',
      'jaguars': 'https://www.jaguars.com',
      'titans': 'https://www.titansonline.com',
      'broncos': 'https://www.denverbroncos.com',
      'chiefs': 'https://www.chiefs.com',
      'raiders': 'https://www.raiders.com',
      'chargers': 'https://www.chargers.com',
      // Add all 32 teams...
    };
  }

  // Additional helper methods for parsing specific site formats...
  private parseNFLComStatRow($row: any): any { /* Implementation */ }
  private extractPlayerUrlFromPFRSearch(html: string, playerName: string): string | null { /* Implementation */ }
  private parsePFRPlayerStats($: any): any { /* Implementation */ }
  private mergeStats(stats1: any, stats2: any): any { /* Implementation */ }
}