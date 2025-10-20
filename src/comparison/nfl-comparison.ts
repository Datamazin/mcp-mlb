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
   * Get metrics based on stat group
   * Supports both position-based (QB, RB, WR) and category-based (passing, rushing, receiving)
   */
  protected getMetrics(statGroup?: string): ComparisonMetric[] {
    const group = (statGroup || 'QB').toUpperCase();
    
    // Check if it's a stat category (passing, rushing, receiving, etc.)
    const categoryMetrics = this.getMetricsForCategory(group);
    if (categoryMetrics.length > 0) {
      return categoryMetrics;
    }
    
    // Otherwise treat as position
    return this.getMetricsForPosition(group);
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

    // Build category-specific stat maps to handle duplicate stat names
    const categoryStats: { [categoryName: string]: { [statName: string]: number } } = {};
    
    for (const category of splits.categories) {
      categoryStats[category.name] = {};
      for (const stat of category.stats || []) {
        categoryStats[category.name][stat.name] = stat.value;
      }
    }

    // Get metrics for this stat group (position or category)
    const metrics = this.getMetrics(statGroup);
    const group = (statGroup || 'QB').toUpperCase();

    // Extract each metric value using category-aware lookup
    for (const metric of metrics) {
      let value = 0;
      
      // For passing stats, prioritize the passing category for sacks (sacks taken)
      if (group === 'PASSING' && metric.key === 'sacks') {
        value = categoryStats['passing']?.[metric.key] || 0;
      } else {
        // For other stats, use the first available value from any category
        for (const categoryName in categoryStats) {
          if (categoryStats[categoryName][metric.key] !== undefined) {
            value = categoryStats[categoryName][metric.key];
            break;
          }
        }
      }
      
      stats[metric.key] = value;
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
   * Get comparison metrics based on stat category
   * ESPN returns categories: general, passing, rushing, receiving, defensive, defensiveInterceptions, scoring
   * Keys must match ESPN stat.name values from the API
   */
  private getMetricsForCategory(category: string): ComparisonMetric[] {
    const cat = category.toUpperCase();

    // Passing category metrics - using ESPN stat.name keys
    if (cat === 'PASSING') {
      return [
        { key: 'teamGamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'completions', name: 'Completions', higherIsBetter: true },
        { key: 'passingAttempts', name: 'Attempts', higherIsBetter: true },
        { key: 'completionPct', name: 'Completion %', higherIsBetter: true },
        { key: 'netPassingYards', name: 'Passing Yards', higherIsBetter: true },
        { key: 'yardsPerPassAttempt', name: 'Yards/Attempt', higherIsBetter: true },
        { key: 'passingTouchdowns', name: 'Passing TDs', higherIsBetter: true },
        { key: 'interceptions', name: 'Interceptions', higherIsBetter: false },
        { key: 'QBRating', name: 'QB Rating', higherIsBetter: true },
        { key: 'sacks', name: 'Sacks Taken', higherIsBetter: false }
      ];
    }

    // Rushing category metrics - using ESPN stat.name keys
    if (cat === 'RUSHING') {
      return [
        { key: 'teamGamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'rushingAttempts', name: 'Rushing Attempts', higherIsBetter: true },
        { key: 'rushingYards', name: 'Rushing Yards', higherIsBetter: true },
        { key: 'yardsPerRushAttempt', name: 'Yards/Carry', higherIsBetter: true },
        { key: 'longRushing', name: 'Long Rush', higherIsBetter: true },
        { key: 'rushingTouchdowns', name: 'Rushing TDs', higherIsBetter: true },
        { key: 'rushingBigPlays', name: '20+ Yard Rushes', higherIsBetter: true },
        { key: 'rushingFumbles', name: 'Fumbles', higherIsBetter: false }
      ];
    }

    // Receiving category metrics - using ESPN stat.name keys
    if (cat === 'RECEIVING') {
      return [
        { key: 'teamGamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'receptions', name: 'Receptions', higherIsBetter: true },
        { key: 'receivingTargets', name: 'Targets', higherIsBetter: true },
        { key: 'receivingYards', name: 'Receiving Yards', higherIsBetter: true },
        { key: 'yardsPerReception', name: 'Yards/Reception', higherIsBetter: true },
        { key: 'longReception', name: 'Long Reception', higherIsBetter: true },
        { key: 'receivingTouchdowns', name: 'Receiving TDs', higherIsBetter: true },
        { key: 'receivingBigPlays', name: '20+ Yard Receptions', higherIsBetter: true },
        { key: 'receivingFumbles', name: 'Fumbles', higherIsBetter: false }
      ];
    }

    // Defensive category metrics - using ESPN stat.name keys
    if (cat === 'DEFENSIVE' || cat === 'DEFENSE') {
      return [
        { key: 'teamGamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'totalTackles', name: 'Total Tackles', higherIsBetter: true },
        { key: 'soloTackles', name: 'Solo Tackles', higherIsBetter: true },
        { key: 'assistTackles', name: 'Assist Tackles', higherIsBetter: true },
        { key: 'sacks', name: 'Sacks', higherIsBetter: true },
        { key: 'sackYards', name: 'Sack Yards', higherIsBetter: true },
        { key: 'tacklesForLoss', name: 'Tackles For Loss', higherIsBetter: true },
        { key: 'passesDefended', name: 'Passes Defended', higherIsBetter: true },
        { key: 'fumblesForced', name: 'Forced Fumbles', higherIsBetter: true },
        { key: 'fumblesRecovered', name: 'Fumble Recoveries', higherIsBetter: true }
      ];
    }

    // General category metrics - using ESPN stat.name keys
    if (cat === 'GENERAL') {
      return [
        { key: 'gamesPlayed', name: 'Games Played', higherIsBetter: true },
        { key: 'fumbles', name: 'Fumbles', higherIsBetter: false },
        { key: 'fumblesLost', name: 'Fumbles Lost', higherIsBetter: false },
        { key: 'fumblesForced', name: 'Forced Fumbles', higherIsBetter: true },
        { key: 'fumblesRecovered', name: 'Fumbles Recovered', higherIsBetter: true }
      ];
    }

    // Scoring category metrics - using ESPN stat.name keys
    if (cat === 'SCORING') {
      return [
        { key: 'totalPoints', name: 'Total Points', higherIsBetter: true },
        { key: 'totalTouchdowns', name: 'Touchdowns', higherIsBetter: true },
        { key: 'rushingTouchdowns', name: 'Rushing TDs', higherIsBetter: true },
        { key: 'receivingTouchdowns', name: 'Receiving TDs', higherIsBetter: true },
        { key: 'passingTouchdowns', name: 'Passing TDs', higherIsBetter: true },
        { key: 'twoPointPassConvs', name: '2-Pt Pass Conversions', higherIsBetter: true },
        { key: 'twoPointRushConvs', name: '2-Pt Rush Conversions', higherIsBetter: true },
        { key: 'twoPointRecConvs', name: '2-Pt Rec Conversions', higherIsBetter: true }
      ];
    }

    // No matching category, return empty array
    return [];
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
      sacksTaken: ['Sacks', 'SCK', 'SacksTaken'],
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
