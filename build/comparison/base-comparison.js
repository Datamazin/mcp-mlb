/**
 * Base Comparison Utilities
 *
 * Abstract base class for comparing player statistics across different sports.
 * Each sport implements its own comparison logic while following this structure.
 *
 * Phase 1: Refactoring - Extract common comparison patterns
 */
/**
 * Abstract Base Comparison Class
 *
 * All sport-specific comparison classes must extend this
 */
export class BaseComparison {
    apiClient;
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Main comparison method - compares two players
     * This is the public interface that all sports expose
     */
    async comparePlayers(player1Id, player2Id, season, statGroup) {
        // Fetch stats for both players
        const [player1Data, player2Data] = await Promise.all([
            this.apiClient.getPlayerStats(player1Id, { season }),
            this.apiClient.getPlayerStats(player2Id, { season })
        ]);
        // Extract relevant stats based on stat group (sport-specific)
        const stats1 = this.extractStats(player1Data, statGroup);
        const stats2 = this.extractStats(player2Data, statGroup);
        // Get metrics for this stat group (sport-specific)
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
    /**
     * Compare two sets of stats based on metrics
     * Common logic that works for all sports
     */
    compareStats(stats1, stats2, metrics) {
        return metrics.map(metric => {
            const value1 = stats1[metric.key] || 0;
            const value2 = stats2[metric.key] || 0;
            let winner;
            if (value1 > value2) {
                winner = metric.higherIsBetter ? 'player1' : 'player2';
            }
            else if (value2 > value1) {
                winner = metric.higherIsBetter ? 'player2' : 'player1';
            }
            else {
                winner = 'tie';
            }
            return {
                category: metric.name,
                player1Value: value1,
                player2Value: value2,
                winner,
                difference: Math.abs(value1 - value2)
            };
        });
    }
    /**
     * Determine overall winner from comparison results
     * Common logic that works for all sports
     */
    determineWinner(comparison) {
        const player1Wins = comparison.filter(c => c.winner === 'player1').length;
        const player2Wins = comparison.filter(c => c.winner === 'player2').length;
        const overallWinner = player1Wins > player2Wins ? 'player1' :
            player2Wins > player1Wins ? 'player2' : 'tie';
        return { overallWinner, player1Wins, player2Wins };
    }
    /**
     * Generate human-readable summary
     * Common logic that works for all sports
     */
    generateSummary(player1Name, player2Name, player1Wins, player2Wins, statGroup) {
        const groupText = statGroup ? ` ${statGroup}` : '';
        if (player1Wins > player2Wins) {
            return `${player1Name} leads in ${player1Wins} out of ${player1Wins + player2Wins} key${groupText} categories.`;
        }
        else if (player2Wins > player1Wins) {
            return `${player2Name} leads in ${player2Wins} out of ${player1Wins + player2Wins} key${groupText} categories.`;
        }
        else {
            return `${player1Name} and ${player2Name} are tied in key${groupText} categories.`;
        }
    }
    /**
     * Format comparison result as readable string
     * Common formatting that works for all sports
     */
    formatComparisonResult(result) {
        let output = `\n${'='.repeat(80)}\n`;
        output += `PLAYER COMPARISON: ${result.player1.name} vs ${result.player2.name}\n`;
        output += `${'='.repeat(80)}\n\n`;
        // Category breakdown
        result.comparison.forEach(comp => {
            const winner = comp.winner === 'player1' ? result.player1.name :
                comp.winner === 'player2' ? result.player2.name : 'TIE';
            output += `${comp.category}:\n`;
            output += `  ${result.player1.name}: ${comp.player1Value}\n`;
            output += `  ${result.player2.name}: ${comp.player2Value}\n`;
            output += `  Winner: ${winner}\n\n`;
        });
        // Overall summary
        output += `${'='.repeat(80)}\n`;
        output += `SUMMARY: ${result.summary}\n`;
        output += `${'='.repeat(80)}\n`;
        return output;
    }
    /**
     * Search for player with error handling
     * Common helper that works for all sports
     */
    async searchPlayer(playerName) {
        try {
            const results = await this.apiClient.searchPlayers(playerName);
            if (!results || results.length === 0) {
                console.error(`No players found matching: ${playerName}`);
                return null;
            }
            // If exact match or single result, return immediately
            if (results.length === 1) {
                return results[0].id;
            }
            // Multiple matches - return first (or implement selection logic)
            console.error(`Found ${results.length} players matching "${playerName}"`);
            console.error('Using first match:', results[0].fullName);
            return results[0].id;
        }
        catch (error) {
            console.error('Error searching for player:', error);
            return null;
        }
    }
}
//# sourceMappingURL=base-comparison.js.map