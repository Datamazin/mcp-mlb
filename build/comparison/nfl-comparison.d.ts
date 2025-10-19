/**
 * NFL Player Comparison
 *
 * Compares NFL players with position-specific metrics
 * Quarterbacks, Running Backs, Wide Receivers/Tight Ends, Defensive Players
 */
import { BaseComparison, ComparisonMetric } from './base-comparison.js';
import { NFLAPIClient } from '../api/nfl-api.js';
export declare class NFLComparison extends BaseComparison {
    constructor(apiClient: NFLAPIClient);
    /**
     * Get metrics based on stat group
     * Supports both position-based (QB, RB, WR) and category-based (passing, rushing, receiving)
     */
    protected getMetrics(statGroup?: string): ComparisonMetric[];
    /**
     * Extract player name from data
     */
    protected getPlayerName(playerData: any): string;
    /**
     * Extract stats from player data
     * ESPN Core API structure: playerData.splits.categories[].stats[]
     */
    protected extractStats(playerData: any, statGroup?: string): Record<string, any>;
    /**
     * Get comparison metrics based on position
     */
    private getMetricsForPosition;
    /**
     * Get comparison metrics based on stat category
     * ESPN returns categories: general, passing, rushing, receiving, defensive, defensiveInterceptions, scoring
     * Keys must match ESPN stat.name values from the API
     */
    private getMetricsForCategory;
    /**
     * Extract a specific stat value from the stat map
     */
    private extractStatValue;
}
//# sourceMappingURL=nfl-comparison.d.ts.map