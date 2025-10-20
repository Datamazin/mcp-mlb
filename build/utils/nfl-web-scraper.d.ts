/**
 * Enhanced NFL Web Scraper
 *
 * Multi-source data collection from official NFL sources without API dependencies
 */
import { BasePlayerOverview } from '../types/player.js';
export interface NFLWebScrapingSource {
    name: string;
    baseUrl: string;
    priority: number;
    rateLimitMs: number;
}
export declare class NFLWebScraper {
    private sources;
    private lastRequestTime;
    /**
     * Get current week NFL stats from multiple sources
     */
    getWeeklyStats(week: number, season: number): Promise<any[]>;
    /**
     * Get live game data during active games
     */
    getLiveGameData(): Promise<any[]>;
    /**
     * Get comprehensive player profiles with career stats
     */
    getPlayerProfile(playerName: string): Promise<BasePlayerOverview | null>;
    /**
     * Get team roster and depth chart information
     */
    getTeamRoster(teamName: string): Promise<any[]>;
    /**
     * Get injury reports and player status
     */
    getInjuryReport(): Promise<any[]>;
    /**
     * NFL.com Weekly Stats Scraping
     */
    private scrapeNFLComWeekly;
    /**
     * ESPN Live Game Scraping
     */
    private scrapeESPNLive;
    /**
     * Pro Football Reference Historical Data
     */
    private scrapePFRHistorical;
    /**
     * Team Official Site Scraping
     */
    private scrapeTeamOfficialSite;
    /**
     * Multi-source fallback system
     */
    private tryMultipleSources;
    /**
     * Rate limiting to be respectful to sources
     */
    private respectRateLimit;
    /**
     * Data consolidation and validation
     */
    private consolidateWeeklyData;
    /**
     * Calculate data confidence based on source reliability and consistency
     */
    private calculateConfidence;
    /**
     * Get team official website URLs
     */
    private getTeamOfficialUrls;
    private parseNFLComStatRow;
    private extractPlayerUrlFromPFRSearch;
    private parsePFRPlayerStats;
    private mergeStats;
}
//# sourceMappingURL=nfl-web-scraper.d.ts.map