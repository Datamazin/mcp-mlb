/**
 * MLB Web Scraper
 *
 * Comprehensive data collection from MLB sources
 */
import { MLBPlayerStats, LiveGame, InjuryReport } from '../types/multi-sport-types.js';
export declare class MLBWebScraper {
    private config;
    private lastRequestTime;
    /**
     * Get MLB player statistics from multiple sources
     */
    getPlayerStats(playerName: string, season?: number): Promise<MLBPlayerStats | null>;
    /**
     * Search for MLB players across multiple sources
     */
    searchPlayers(query: string): Promise<any[]>;
    /**
     * Get live MLB scores
     */
    getLiveScores(): Promise<LiveGame[]>;
    /**
     * Get MLB injury report
     */
    getInjuryReport(): Promise<InjuryReport[]>;
    /**
     * Get historical player data from Baseball Reference
     */
    getHistoricalPlayerData(playerName: string): Promise<any>;
    private scrapeMLBComPlayer;
    private scrapeBaseballReference;
    private scrapeFanGraphs;
    private searchMLBCom;
    private searchBaseballReference;
    private searchESPN;
    private consolidateMLBStats;
    private consolidateSearchResults;
    private tryMultipleSources;
    private respectRateLimit;
    private sleep;
    private parseInning;
    private parseInjuryStatus;
    private extractInjuryType;
    private assessInjuryImpact;
    private extractPlayerUrlFromBRef;
    private parseBaseballReferenceProfile;
    private parseBaseballReferenceStats;
}
//# sourceMappingURL=mlb-web-scraper.d.ts.map