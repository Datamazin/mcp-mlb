/**
 * NFL API Client using ESPN NFL API with Pro Football Reference fallback
 *
 * Base URLs:
 * - Site API: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 * - Core API: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl
 * - Web API: https://site.web.api.espn.com/apis/common/v3/sports/football/nfl
 * - Pro Football Reference: https://www.pro-football-reference.com
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
    private pfrScraper;
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
     * Search for NFL players by name using ESPN's athlete lookup APIs
     * This includes both current and historical players
     * Falls back to hardcoded historical players if APIs fail
     */
    searchPlayersGlobal(query: string): Promise<BasePlayer[]>;
    /**
     * Get historical NFL players that match the search query
     * This is a fallback for when ESPN APIs don't include retired legends
     */
    private getHistoricalPlayerMatch;
    /**
     * Get career statistics for historical NFL players
     * Returns hardcoded career totals for NFL legends
     */
    private getHistoricalPlayerStats;
    /**
     * Search for NFL players by name
     * First tries global search (includes historical players), then falls back to roster cache
     */
    searchPlayers(query: string, activeStatus?: string): Promise<BasePlayer[]>;
    /**
     * Get detailed player statistics
     * Uses the Core API statistics endpoint for comprehensive stats
     * Supports filtering by stat category (passing, rushing, receiving, defensive, etc.)
     * For historical players, returns career totals
     */
    getPlayerStats(playerId: string | number, options?: {
        season?: number;
        statCategory?: string;
    }): Promise<any>;
    /**
     * Get player stats from Pro Football Reference
     */
    private getPFRPlayerStats;
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
     * Get comprehensive player overview with biographical and career context
     * Uses ESPN's athlete API for rich player information
     */
    getPlayerOverview(playerId: string | number): Promise<import('./base-api.js').BasePlayerOverview | null>;
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
     * Get player overview from Pro Football Reference
     */
    private getPFRPlayerOverview;
    /**
     * Format date string for ESPN API
     */
    private formatDate;
}
//# sourceMappingURL=nfl-api.d.ts.map