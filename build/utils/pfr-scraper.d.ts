/**
 * Pro Football Reference (PFR) scraper utility
 * Provides fallback player data and statistics when ESPN APIs fail
 */
export interface PFRPlayer {
    id: string;
    name: string;
    position: string;
    team?: string;
    years?: string;
    birthDate?: string;
    college?: string;
    height?: string;
    weight?: string;
    url?: string;
}
export interface PFRPlayerStats {
    playerId: string;
    playerName: string;
    season: string;
    team: string;
    position: string;
    games: number;
    passingYards?: number;
    passingTDs?: number;
    interceptions?: number;
    completions?: number;
    attempts?: number;
    passerRating?: number;
    rushingAttempts?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;
}
export declare class PFRScraper {
    private baseUrl;
    /**
     * Search for players by name on Pro Football Reference
     */
    searchPlayers(query: string): Promise<PFRPlayer[]>;
    /**
     * Get player statistics from Pro Football Reference
     */
    getPlayerStats(playerUrl: string, season?: string): Promise<PFRPlayerStats | null>;
    /**
     * Parse player search results from PFR HTML
     */
    private parsePlayerSearchResults;
    /**
     * Parse player statistics from PFR player page HTML
     */
    private parsePlayerStats;
    /**
     * Check if a player name is relevant to the search query
     */
    private isRelevantPlayer;
    /**
     * Calculate string similarity (simple Jaccard similarity)
     */
    private calculateSimilarity;
}
//# sourceMappingURL=pfr-scraper.d.ts.map