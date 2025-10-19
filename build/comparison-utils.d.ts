/**
 * Player Comparison Utilities
 *
 * Utilities for comparing player statistics inspired by MCP server best practices.
 * These utilities can be used by both the MCP server and standalone scripts.
 */
import { MLBAPIClient } from './mlb-api.js';
export interface PlayerComparisonResult {
    [x: string]: unknown;
    player1: {
        id: number;
        name: string;
        stats: any;
    };
    player2: {
        id: number;
        name: string;
        stats: any;
    };
    comparison: {
        category: string;
        player1Value: number;
        player2Value: number;
        winner: 'player1' | 'player2' | 'tie';
        difference: number;
    }[];
    overallWinner?: 'player1' | 'player2' | 'tie';
    summary: string;
}
/**
 * Compare two players' statistics
 */
export declare function comparePlayers(mlbClient: MLBAPIClient, player1Id: number, player2Id: number, season?: string | number, statGroup?: 'hitting' | 'pitching' | 'fielding'): Promise<PlayerComparisonResult>;
/**
 * Format comparison result as a readable string
 */
export declare function formatComparisonResult(result: PlayerComparisonResult): string;
/**
 * Search for players by name with better error handling
 */
export declare function searchPlayerWithPrompt(mlbClient: MLBAPIClient, playerName: string): Promise<number | null>;
//# sourceMappingURL=comparison-utils.d.ts.map