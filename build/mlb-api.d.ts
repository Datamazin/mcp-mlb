/**
 * MLB Stats API Client
 *
 * A client for interacting with the MLB Stats API to fetch team information,
 * player statistics, game schedules, live scores, and other baseball data.
 */
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
}
export declare class MLBAPIClient {
    private baseUrl;
    constructor(baseUrl: string);
    /**
     * Make a request to the MLB Stats API
     */
    private makeRequest;
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
     * Get player statistics
     */
    getPlayerStats(playerId: number, season?: number, gameType?: string): Promise<MLBPlayerStats>;
    /**
     * Get game schedule
     */
    getSchedule(params: MLBScheduleParams): Promise<any>;
    /**
     * Get live game data
     */
    getLiveGame(gamePk: number): Promise<any>;
    /**
     * Search for players by name
     */
    searchPlayers(name: string, activeStatus?: string): Promise<any>;
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
     */
    lookupPlayer(searchTerm: string, gameType?: string, season?: number, sportId?: number): Promise<any[]>;
    /**
     * Look up teams by name, city, abbreviation, etc.
     */
    lookupTeam(searchTerm: string, season?: number, sportId?: number): Promise<any[]>;
    /**
     * Get detailed boxscore for a game
     */
    getBoxscore(gamePk: number): Promise<any>;
    /**
     * Get game highlights
     */
    getGameHighlights(gamePk: number): Promise<any>;
    /**
     * Get league leaders for specified stat categories
     */
    getLeagueLeaders(leaderCategories: string, season?: number, leagueId?: number, limit?: number): Promise<any>;
}
//# sourceMappingURL=mlb-api.d.ts.map