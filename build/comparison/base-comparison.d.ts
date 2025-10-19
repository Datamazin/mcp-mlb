/**
 * Base Comparison Utilities
 *
 * Abstract base class for comparing player statistics across different sports.
 * Each sport implements its own comparison logic while following this structure.
 *
 * Phase 1: Refactoring - Extract common comparison patterns
 */
import { BaseSportAPI } from '../api/base-api.js';
/**
 * Generic comparison result structure
 */
export interface BaseComparisonResult {
    player1: {
        id: number | string;
        name: string;
        stats: any;
    };
    player2: {
        id: number | string;
        name: string;
        stats: any;
    };
    comparison: Array<{
        category: string;
        player1Value: number;
        player2Value: number;
        winner: 'player1' | 'player2' | 'tie';
        difference: number;
    }>;
    overallWinner?: 'player1' | 'player2' | 'tie';
    summary: string;
}
/**
 * Metric definition for comparisons
 */
export interface ComparisonMetric {
    key: string;
    name: string;
    higherIsBetter: boolean;
}
/**
 * Abstract Base Comparison Class
 *
 * All sport-specific comparison classes must extend this
 */
export declare abstract class BaseComparison {
    protected apiClient: BaseSportAPI;
    constructor(apiClient: BaseSportAPI);
    /**
     * Main comparison method - compares two players
     * This is the public interface that all sports expose
     */
    comparePlayers(player1Id: number | string, player2Id: number | string, season?: string | number, statGroup?: string): Promise<BaseComparisonResult>;
    /**
     * Compare two sets of stats based on metrics
     * Common logic that works for all sports
     */
    protected compareStats(stats1: Record<string, any>, stats2: Record<string, any>, metrics: ComparisonMetric[]): BaseComparisonResult['comparison'];
    /**
     * Determine overall winner from comparison results
     * Common logic that works for all sports
     */
    protected determineWinner(comparison: BaseComparisonResult['comparison']): {
        overallWinner: 'player1' | 'player2' | 'tie';
        player1Wins: number;
        player2Wins: number;
    };
    /**
     * Generate human-readable summary
     * Common logic that works for all sports
     */
    protected generateSummary(player1Name: string, player2Name: string, player1Wins: number, player2Wins: number, statGroup?: string): string;
    /**
     * Format comparison result as readable string
     * Common formatting that works for all sports
     */
    formatComparisonResult(result: BaseComparisonResult): string;
    /**
     * Search for player with error handling
     * Common helper that works for all sports
     */
    searchPlayer(playerName: string): Promise<number | string | null>;
    /**
     * Extract stats from player data based on stat group
     * Must be implemented by each sport (different data structures)
     */
    protected abstract extractStats(playerData: any, statGroup?: string): Record<string, any>;
    /**
     * Get metrics for comparison based on stat group
     * Must be implemented by each sport (different stats available)
     */
    protected abstract getMetrics(statGroup?: string): ComparisonMetric[];
    /**
     * Get player name from player data
     * Must be implemented by each sport (different data structures)
     */
    protected abstract getPlayerName(playerData: any): string;
}
//# sourceMappingURL=base-comparison.d.ts.map