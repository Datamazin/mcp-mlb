/**
 * Sport API Factory
 * 
 * Factory pattern for creating sport-specific API clients.
 * Provides singleton instances for each league to maintain caches and optimize performance.
 * 
 * Supported Leagues:
 * - MLB: Major League Baseball
 * - NBA: National Basketball Association
 * - NFL: National Football League (Phase 3 - not yet implemented)
 */

import { BaseSportAPI } from './base-api.js';
import { MLBAPIClient } from './mlb-api.js';
import { NBAAPIClient } from './nba-api.js';

/**
 * Supported sports leagues
 */
export type League = 'mlb' | 'nba' | 'nfl';

/**
 * Factory for creating and managing sport API clients
 * Uses singleton pattern to maintain client instances and their caches
 */
export class SportAPIFactory {
  private static mlbClient: MLBAPIClient | null = null;
  private static nbaClient: NBAAPIClient | null = null;
  // private static nflClient: NFLAPIClient | null = null; // Phase 3
  
  /**
   * Get API client for specified league
   * Creates new client on first call, returns cached instance on subsequent calls
   * 
   * @param league - Sport league identifier (mlb, nba, nfl)
   * @returns BaseSportAPI implementation for the league
   * @throws Error if league is not supported
   */
  static getClient(league: League): BaseSportAPI {
    const normalizedLeague = league.toLowerCase() as League;
    
    switch (normalizedLeague) {
      case 'mlb':
        if (!this.mlbClient) {
          this.mlbClient = new MLBAPIClient('https://statsapi.mlb.com/api/v1');
        }
        return this.mlbClient;
        
      case 'nba':
        if (!this.nbaClient) {
          this.nbaClient = new NBAAPIClient();
        }
        return this.nbaClient;
        
      case 'nfl':
        throw new Error('NFL API not yet implemented. Coming in Phase 3!');
        
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
   * Reset all clients (useful for testing)
   */
  static reset(): void {
    this.mlbClient = null;
    this.nbaClient = null;
  }
}
