/**
 * NBA Player Comparison
 *
 * Extends BaseComparison to provide NBA-specific comparison logic for basketball players
 *
 * Phase 2: NBA Implementation
 */
import { BaseComparison, ComparisonMetric, BaseComparisonResult } from './base-comparison.js';
import { NBAAPIClient } from '../api/nba-api.js';
/**
 * NBA Comparison Class
 */
export declare class NBAComparison extends BaseComparison {
    constructor(apiClient?: NBAAPIClient);
    /**
     * Extract stats from NBA player data
     */
    protected extractStats(data: any): Record<string, number>;
    /**
     * Define NBA stat groups and metrics
     */
    protected getMetrics(): ComparisonMetric[];
    /**
     * Get player name from stats data
     */
    protected getPlayerName(playerData: any): string;
}
export declare const nbaComparison: NBAComparison;
export declare function comparePlayers(player1Name: string, player2Name: string, season?: string | number, statGroup?: string): Promise<BaseComparisonResult>;
export declare function formatComparisonResult(result: BaseComparisonResult): string;
//# sourceMappingURL=nba-comparison.d.ts.map