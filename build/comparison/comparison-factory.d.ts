/**
 * Comparison Factory
 *
 * Factory pattern for creating sport-specific comparison classes.
 * Provides singleton instances for each league to optimize performance.
 *
 * Supported Leagues:
 * - MLB: Major League Baseball
 * - NBA: National Basketball Association
 * - NFL: National Football League
 */
import { BaseComparison } from './base-comparison.js';
import { League } from '../api/sport-api-factory.js';
/**
 * Factory for creating and managing sport comparison classes
 * Uses singleton pattern to maintain comparison instances
 */
export declare class ComparisonFactory {
    private static mlbComparison;
    private static nbaComparison;
    private static nflComparison;
    /**
     * Get comparison class for specified league
     * Creates new instance on first call, returns cached instance on subsequent calls
     *
     * @param league - Sport league identifier (mlb, nba, nfl)
     * @returns BaseComparison implementation for the league
     * @throws Error if league is not supported
     */
    static getComparison(league: League): BaseComparison;
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
     * Reset all comparison instances (useful for testing)
     */
    static reset(): void;
}
//# sourceMappingURL=comparison-factory.d.ts.map