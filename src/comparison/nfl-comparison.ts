/**
 * NFL Player Comparison
 * 
 * Compares NFL players with position-specific metrics
 * Quarterbacks, Running Backs, Wide Receivers/Tight Ends, Defensive Players
 */

import { BaseComparison, ComparisonMetric, BaseComparisonResult } from './base-comparison.js';
import { NFLAPIClient } from '../api/nfl-api.js';

export class NFLComparison extends BaseComparison {
  constructor(apiClient: NFLAPIClient) {
    super(apiClient);
  }

  /**
   * Get metrics based on stat group (position for NFL)
   */
  protected getMetrics(statGroup?: string): ComparisonMetric[] {
    const position = (statGroup || 'QB').toUpperCase();
    return this.getMetricsForPosition(position);
  }

  /**
   * Extract player name from data
   */
  protected getPlayerName(playerData: any): string {
    // NFLAPIClient now includes playerName in the stats response
    return playerData?.playerName || `Player ${playerData?.playerId || 'Unknown'}`;
  }

  /**
   * Extract stats from player data
   * ESPN Core API structure: playerData.splits.categories[].stats[]
   */
  protected extractStats(playerData: any, statGroup?: string): Record<string, any> {
    const stats: Record<string, any> = {};

    // ESPN Core API returns splits.categories structure
    const splits = playerData?.splits;
    
    if (!splits || !splits.categories) {
      return stats;
    }

    // Build a flat map of all stats from all categories
    const statMap: { [key: string]: number } = {};
    
    for (const category of splits.categories) {
      for (const stat of category.stats || []) {
        statMap[stat.name] = stat.value;
      }
    }

    // Get metrics for this position
    const position = statGroup || 'QB';
    const metrics = this.getMetricsForPosition(position);

    // Extract each metric value using the stat name
    for (const metric of metrics) {
      const value = statMap[metric.key];
      stats[metric.key] = value !== undefined ? value : 0;
    }

    return stats;
  }

