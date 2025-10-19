/**
 * MLB Player Comparison Utilities
 *
 * Phase 1 Refactoring: Now extends BaseComparison for multi-sport architecture
 * Utilities for comparing MLB player statistics.
 */
import { BaseComparison } from './base-comparison.js';
import { MLBAPIClient } from '../api/mlb-api.js';
/**
 * MLB Comparison Class - extends BaseComparison
 *
 * Phase 1 Refactoring: Implements the common comparison interface
 * while maintaining MLB-specific functionality
 */
export class MLBComparison extends BaseComparison {
    constructor(mlbClient) {
        super(mlbClient);
    }
    /**
     * Extract stats from MLB player data based on stat group
     */
    extractStats(playerData, statGroup) {
        const group = statGroup || 'hitting';
        const statObj = playerData.stats?.find((s) => s.group?.displayName?.toLowerCase().includes(group.toLowerCase()));
        return statObj?.stats || {};
    }
    /**
     * Get MLB metrics for comparison based on stat group
     */
    getMetrics(statGroup) {
        const group = statGroup || 'hitting';
        switch (group.toLowerCase()) {
            case 'hitting':
                return [
                    { key: 'avg', name: 'Batting Average', higherIsBetter: true },
                    { key: 'ops', name: 'OPS', higherIsBetter: true },
                    { key: 'homeRuns', name: 'Home Runs', higherIsBetter: true },
                    { key: 'rbi', name: 'RBIs', higherIsBetter: true },
                    { key: 'hits', name: 'Hits', higherIsBetter: true }
                ];
            case 'pitching':
                return [
                    { key: 'era', name: 'ERA', higherIsBetter: false },
                    { key: 'whip', name: 'WHIP', higherIsBetter: false },
                    { key: 'wins', name: 'Wins', higherIsBetter: true },
                    { key: 'strikeOuts', name: 'Strikeouts', higherIsBetter: true },
                    { key: 'inningsPitched', name: 'Innings Pitched', higherIsBetter: true }
                ];
            case 'fielding':
                return [
                    { key: 'fielding', name: 'Fielding %', higherIsBetter: true },
                    { key: 'assists', name: 'Assists', higherIsBetter: true },
                    { key: 'putOuts', name: 'Putouts', higherIsBetter: true },
                    { key: 'errors', name: 'Errors', higherIsBetter: false },
                    { key: 'doublePlays', name: 'Double Plays', higherIsBetter: true }
                ];
            default:
                return [];
        }
    }
    /**
     * Get player name from MLB player data
     */
    getPlayerName(playerData) {
        return playerData.player?.fullName || 'Unknown Player';
    }
    /**
     * Override comparePlayers to support MLB-specific season/gameType parameters
     */
    async comparePlayers(player1Id, player2Id, season, statGroup) {
        // Determine the stats type based on season for MLB
        const statsType = typeof season === 'string' && season === 'career' ? 'career' : 'season';
        const seasonYear = typeof season === 'string' && season === 'career' ? undefined : Number(season);
        const gameType = 'R'; // Regular season
        // Fetch stats for both players with MLB-specific parameters
        const mlbClient = this.apiClient;
        const [player1Data, player2Data] = await Promise.all([
            mlbClient.getPlayerStats(Number(player1Id), seasonYear, gameType, statsType),
            mlbClient.getPlayerStats(Number(player2Id), seasonYear, gameType, statsType)
        ]);
        // Extract relevant stats based on stat group
        const stats1 = this.extractStats(player1Data, statGroup);
        const stats2 = this.extractStats(player2Data, statGroup);
        // Get metrics for this stat group
        const metrics = this.getMetrics(statGroup);
        // Perform comparison
        const comparison = this.compareStats(stats1, stats2, metrics);
        // Determine overall winner
        const { overallWinner, player1Wins, player2Wins } = this.determineWinner(comparison);
        // Generate summary
        const summary = this.generateSummary(this.getPlayerName(player1Data), this.getPlayerName(player2Data), player1Wins, player2Wins, statGroup);
        return {
            player1: {
                id: player1Id,
                name: this.getPlayerName(player1Data),
                stats: stats1
            },
            player2: {
                id: player2Id,
                name: this.getPlayerName(player2Data),
                stats: stats2
            },
            comparison,
            overallWinner,
            summary
        };
    }
}
/**
 * Legacy comparePlayers function (for backwards compatibility)
 */
export async function comparePlayers(mlbClient, player1Id, player2Id, season = 'career', statGroup = 'hitting') {
    const comparison = new MLBComparison(mlbClient);
    return comparison.comparePlayers(player1Id, player2Id, season, statGroup);
}
/**
 * Legacy formatComparisonResult function (uses base class method)
 */
export function formatComparisonResult(result) {
    const comparison = new MLBComparison(new MLBAPIClient());
    return comparison.formatComparisonResult(result);
}
/**
 * Legacy searchPlayerWithPrompt function (for backwards compatibility)
 */
export async function searchPlayerWithPrompt(mlbClient, playerName) {
    const comparison = new MLBComparison(mlbClient);
    const playerId = await comparison.searchPlayer(playerName);
    return typeof playerId === 'number' ? playerId : null;
}
//# sourceMappingURL=mlb-comparison.js.map