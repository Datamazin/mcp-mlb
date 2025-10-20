/**
 * NBA Stats API Client
 *
 * A client for interacting with the NBA.com Stats API to fetch player information,
 * statistics, game schedules, live scores, and other basketball data.
 *
 * Phase 2: NBA Implementation - Extends BaseSportAPI for multi-sport architecture
 * Based on: https://github.com/swar/nba_api
 */
import { BaseSportAPI, SportAPIError, BasePlayer, BaseTeam, BaseGame, BaseScheduleParams } from './base-api.js';
/**
 * Custom error class for NBA API errors (extends SportAPIError)
 */
export declare class NBAAPIError extends SportAPIError {
    constructor(message: string, statusCode?: number, endpoint?: string);
}
export interface NBAPlayer extends BasePlayer {
    isActive: boolean;
    fromYear: number;
    toYear: number;
    position?: string;
    jerseyNumber?: string;
}
export interface NBATeam extends BaseTeam {
    state?: string;
    yearFounded?: number;
}
export interface NBAGame extends BaseGame {
    period?: number;
    gameClock?: string;
    attendance?: number;
}
export interface NBAPlayerStats {
    playerId: string;
    fullName?: string;
    season: string;
    gp: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fgm: number;
    fga: number;
    fg_pct: number;
    fg3m: number;
    fg3a: number;
    fg3_pct: number;
    ftm: number;
    fta: number;
    ft_pct: number;
    oreb: number;
    dreb: number;
    tov: number;
    pf: number;
}
/**
 * NBA API Client
 */
export declare class NBAAPIClient extends BaseSportAPI {
    private readonly nbaBaseURL;
    private readonly headers;
    private playerCache;
    private cacheExpiry;
    private readonly CACHE_DURATION;
    constructor();
    private makeNBARequest;
    private parseResultSet;
    private getCurrentSeason;
    private loadPlayerCache;
    searchPlayers(query: string): Promise<BasePlayer[]>;
    getPlayerStats(playerId: string | number): Promise<NBAPlayerStats>;
    getTeams(): Promise<BaseTeam[]>;
    getTeamInfo(teamId: string | number): Promise<BaseTeam>;
    getSchedule(params: BaseScheduleParams): Promise<BaseGame[]>;
    getGame(gameId: string | number): Promise<BaseGame>;
    getPlayerInfo(playerId: string | number): Promise<BasePlayer>;
    /**
     * Get comprehensive player overview with biographical and career context
     * Uses ESPN's athlete API for rich player information
     */
    getPlayerOverview(playerId: string | number): Promise<import('./base-api.js').BasePlayerOverview | null>;
}
export declare const nbaApi: NBAAPIClient;
//# sourceMappingURL=nba-api.d.ts.map