  /**
   * Get comparison metrics based on position
   */
  private getMetricsForPosition(position: string): ComparisonMetric[] {
    const pos = position.toUpperCase();

    // Quarterback metrics - using ESPN Core API stat names
    if (pos === 'QB') {
      return [
        { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'passingYards', name: 'Passing Yards', higherIsBetter: true },
        { key: 'passingTouchdowns', name: 'Passing TDs', higherIsBetter: true },
        { key: 'interceptions', name: 'Interceptions', higherIsBetter: false },
        { key: 'completions', name: 'Completions', higherIsBetter: true },
        { key: 'passingAttempts', name: 'Attempts', higherIsBetter: true },
        { key: 'completionPct', name: 'Completion %', higherIsBetter: true },
        { key: 'yardsPerPassAttempt', name: 'Yards/Attempt', higherIsBetter: true },
        { key: 'QBRating', name: 'QB Rating', higherIsBetter: true },
        { key: 'rushingYards', name: 'Rushing Yards', higherIsBetter: true }
      ];
    }

    // Running Back metrics
    if (pos === 'RB') {
      return [
        { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'rushingYards', name: 'Rushing Yards', higherIsBetter: true },
        { key: 'rushingTDs', name: 'Rushing TDs', higherIsBetter: true },
        { key: 'rushingAttempts', name: 'Rushing Attempts', higherIsBetter: true },
        { key: 'yardsPerCarry', name: 'Yards/Carry', higherIsBetter: true },
        { key: 'receptions', name: 'Receptions', higherIsBetter: true },
        { key: 'receivingYards', name: 'Receiving Yards', higherIsBetter: true },
        { key: 'receivingTDs', name: 'Receiving TDs', higherIsBetter: true },
        { key: 'fumbles', name: 'Fumbles', higherIsBetter: false }
      ];
    }

    // Wide Receiver / Tight End metrics
    if (pos === 'WR' || pos === 'TE') {
      return [
        { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'receptions', name: 'Receptions', higherIsBetter: true },
        { key: 'receivingYards', name: 'Receiving Yards', higherIsBetter: true },
        { key: 'receivingTDs', name: 'Receiving TDs', higherIsBetter: true },
        { key: 'targets', name: 'Targets', higherIsBetter: true },
        { key: 'yardsPerReception', name: 'Yards/Reception', higherIsBetter: true },
        { key: 'longReception', name: 'Long Reception', higherIsBetter: true },
        { key: 'fumbles', name: 'Fumbles', higherIsBetter: false }
      ];
    }

    // Defensive metrics (for all defensive positions)
    if (['DE', 'DT', 'LB', 'CB', 'S', 'DB'].includes(pos)) {
      return [
        { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'tackles', name: 'Total Tackles', higherIsBetter: true },
        { key: 'soloTackles', name: 'Solo Tackles', higherIsBetter: true },
        { key: 'sacks', name: 'Sacks', higherIsBetter: true },
        { key: 'interceptions', name: 'Interceptions', higherIsBetter: true },
        { key: 'passesDefended', name: 'Passes Defended', higherIsBetter: true },
        { key: 'forcedFumbles', name: 'Forced Fumbles', higherIsBetter: true },
        { key: 'fumbleRecoveries', name: 'Fumble Recoveries', higherIsBetter: true }
      ];
    }

    // Default general metrics
    return [
      { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
      { key: 'touchdowns', name: 'Total TDs', higherIsBetter: true },
      { key: 'yardsGained', name: 'Total Yards', higherIsBetter: true }
    ];
  }

  /**
   * Extract a specific stat value from the stat map
   */
  private extractStatValue(statMap: { [key: string]: number }, key: string): number | null {
    // Map our keys to ESPN labels
    const keyMappings: { [key: string]: string[] } = {
      gamesPlayed: ['GP', 'G', 'Games'],
      passingYards: ['YDS', 'PassYds', 'Pass Yds'],
      passingTDs: ['TD', 'PassTD', 'Pass TD'],
      interceptions: ['INT', 'Interceptions'],
      completions: ['COMP', 'Completions', 'C'],
      attempts: ['ATT', 'Attempts', 'A'],
      completionPct: ['PCT', 'Pct', 'Comp%', 'C%'],
      yardsPerAttempt: ['YPA', 'Y/A', 'Avg'],
      qbRating: ['QBR', 'Rating', 'RAT'],
      rushingYards: ['RushYds', 'RushYard', 'Rush Yds', 'RuYds'],
      rushingTDs: ['RushTD', 'Rush TD', 'RuTD'],
      rushingAttempts: ['RushAtt', 'Rush Att', 'Ru'],
      yardsPerCarry: ['YPC', 'Y/C', 'Avg'],
      receptions: ['REC', 'Receptions'],
      receivingYards: ['RecYds', 'Rec Yds', 'ReYds'],
      receivingTDs: ['RecTD', 'Rec TD', 'ReTD'],
      targets: ['TAR', 'Targets', 'TGT'],
      yardsPerReception: ['YPR', 'Y/R', 'AVG'],
      longReception: ['Long', 'LNG'],
      fumbles: ['FUM', 'Fumbles'],
      tackles: ['TAC', 'Tackles', 'Total'],
      soloTackles: ['Solo', 'SOLO'],
      sacks: ['SCK', 'Sacks'],
      passesDefended: ['PD', 'Pass Def', 'PassDef'],
      forcedFumbles: ['FF', 'Forced Fum'],
      fumbleRecoveries: ['FR', 'Fum Rec'],
      touchdowns: ['TD', 'TDs'],
      yardsGained: ['YDS', 'Yards']
    };

    const possibleLabels = keyMappings[key] || [key];

    for (const label of possibleLabels) {
      if (statMap[label] !== undefined) {
        return statMap[label];
      }
    }

    return null;
  }
}
