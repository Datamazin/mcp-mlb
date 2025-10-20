/**
 * NBA Web Scraper
 *
 * Comprehensive data collection from NBA sources
 */
import { NBAPlayerStats, LiveGame, InjuryReport } from '../types/multi-sport-types.js';
export declare class NBAWebScraper {
    private config;
    private lastRequestTime;
    /**
     * Get NBA player statistics from multiple sources
     */
    getPlayerStats(playerName: string, season?: number): Promise<NBAPlayerStats | null>;
    /**
     * Search for NBA players across multiple sources
     */
    searchPlayers(query: string): Promise<any[]>;
    /**
     * Get live NBA scores
     */
    getLiveScores(): Promise<LiveGame[]>;
    /**
     * Get NBA injury report
     */
    getInjuryReport(): Promise<InjuryReport[]>;
    /**
     * Get historical player data from Basketball Reference
     */
    getHistoricalPlayerData(playerName: string): Promise<any>;
    private scrapeNBAComPlayer;
    private scrapeBasketballReference;
    private scrapeESPNStats;
    private searchNBACom;
    private searchBasketballReference;
    private searchESPN;
    private consolidateNBAStats;
    private consolidateSearchResults;
    private tryMultipleSources;
    private respectRateLimit;
    private sleep;
    private parseQuarter;
    private normalizeInjuryStatus;
    private assessInjuryImpact;
    private extractPlayerUrlFromBBRef;
    private parseBasketballReferenceProfile;
    private parseBasketballReferenceStats;
}
//# sourceMappingURL=nba-web-scraper.d.ts.map