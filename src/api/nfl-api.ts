/**
 * NFL API Client using ESPN NFL API
 * 
 * Base URLs:
 * - Site API: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 * - Core API: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl
 * - Web API: https://site.web.api.espn.com/apis/common/v3/sports/football/nfl
 * 
 * Reference: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
 */

import { BaseSportAPI, BasePlayer, BaseTeam, BaseGame, BaseScheduleParams } from './base-api.js';

/**
 * NFL-specific schedule parameters that extend the base interface
 */
export interface NFLScheduleParams extends BaseScheduleParams {
  week?: number;        // NFL week number (1-18 for regular season)
  seasonType?: number;  // 1=preseason, 2=regular, 3=postseason, 4=off-season
}

// All 32 NFL team IDs
const NFL_TEAM_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34
];

export class NFLAPIClient extends BaseSportAPI {
  private siteBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  private coreBaseUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
  
  private playerCache: BasePlayer[] | null = null;
  private playerNameMap: Map<string, string> = new Map(); // Map player ID to full name
  private cacheExpiry: number | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super('https://site.api.espn.com/apis/site/v2/sports/football/nfl');
  }

  /**
   * Get the current NFL season year
   * NFL season spans two calendar years (e.g., 2024 season runs Sep 2024 - Feb 2025)
   * Returns the year the season started in
   * 
   * Note: For future seasons where data may not be available yet, this returns the
   * most likely season. API calls should handle 404s gracefully and fall back to
   * the previous season if needed.
   */
  private getCurrentNFLSeason(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    // NFL season typically runs September through February
    // If it's January-July, we're still in the previous year's season or off-season
    // If it's August-December, we're in the current year's season
    if (currentMonth >= 8) {
      // August through December: current year's season
      // Note: Early in the season (Aug-Sep), data might not be available yet
      return currentYear;
    } else if (currentMonth <= 2) {
      // January-February: previous year's season (playoffs/Super Bowl)
      return currentYear - 1;
    } else {
      // March-July: off-season, use previous year's completed season
      return currentYear - 1;
    }
  }

  /**
   * Search for NFL players by name
   * Loads all team rosters and caches them for 24h
   */
  async searchPlayers(query: string, activeStatus?: string): Promise<BasePlayer[]> {
    // Ensure player cache is loaded
    await this.ensurePlayerCache();
    
    if (!this.playerCache) {
      return [];
    }
    
    // Search through cached players
    const searchLower = query.toLowerCase();
    const results = this.playerCache.filter(player => 
      player.fullName.toLowerCase().includes(searchLower)
    );
    
    return results.slice(0, 20); // Limit to 20 results
  }

  /**
   * Get detailed player statistics
   * Uses the Core API statistics endpoint for comprehensive stats
   * Automatically falls back to previous season if current season data is not available
   */
  async getPlayerStats(playerId: string | number, options?: { season?: number }): Promise<any> {
    // Use current season if not specified
    const season = options?.season || this.getCurrentNFLSeason();
    const url = `${this.coreBaseUrl}/seasons/${season}/types/2/athletes/${playerId}/statistics/0?lang=en&region=us`;
    
    try {
      // Ensure cache is loaded so we have player names
      await this.ensurePlayerCache();
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Get player name from cache
      const playerName = this.playerNameMap.get(playerId.toString()) || `Player ${playerId}`;
      
      // Return the data with the splits structure and player name
      return {
        playerId: playerId,
        playerName: playerName,
        splits: data.splits,
        season: data.season || { year: season }
      };
    } catch (error) {
      console.error(`Error fetching player stats for ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get player game log
   */
  async getPlayerGamelog(playerId: string | number, season?: number): Promise<any> {
    const year = season || this.getCurrentNFLSeason();
    const url = `${this.coreBaseUrl}/seasons/${year}/athletes/${playerId}/eventlog`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch gamelog: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching gamelog for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get all NFL teams
   */
  async getTeams(): Promise<BaseTeam[]> {
    const url = `${this.siteBaseUrl}/teams`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const teams: BaseTeam[] = [];
      
      if (data.sports?.[0]?.leagues?.[0]?.teams) {
        for (const teamWrapper of data.sports[0].leagues[0].teams) {
          const team = teamWrapper.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            city: team.location
          });
        }
      }
      
      return teams;
    } catch (error) {
      console.error('Error fetching NFL teams:', error);
      return [];
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(teamId: string | number): Promise<BaseTeam> {
    const url = `${this.siteBaseUrl}/teams/${teamId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const team = data.team;
      return {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        city: team.location
      };
    } catch (error) {
      console.error(`Error fetching team info for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get team roster
   */
  async getTeamRoster(teamId: string | number): Promise<any> {
    const url = `${this.siteBaseUrl}/teams/${teamId}/roster`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching roster for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get NFL schedule/scoreboard
   */
  async getSchedule(params: NFLScheduleParams): Promise<BaseGame[]> {
    const dateStr = this.formatDate(params.startDate);
    let url = `${this.siteBaseUrl}/scoreboard?dates=${dateStr}`;
    
    // Add week parameter if provided
    if (params.week) {
      url += `&seasontype=${params.seasonType || 2}&week=${params.week}`;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const games: BaseGame[] = [];
      
      if (data.events) {
        for (const event of data.events) {
          const competition = event.competitions?.[0];
          if (!competition) continue;
          
          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away');
          
          games.push({
            id: event.id,
            gameDate: event.date,
            homeTeam: {
              id: homeTeam?.team?.id || '',
              name: homeTeam?.team?.displayName || 'TBD',
              abbreviation: homeTeam?.team?.abbreviation
            },
            awayTeam: {
              id: awayTeam?.team?.id || '',
              name: awayTeam?.team?.displayName || 'TBD',
              abbreviation: awayTeam?.team?.abbreviation
            },
            homeScore: homeTeam?.score,
            awayScore: awayTeam?.score,
            status: competition.status?.type?.description || 'Scheduled'
          });
        }
      }
      
      return games;
    } catch (error) {
      console.error('Error fetching NFL schedule:', error);
      return [];
    }
  }

  /**
   * Get game details
   */
  async getGame(gameId: string | number): Promise<BaseGame> {
    const url = `${this.siteBaseUrl}/summary?event=${gameId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const event = data.header;
      const competition = event.competitions?.[0];
      const homeComp = competition?.competitors?.[0];
      const awayComp = competition?.competitors?.[1];
      
      return {
        id: event.id,
        gameDate: competition?.date || '',
        homeTeam: {
          id: homeComp?.team?.id || '',
          name: homeComp?.team?.displayName || 'TBD',
          abbreviation: homeComp?.team?.abbreviation
        },
        awayTeam: {
          id: awayComp?.team?.id || '',
          name: awayComp?.team?.displayName || 'TBD',
          abbreviation: awayComp?.team?.abbreviation
        },
        homeScore: homeComp?.score,
        awayScore: awayComp?.score,
        status: competition?.status?.type?.description || 'Unknown'
      };
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get player info (alias for getPlayerStats)
   */
  async getPlayerInfo(playerId: string | number): Promise<BasePlayer> {
    const stats = await this.getPlayerStats(playerId);
    
    return {
      id: stats.playerId || playerId,
      fullName: 'Unknown Player', // Stats endpoint doesn't include name
      firstName: undefined,
      lastName: undefined
    };
  }

  /**
   * Get current NFL standings
   */
  async getStandings(season?: number, conference?: number): Promise<any> {
    let url = `${this.siteBaseUrl}/standings`;
    const params = [];
    
    if (season) params.push(`season=${season}`);
    if (conference) params.push(`group=${conference}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }

  /**
   * Get live scoreboard
   */
  async getScoreboard(date?: string, week?: number, seasonType?: number): Promise<any> {
    let url = `${this.siteBaseUrl}/scoreboard`;
    const params = [];
    
    if (date) params.push(`dates=${this.formatDate(date)}`);
    if (week) params.push(`week=${week}`);
    if (seasonType) params.push(`seasontype=${seasonType}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
      throw error;
    }
  }

  /**
   * Ensure player cache is loaded
   */
  private async ensurePlayerCache(): Promise<void> {
    // Check if cache is valid
    if (this.playerCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return;
    }
    
    // Load fresh cache
    await this.loadPlayerCache();
  }

  /**
   * Load all players from all team rosters into cache
   * This is called once every 24 hours
   */
  private async loadPlayerCache(): Promise<void> {
    console.error('Loading NFL player cache from all 32 team rosters...');
    const players: BasePlayer[] = [];
    this.playerNameMap.clear(); // Clear existing name map
    
    for (const teamId of NFL_TEAM_IDS) {
      try {
        const roster = await this.getTeamRoster(teamId);
        
        if (roster.athletes) {
          for (const positionGroup of roster.athletes) {
            if (positionGroup.items) {
              for (const athlete of positionGroup.items) {
                players.push({
                  id: athlete.id,
                  fullName: athlete.displayName,
                  firstName: athlete.firstName,
                  lastName: athlete.lastName
                });
                
                // Store player name in map for quick lookup
                this.playerNameMap.set(athlete.id.toString(), athlete.displayName);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error loading roster for team ${teamId}:`, error);
        // Continue with other teams
      }
    }
    
    this.playerCache = players;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    console.error(`Loaded ${players.length} NFL players into cache`);
  }

  /**
   * Format date string for ESPN API
   */
  private formatDate(date: string): string {
    // ESPN API expects YYYYMMDD format
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
