/**
 * MLB Stats API Client
 *
 * A client for interacting with the MLB Stats API to fetch team information,
 * player statistics, game schedules, live scores, and other baseball data.
 *
 * Phase 1 Refactoring: Now extends BaseSportAPI for multi-sport architecture
 */
import { BaseSportAPI, SportAPIError, BasePlayer, BaseTeam, BaseGame } from './base-api.js';
/**
 * Custom error class for MLB API errors (extends SportAPIError)
 */
export declare class MLBAPIError extends SportAPIError {
    constructor(message: string, statusCode?: number, endpoint?: string);
}
export interface MLBTeam {
    [x: string]: unknown;
    id: number;
    name: string;
    teamName: string;
    locationName: string;
    abbreviation: string;
    league?: {
        id: number;
        name: string;
    };
    division?: {
        id: number;
        name: string;
    };
    venue?: {
        id: number;
        name: string;
        city: string;
        state?: string;
    };
}
export interface MLBStandings {
    team: string;
    wins: number;
    losses: number;
    winningPercentage: string;
    gamesBack: string;
    division: string;
    league: string;
}
export interface MLBPlayerStats {
    [x: string]: unknown;
    player: {
        id: number;
        fullName: string;
        primaryPosition: {
            code: string;
            name: string;
            type: string;
        };
    };
    stats: Array<{
        type: {
            displayName: string;
        };
        group: {
            displayName: string;
        };
        stats: Record<string, any>;
    }>;
}
export interface MLBScheduleParams {
    startDate: string;
    endDate: string;
    teamId?: number;
    gameType?: string;
}
export interface MLBStandingsParams {
    leagueId?: number;
    divisionId?: number;
    standingsType?: string;
    season?: number;
    gameType?: string;
}
export interface MLBMetaParams {
    type: string;
    ver?: string;
}
/**
 * MLB API Client - extends BaseSportAPI
 *
 * Phase 1 Refactoring: Implements the common interface while maintaining
 * all MLB-specific functionality
 */
export declare class MLBAPIClient extends BaseSportAPI {
    constructor(baseUrl?: string);
    /**
     * MLB-specific request method (override if needed for MLB-specific headers)
     * Inherits from BaseSportAPI.makeRequest() but can be customized
     */
    protected makeRequest(endpoint: string, params?: Record<string, any>): Promise<any>;
    /**
     * Get current MLB standings
     */
    getStandings(params: MLBStandingsParams): Promise<MLBStandings[]>;
    /**
     * Get detailed team information
     */
    getTeamInfo(teamId: number, hydrate?: string): Promise<MLBTeam>;
    /**
     * Get team roster for specified season (supports historical data)
     */
    getTeamRoster(teamId: number, season?: number): Promise<any>;
    /**
     * Get player statistics with dynamic stat types
     * Constitutional Compliance: Dynamic API-First Development - supports various stat types
     * Available stat types: season, career, gameLog, advanced, seasonAdvanced, careerAdvanced,
     * byMonth, homeAndAway, statSplits, vsPlayer, lastXGames, etc.
     */
    getPlayerStats(playerId: number, season?: number, gameType?: string, stats?: string): Promise<MLBPlayerStats>;
    /**
     * Get game schedule
     */
    getSchedule(params: MLBScheduleParams): Promise<any>;
    /**
     * Get postseason schedule using dedicated postseason endpoint
     */
    getPostseasonSchedule(season?: number, series?: string): Promise<any>;
    /**
     * Get live game data
     */
    getLiveGame(gamePk: number): Promise<any>;
    /**
     * Search for MLB players by name
     * Uses MLB-StatsAPI reference architecture: sports_players endpoint with client-side filtering
     * Constitutional Compliance: Dynamic API-First Development using verified MLB-StatsAPI patterns
     *
     * Note: Renamed from searchPlayers to searchMLBPlayers to avoid conflict with BaseSportAPI
     */
    searchMLBPlayers(name: string, activeStatus?: string): Promise<any>;
    /**
     * Get all MLB teams
     */
    getAllTeams(): Promise<MLBTeam[]>;
    /**
     * Get player information by ID
     */
    getPlayerInfo(playerId: number): Promise<any>;
    /**
     * Get box score data for a specific game
     */
    getBoxScore(gamePk: number): Promise<any>;
    /**
     * Get player game logs for a season
     */
    getPlayerGameLogs(playerId: number, season?: number, gameType?: string): Promise<any>;
    /**
     * Get enhanced schedule with game PKs for box score retrieval
     */
    getScheduleWithGamePks(params: MLBScheduleParams): Promise<any>;
    /**
     * Look up players by name, position, team, etc.
     * Constitutional Compliance: Uses MLB-StatsAPI reference architecture patterns
     */
    lookupPlayer(searchTerm: string, gameType?: string, season?: number, sportId?: number): Promise<any[]>;
    /**
     * Look up teams by name, city, abbreviation, etc.
     */
    lookupTeam(searchTerm: string, season?: number, sportId?: number): Promise<any[]>;
    /**
     * Get detailed boxscore for a game with enhanced batting stats
     */
    getBoxscore(gamePk: number, timecode?: string): Promise<any>;
    /**
     * Get game highlights
     */
    getGameHighlights(gamePk: number): Promise<any>;
    /**
     * Get league leaders for specified stat categories
     */
    getLeagueLeaders(leaderCategories: string, season?: number, leagueId?: number, limit?: number): Promise<any>;
    /**
     * Get MLB jobs information
     * jobType examples: 'umpire', 'manager', 'coach', 'trainer', etc.
     */
    getJobs(jobType: string, sportId?: number, date?: string): Promise<any>;
    /**
     * Get MLB metadata for various types
     * Available types: awards, baseballStats, eventTypes, gameStatus, gameTypes,
     * hitTrajectories, jobTypes, languages, leagueLeaderTypes, logicalEvents, metrics,
     * pitchCodes, pitchTypes, platforms, positions, reviewReasons, rosterTypes,
     * scheduleEventTypes, situationCodes, sky, standingsTypes, statGroups, statTypes, windDirection
     */
    getMeta(type: string, ver?: string): Promise<any>;
    /**
     * Search for players by name (implements BaseSportAPI)
     * Wraps the MLB-specific searchMLBPlayers method
     */
    searchPlayers(name: string, options?: any): Promise<BasePlayer[]>;
    /**
     * Get all teams (implements BaseSportAPI)
     * Wraps the existing getAllTeams method
     */
    getTeams(options?: any): Promise<BaseTeam[]>;
    /**
     * Get live game data (implements BaseSportAPI)
     * Wraps the existing getLiveGame method
     */
    getGame(gameId: string | number): Promise<BaseGame>;
}
//# sourceMappingURL=mlb-api.d.ts.map