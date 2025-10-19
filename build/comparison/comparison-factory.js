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
import { MLBComparison } from './mlb-comparison.js';
import { NBAComparison } from './nba-comparison.js';
import { NFLComparison } from './nfl-comparison.js';
import { SportAPIFactory } from '../api/sport-api-factory.js';
/**
 * Factory for creating and managing sport comparison classes
 * Uses singleton pattern to maintain comparison instances
 */
export class ComparisonFactory {
    static mlbComparison = null;
    static nbaComparison = null;
    static nflComparison = null;
    /**
     * Get comparison class for specified league
     * Creates new instance on first call, returns cached instance on subsequent calls
     *
     * @param league - Sport league identifier (mlb, nba, nfl)
     * @returns BaseComparison implementation for the league
     * @throws Error if league is not supported
     */
    static getComparison(league) {
        const normalizedLeague = league.toLowerCase();
        switch (normalizedLeague) {
            case 'mlb':
                if (!this.mlbComparison) {
                    const mlbClient = SportAPIFactory.getClient('mlb');
                    this.mlbComparison = new MLBComparison(mlbClient);
                }
                return this.mlbComparison;
            case 'nba':
                if (!this.nbaComparison) {
                    const nbaClient = SportAPIFactory.getClient('nba');
                    this.nbaComparison = new NBAComparison(nbaClient);
                }
                return this.nbaComparison;
            case 'nfl':
                if (!this.nflComparison) {
                    const nflClient = SportAPIFactory.getClient('nfl');
                    this.nflComparison = new NFLComparison(nflClient);
                }
                return this.nflComparison;
            default:
                throw new Error(`Unknown league: ${league}. Supported leagues: mlb, nba, nfl`);
        }
    }
    /**
     * Check if a league is supported
     *
     * @param league - League to check
     * @returns true if league is supported
     */
    static isSupported(league) {
        return ['mlb', 'nba', 'nfl'].includes(league.toLowerCase());
    }
    /**
     * Get list of supported leagues
     *
     * @returns Array of supported league identifiers
     */
    static getSupportedLeagues() {
        return ['mlb', 'nba', 'nfl'];
    }
    /**
     * Reset all comparison instances (useful for testing)
     */
    static reset() {
        this.mlbComparison = null;
        this.nbaComparison = null;
        this.nflComparison = null;
    }
}
//# sourceMappingURL=comparison-factory.js.map