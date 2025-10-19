/**
 * Comparison Factory
 * 
 * Factory pattern for creating sport-specific comparison classes.
 * Provides singleton instances for each league to optimize performance.
 * 
 * Supported Leagues:
 * - MLB: Major League Baseball
 * - NBA: National Basketball Association
 * - NFL: National Football League (Phase 3 - not yet implemented)
 */

import { BaseComparison } from './base-comparison.js';
import { MLBComparison } from './mlb-comparison.js';
import { NBAComparison } from './nba-comparison.js';
import { League, SportAPIFactory } from '../api/sport-api-factory.js';
import { MLBAPIClient } from '../api/mlb-api.js';
import { NBAAPIClient } from '../api/nba-api.js';

/**
 * Factory for creating and managing sport comparison classes
 * Uses singleton pattern to maintain comparison instances
 */
export class ComparisonFactory {
  private static mlbComparison: MLBComparison | null = null;
  private static nbaComparison: NBAComparison | null = null;
  // private static nflComparison: NFLComparison | null = null; // Phase 3
  
  /**
   * Get comparison class for specified league
   * Creates new instance on first call, returns cached instance on subsequent calls
   * 
   * @param league - Sport league identifier (mlb, nba, nfl)
   * @returns BaseComparison implementation for the league
   * @throws Error if league is not supported
   */
  static getComparison(league: League): BaseComparison {
    const normalizedLeague = league.toLowerCase() as League;
    
    switch (normalizedLeague) {
      case 'mlb':
        if (!this.mlbComparison) {
          const mlbClient = SportAPIFactory.getClient('mlb') as MLBAPIClient;
          this.mlbComparison = new MLBComparison(mlbClient);
        }
        return this.mlbComparison;
        
      case 'nba':
        if (!this.nbaComparison) {
          const nbaClient = SportAPIFactory.getClient('nba') as NBAAPIClient;
          this.nbaComparison = new NBAComparison(nbaClient);
        }
        return this.nbaComparison;
        
      case 'nfl':
        throw new Error('NFL comparison not yet implemented. Coming in Phase 3!');
        
      default:
        throw new Error(`Unknown league: ${league}. Supported leagues: mlb, nba`);
    }
  }
  
  /**
   * Check if a league is supported
   * 
   * @param league - League to check
   * @returns true if league is supported
   */
  static isSupported(league: string): boolean {
    return ['mlb', 'nba'].includes(league.toLowerCase());
  }
  
  /**
   * Get list of supported leagues
   * 
   * @returns Array of supported league identifiers
   */
  static getSupportedLeagues(): League[] {
    return ['mlb', 'nba'];
  }
  
  /**
   * Reset all comparison instances (useful for testing)
   */
  static reset(): void {
    this.mlbComparison = null;
    this.nbaComparison = null;
  }
}
