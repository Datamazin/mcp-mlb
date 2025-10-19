/**
 * Base Sport API Client
 *
 * Abstract base class that defines the common interface for all sport API clients.
 * This provides a consistent structure across MLB, NBA, and NFL implementations.
 *
 * Phase 1: Refactoring - Extract common patterns from MLB code
 */
/**
 * Custom error class for Sport API errors
 */
export declare class SportAPIError extends Error {
    statusCode?: number | undefined;
    endpoint?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, endpoint?: string | undefined);
}
/**
 * Generic player interface - all sports must implement this
 */
export interface BasePlayer {
    id: number | string;
    fullName: string;
    firstName?: string;
    lastName?: string;
}
/**
 * Generic team interface - all sports must implement this
 */
export interface BaseTeam {
    id: number | string;
    name: string;
    abbreviation?: string;
    city?: string;
}
/**
 * Generic game interface - all sports must implement this
 */
export interface BaseGame {
    id: string | number;
    gameDate: string;
    homeTeam: BaseTeam;
    awayTeam: BaseTeam;
    status: string;
    homeScore?: number;
    awayScore?: number;
}
/**
 * Generic schedule parameters
 */
export interface BaseScheduleParams {
    startDate: string;
    endDate: string;
    teamId?: number | string;
}
/**
 * Abstract Base Sport API Client
 *
 * All sport-specific clients (MLB, NBA, NFL) must extend this class
 * and implement the required abstract methods.
 */
export declare abstract class BaseSportAPI {
    protected baseUrl: string;
    constructor(baseUrl: string);
    /**
     * Make a generic HTTP request with error handling
     * Protected method that can be overridden by subclasses for sport-specific headers/logic
     */
    protected makeRequest(endpoint: string, params?: Record<string, any>): Promise<any>;
    /**
     * Search for players by name
     * Must be implemented by each sport
     */
    abstract searchPlayers(name: string, options?: any): Promise<BasePlayer[]>;
    /**
     * Get player statistics
     * Must be implemented by each sport
     */
    abstract getPlayerStats(playerId: number | string, options?: any): Promise<any>;
    /**
     * Get all teams
     * Must be implemented by each sport
     */
    abstract getTeams(options?: any): Promise<BaseTeam[]>;
    /**
     * Get team information by ID
     * Must be implemented by each sport
     */
    abstract getTeamInfo(teamId: number | string, options?: any): Promise<BaseTeam>;
    /**
     * Get game schedule
     * Must be implemented by each sport
     */
    abstract getSchedule(params: BaseScheduleParams): Promise<any>;
    /**
     * Get live game data
     * Must be implemented by each sport
     */
    abstract getGame(gameId: string | number): Promise<BaseGame>;
    /**
     * Get player information by ID
     * Must be implemented by each sport
     */
    abstract getPlayerInfo(playerId: number | string): Promise<any>;
}
/**
 * Sport League Enum
 * Used by the factory to determine which API client to instantiate
 */
export declare enum SportLeague {
    MLB = "MLB",
    NBA = "NBA",
    NFL = "NFL"
}
//# sourceMappingURL=base-api.d.ts.map