/**
 * Sport API Factory
 *
 * Factory pattern for creating sport-specific API clients.
 * Provides singleton instances for each league to maintain caches and optimize performance.
 *
 * Supported Leagues:
 * - MLB: Major League Baseball
 * - NBA: National Basketball Association
 * - NFL: National Football League
 */
import { BaseSportAPI } from './base-api.js';
/**
 * Supported sports leagues
 */
export type League = 'mlb' | 'nba' | 'nfl';
/**
 * Factory for creating and managing sport API clients
 * Uses singleton pattern to maintain client instances and their caches
 */
export declare class SportAPIFactory {
    private static mlbClient;
    private static nbaClient;
    private static nflClient;
    /**
     * Get API client for specified league
     * Creates new client on first call, returns cached instance on subsequent calls
     *
     * @param league - Sport league identifier (mlb, nba, nfl)
     * @returns BaseSportAPI implementation for the league
     * @throws Error if league is not supported
     */
    static getClient(league: League): BaseSportAPI;
    /**
     * Check if a league is supported
     *
     * @param league - League to check
     * @returns true if league is supported
     */
    static isSupported(league: string): boolean;
    /**
     * Get list of supported leagues
     *
     * @returns Array of supported league identifiers
     */
    static getSupportedLeagues(): League[];
    /**
     * Reset all clients (useful for testing)
     */
    static reset(): void;
}
//# sourceMappingURL=sport-api-factory.d.ts.map