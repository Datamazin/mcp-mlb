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
    week?: number;
    seasonType?: number;
}
export declare class NFLAPIClient extends BaseSportAPI {
    private siteBaseUrl;
    private coreBaseUrl;
    private playerCache;
    private playerNameMap;
    private cacheExpiry;
    private readonly CACHE_DURATION;
    constructor();
    /**
     * Get the current NFL season year
     * NFL season spans two calendar years (e.g., 2024 season runs Sep 2024 - Feb 2025)
     * Returns the year the season started in
     *
     * Note: For future seasons where data may not be available yet, this returns the
     * most likely season. API calls should handle 404s gracefully and fall back to
     * the previous season if needed.
     */
    private getCurrentNFLSeason;
    /**
     * Search for NFL players by name
     * Loads all team rosters and caches them for 24h
     */
    searchPlayers(query: string, activeStatus?: string): Promise<BasePlayer[]>;
    /**
     * Get detailed player statistics
     * Uses the Core API statistics endpoint for comprehensive stats
     * Supports filtering by stat category (passing, rushing, receiving, defensive, etc.)
     */
    getPlayerStats(playerId: string | number, options?: {
        season?: number;
        statCategory?: string;
    }): Promise<any>;
    /**
     * Get player game log
     */
    getPlayerGamelog(playerId: string | number, season?: number): Promise<any>;
    /**
     * Get all NFL teams
     */
    getTeams(): Promise<BaseTeam[]>;
    /**
     * Get team information
     */
    getTeamInfo(teamId: string | number): Promise<BaseTeam>;
    /**
     * Get team roster
     */
    getTeamRoster(teamId: string | number): Promise<any>;
    /**
     * Get NFL schedule/scoreboard
     */
    getSchedule(params: NFLScheduleParams): Promise<BaseGame[]>;
    /**
     * Get game details
     */
    getGame(gameId: string | number): Promise<BaseGame>;
    /**
     * Get player info (alias for getPlayerStats)
     */
    getPlayerInfo(playerId: string | number): Promise<BasePlayer>;
    /**
     * Get current NFL standings
     */
    getStandings(season?: number, conference?: number): Promise<any>;
    /**
     * Get live scoreboard
     */
    getScoreboard(date?: string, week?: number, seasonType?: number): Promise<any>;
    /**
     * Ensure player cache is loaded
     */
    private ensurePlayerCache;
    /**
     * Load all players from all team rosters into cache
     * This is called once every 24 hours
     */
    private loadPlayerCache;
    /**
     * Format date string for ESPN API
     */
    private formatDate;
}
//# sourceMappingURL=nfl-api.d.ts.map