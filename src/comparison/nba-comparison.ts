/**
 * NBA Player Comparison
 * 
 * Extends BaseComparison to provide NBA-specific comparison logic for basketball players
 * 
 * Phase 2: NBA Implementation
 */

import { BaseComparison, ComparisonMetric, BaseComparisonResult } from './base-comparison.js';
import { NBAAPIClient, NBAPlayerStats } from '../api/nba-api.js';

/**
 * NBA Comparison Class
 */
export class NBAComparison extends BaseComparison {
  constructor(apiClient?: NBAAPIClient) {
    super(apiClient || new NBAAPIClient());
  }

  /**
   * Extract stats from NBA player data
   */
  protected extractStats(data: any): Record<string, number> {
    const stats: Record<string, number> = {};
    
    // Overall stats
    stats.gp = data.gp || 0;
    stats.pts = data.pts || 0;
    stats.ppg = data.gp > 0 ? data.pts / data.gp : 0;
    
    // Scoring stats
    stats.fg_pct = data.fg_pct || 0;
    stats.fg3_pct = data.fg3_pct || 0;
    stats.ft_pct = data.ft_pct || 0;
    stats.fgm = data.fgm || 0;
    stats.fga = data.fga || 0;
    stats.fg3m = data.fg3m || 0;
    stats.fg3a = data.fg3a || 0;
    stats.ftm = data.ftm || 0;
    stats.fta = data.fta || 0;
    
    // Playmaking stats
    stats.ast = data.ast || 0;
    stats.apg = data.gp > 0 ? data.ast / data.gp : 0;
    stats.tov = data.tov || 0;
    stats.ast_to_ratio = data.tov > 0 ? data.ast / data.tov : data.ast;
    
    // Defense stats
    stats.stl = data.stl || 0;
    stats.blk = data.blk || 0;
    stats.spg = data.gp > 0 ? data.stl / data.gp : 0;
    stats.bpg = data.gp > 0 ? data.blk / data.gp : 0;
    stats.pf = data.pf || 0;
    
    // Rebounding stats
    stats.reb = data.reb || 0;
    stats.rpg = data.gp > 0 ? data.reb / data.gp : 0;
    stats.oreb = data.oreb || 0;
    stats.dreb = data.dreb || 0;
    stats.orpg = data.gp > 0 ? data.oreb / data.gp : 0;
    stats.drpg = data.gp > 0 ? data.dreb / data.gp : 0;
    
    return stats;
  }

  /**
   * Define NBA stat groups and metrics
   */
  protected getMetrics(): ComparisonMetric[] {
    return [
      // Overall
      { key: 'gp', name: 'Games Played', higherIsBetter: true },
      { key: 'pts', name: 'Total Points', higherIsBetter: true },
      { key: 'ppg', name: 'Points Per Game', higherIsBetter: true },
      
      // Scoring
      { key: 'fg_pct', name: 'Field Goal %', higherIsBetter: true },
      { key: 'fg3_pct', name: '3-Point %', higherIsBetter: true },
      { key: 'ft_pct', name: 'Free Throw %', higherIsBetter: true },
      { key: 'fgm', name: 'Field Goals Made', higherIsBetter: true },
      { key: 'fg3m', name: '3-Pointers Made', higherIsBetter: true },
      
      // Playmaking
      { key: 'ast', name: 'Total Assists', higherIsBetter: true },
      { key: 'apg', name: 'Assists Per Game', higherIsBetter: true },
      { key: 'tov', name: 'Turnovers', higherIsBetter: false },
      { key: 'ast_to_ratio', name: 'Assist/TO Ratio', higherIsBetter: true },
      
      // Defense
      { key: 'stl', name: 'Total Steals', higherIsBetter: true },
      { key: 'blk', name: 'Total Blocks', higherIsBetter: true },
      { key: 'spg', name: 'Steals Per Game', higherIsBetter: true },
      { key: 'bpg', name: 'Blocks Per Game', higherIsBetter: true },
      
      // Rebounding
      { key: 'reb', name: 'Total Rebounds', higherIsBetter: true },
      { key: 'rpg', name: 'Rebounds Per Game', higherIsBetter: true },
      { key: 'oreb', name: 'Offensive Rebounds', higherIsBetter: true },
      { key: 'dreb', name: 'Defensive Rebounds', higherIsBetter: true },
    ];
  }

  /**
   * Get player name from stats data
   */
  protected getPlayerName(playerData: any): string {
    // Try to get name from player data if it has it
    if (playerData && playerData.fullName) {
      return playerData.fullName;
    }
    // NBA stats don't include player name, so we'll need the ID
    return `Player ${playerData?.playerId || 'Unknown'}`;
  }
}

// Export singleton instance for convenience
export const nbaComparison = new NBAComparison();

// Export legacy function API for backwards compatibility
export async function comparePlayers(
  player1Name: string,
  player2Name: string,
  season?: string | number,
  statGroup?: string
): Promise<BaseComparisonResult> {
  const comparison = new NBAComparison();
  // Search for players by name
  const player1Id = await comparison.searchPlayer(player1Name);
  const player2Id = await comparison.searchPlayer(player2Name);
  
  if (!player1Id) {
    throw new Error(`Player not found: ${player1Name}`);
  }
  if (!player2Id) {
    throw new Error(`Player not found: ${player2Name}`);
  }
  
  return comparison.comparePlayers(player1Id, player2Id, season, statGroup);
}

export function formatComparisonResult(result: BaseComparisonResult): string {
  const comparison = new NBAComparison();
  return comparison.formatComparisonResult(result);
}
