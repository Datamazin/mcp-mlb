/**
 * MLB Player Comparison Utilities
 *
 * Phase 1 Refactoring: Now extends BaseComparison for multi-sport architecture
 * Utilities for comparing MLB player statistics.
 */
import { BaseComparison, BaseComparisonResult, ComparisonMetric } from './base-comparison.js';
import { MLBAPIClient } from '../api/mlb-api.js';
/**
 * MLB Comparison Class - extends BaseComparison
 *
 * Phase 1 Refactoring: Implements the common comparison interface
 * while maintaining MLB-specific functionality
 */
export declare class MLBComparison extends BaseComparison {
    constructor(mlbClient: MLBAPIClient);
    /**
     * Extract stats from MLB player data based on stat group
     */
    protected extractStats(playerData: any, statGroup?: string): Record<string, any>;
    /**
     * Get MLB metrics for comparison based on stat group
     */
    protected getMetrics(statGroup?: string): ComparisonMetric[];
    /**
     * Get player name from MLB player data
     */
    protected getPlayerName(playerData: any): string;
    /**
     * Override comparePlayers to support MLB-specific season/gameType parameters
     */
    comparePlayers(player1Id: number | string, player2Id: number | string, season?: string | number, statGroup?: string): Promise<BaseComparisonResult>;
}
/**
 * Legacy PlayerComparisonResult interface (re-exported from base)
 */
export type PlayerComparisonResult = BaseComparisonResult;
/**
 * Legacy comparePlayers function (for backwards compatibility)
 */
export declare function comparePlayers(mlbClient: MLBAPIClient, player1Id: number, player2Id: number, season?: string | number, statGroup?: 'hitting' | 'pitching' | 'fielding'): Promise<PlayerComparisonResult>;
/**
 * Legacy formatComparisonResult function (uses base class method)
 */
export declare function formatComparisonResult(result: PlayerComparisonResult): string;
/**
 * Legacy searchPlayerWithPrompt function (for backwards compatibility)
 */
export declare function searchPlayerWithPrompt(mlbClient: MLBAPIClient, playerName: string): Promise<number | null>;
//# sourceMappingURL=mlb-comparison.d.ts.map