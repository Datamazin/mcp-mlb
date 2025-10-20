/**
 * Multi-Sport Web Scraper
 *
 * Comprehensive data collection for MLB, NBA, and NFL
 * Direct access to official sources without API dependencies
 */
import { UniversalPlayer } from '../types/multi-sport-types.js';
export declare class MultiSportWebScraper {
    private sources;
    private lastRequestTime;
    /**
     * Get comprehensive player data across all sports
     */
    getUniversalPlayerData(sport: string, playerName: string): Promise<UniversalPlayer | null>;
    /**
     * MLB Specific Scraping
     */
    scrapeMLBPlayer(playerName: string): Promise<any>;
    /**
     * NBA Specific Scraping
     */
    scrapeNBAPlayer(playerName: string): Promise<any>;
    /**
     * NFL Specific Scraping (Enhanced from previous implementation)
     */
    scrapeNFLPlayer(playerName: string): Promise<any>;
    /**
     * Live Scores Across All Sports
     */
    getLiveScoresAllSports(): Promise<any>;
    /**
     * Cross-Sport Player Comparison
     */
    compareCrossSportDominance(player1: {
        sport: string;
        name: string;
    }, player2: {
        sport: string;
        name: string;
    }): Promise<any>;
    /**
     * Multi-Sport Injury Report
     */
    getMultiSportInjuryReport(): Promise<any>;
    private scrapeMLBComPlayer;
    private scrapeBaseballReference;
    private scrapeFanGraphs;
    private scrapeNBAComPlayer;
    private scrapeBasketballReference;
    private scrapeNFLComPlayer;
    private scrapePFRPlayer;
    private getMLBLiveScores;
    private getNBALiveScores;
    private getNFLLiveScores;
    private getMLBInjuryReport;
    private getNBAInjuryReport;
    private getNFLInjuryReport;
    private scrapePlayerFromSource;
    private consolidatePlayerData;
    private calculateCrossSportDominance;
    private calculateConfidence;
    private respectRateLimit;
    private getHeaders;
}
//# sourceMappingURL=multi-sport-web-scraper.d.ts.map