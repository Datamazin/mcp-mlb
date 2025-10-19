/**
 * MLB Stats API Client
 *
 * A client for interacting with the MLB Stats API to fetch team information,
 * player statistics, game schedules, live scores, and other baseball data.
 *
 * Phase 1 Refactoring: Now extends BaseSportAPI for multi-sport architecture
 */
import { BaseSportAPI, SportAPIError } from './base-api.js';
// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;
/**
 * Custom error class for MLB API errors (extends SportAPIError)
 */
export class MLBAPIError extends SportAPIError {
    constructor(message, statusCode, endpoint) {
        super(message, statusCode, endpoint);
        this.name = 'MLBAPIError';
    }
}
/**
 * MLB API Client - extends BaseSportAPI
 *
 * Phase 1 Refactoring: Implements the common interface while maintaining
 * all MLB-specific functionality
 */
export class MLBAPIClient extends BaseSportAPI {
    constructor(baseUrl = 'https://statsapi.mlb.com/api/v1') {
        super(baseUrl);
    }
    /**
     * MLB-specific request method (override if needed for MLB-specific headers)
     * Inherits from BaseSportAPI.makeRequest() but can be customized
     */
    async makeRequest(endpoint, params = {}) {
        // Use parent's makeRequest, but wrap errors in MLBAPIError for backwards compatibility
        try {
            return await super.makeRequest(endpoint, params);
        }
        catch (error) {
            if (error instanceof SportAPIError) {
                throw new MLBAPIError(error.message, error.statusCode, error.endpoint);
            }
            throw error;
        }
    }
    /**
     * Get current MLB standings
     */
    async getStandings(params) {
        const queryParams = {
            standingsType: params.standingsType || 'regularSeason'
        };
        if (params.leagueId)
            queryParams.leagueId = params.leagueId;
        if (params.divisionId)
            queryParams.divisionId = params.divisionId;
        if (params.season)
            queryParams.season = params.season;
        if (params.gameType)
            queryParams.gameType = params.gameType;
        const data = await this.makeRequest('/standings', queryParams);
        const standings = [];
        data.records?.forEach((record) => {
            record.teamRecords?.forEach((teamRecord) => {
                standings.push({
                    team: teamRecord.team.name,
                    wins: teamRecord.wins,
                    losses: teamRecord.losses,
                    winningPercentage: teamRecord.winningPercentage,
                    gamesBack: teamRecord.gamesBack,
                    division: record.division?.name || 'Unknown',
                    league: record.league?.name || 'Unknown'
                });
            });
        });
        return standings;
    }
    /**
     * Get detailed team information
     */
    async getTeamInfo(teamId, hydrate) {
        const params = {};
        if (hydrate)
            params.hydrate = hydrate;
        const data = await this.makeRequest(`/teams/${teamId}`, params);
        if (!data.teams || data.teams.length === 0) {
            throw new Error(`Team with ID ${teamId} not found`);
        }
        const team = data.teams[0];
        return {
            id: team.id,
            name: team.name,
            teamName: team.teamName,
            locationName: team.locationName,
            abbreviation: team.abbreviation,
            league: team.league ? {
                id: team.league.id,
                name: team.league.name
            } : undefined,
            division: team.division ? {
                id: team.division.id,
                name: team.division.name
            } : undefined,
            venue: team.venue ? {
                id: team.venue.id,
                name: team.venue.name,
                city: team.venue.location?.city || '',
                state: team.venue.location?.state
            } : undefined
        };
    }
    /**
     * Get team roster for specified season (supports historical data)
     */
    async getTeamRoster(teamId, season) {
        const currentYear = new Date().getFullYear();
        const params = {};
        if (season && season !== currentYear) {
            params.season = season;
        }
        const data = await this.makeRequest(`/teams/${teamId}/roster`, params);
        if (!data.roster) {
            throw new Error(`No roster found for team ID ${teamId}${season ? ` in ${season}` : ''}`);
        }
        return data;
    }
    /**
     * Get player statistics with dynamic stat types
     * Constitutional Compliance: Dynamic API-First Development - supports various stat types
     * Available stat types: season, career, gameLog, advanced, seasonAdvanced, careerAdvanced,
     * byMonth, homeAndAway, statSplits, vsPlayer, lastXGames, etc.
     */
    async getPlayerStats(playerId, season, gameType = 'R', stats = 'season') {
        const currentYear = new Date().getFullYear();
        const params = {
            stats,
            season: season || currentYear,
            gameType
        };
        const data = await this.makeRequest(`/people/${playerId}/stats`, params);
        if (!data.stats || data.stats.length === 0) {
            throw new Error(`No stats found for player with ID ${playerId}`);
        }
        // Try to find any stats group (hitting, pitching, or fielding)
        const primaryStats = data.stats.find((stat) => stat.group && stat.group.displayName && stat.splits && stat.splits.length > 0);
        if (!primaryStats) {
            throw new Error(`No valid stats found for player with ID ${playerId}`);
        }
        const split = primaryStats.splits[0];
        const player = split.player;
        // Transform the API response to match the expected MCP schema
        const transformedStats = data.stats.map((stat) => ({
            type: {
                displayName: stat.type?.displayName || 'Unknown'
            },
            group: {
                displayName: stat.group?.displayName || 'Unknown'
            },
            stats: stat.splits && stat.splits.length > 0 ? stat.splits[0].stat : {}
        }));
        return {
            player: {
                id: player.id,
                fullName: player.fullName,
                primaryPosition: {
                    code: player.primaryPosition?.code || '',
                    name: player.primaryPosition?.name || '',
                    type: player.primaryPosition?.type || ''
                }
            },
            stats: transformedStats
        };
    }
    /**
     * Get game schedule
     */
    async getSchedule(params) {
        const queryParams = {
            startDate: params.startDate,
            endDate: params.endDate,
            hydrate: 'team,linescore,venue'
        };
        if (params.teamId)
            queryParams.teamId = params.teamId;
        if (params.gameType)
            queryParams.gameType = params.gameType;
        return this.makeRequest('/schedule', queryParams);
    }
    /**
     * Get postseason schedule using dedicated postseason endpoint
     */
    async getPostseasonSchedule(season, series) {
        const queryParams = {
            hydrate: 'team,linescore,venue,decisions,person'
        };
        if (season)
            queryParams.season = season;
        if (series)
            queryParams.series = series; // e.g., 'WS', 'ALCS', 'NLDS', 'WC'
        return this.makeRequest('/schedule/postseason', queryParams);
    }
    /**
     * Get live game data
     */
    async getLiveGame(gamePk) {
        const params = {
            hydrate: 'linescore,team'
        };
        const data = await this.makeRequest(`/game/${gamePk}/feed/live`, params);
        return {
            gamePk: data.gamePk,
            gameDate: data.gameData?.datetime?.dateTime,
            status: {
                abstractGameState: data.gameData?.status?.abstractGameState,
                detailedState: data.gameData?.status?.detailedState,
                inning: data.liveData?.linescore?.currentInning,
                inningState: data.liveData?.linescore?.inningState
            },
            teams: {
                away: {
                    team: {
                        id: data.gameData?.teams?.away?.id,
                        name: data.gameData?.teams?.away?.name
                    },
                    score: data.liveData?.linescore?.teams?.away?.runs || 0,
                    hits: data.liveData?.linescore?.teams?.away?.hits || 0,
                    errors: data.liveData?.linescore?.teams?.away?.errors || 0
                },
                home: {
                    team: {
                        id: data.gameData?.teams?.home?.id,
                        name: data.gameData?.teams?.home?.name
                    },
                    score: data.liveData?.linescore?.teams?.home?.runs || 0,
                    hits: data.liveData?.linescore?.teams?.home?.hits || 0,
                    errors: data.liveData?.linescore?.teams?.home?.errors || 0
                }
            },
            linescore: data.liveData?.linescore ? {
                innings: data.liveData.linescore.innings?.map((inning) => ({
                    num: inning.num,
                    away: { runs: inning.away?.runs },
                    home: { runs: inning.home?.runs }
                })) || []
            } : undefined
        };
    }
    /**
     * Search for MLB players by name
     * Uses MLB-StatsAPI reference architecture: sports_players endpoint with client-side filtering
     * Constitutional Compliance: Dynamic API-First Development using verified MLB-StatsAPI patterns
     *
     * Note: Renamed from searchPlayers to searchMLBPlayers to avoid conflict with BaseSportAPI
     */
    async searchMLBPlayers(name, activeStatus = 'Y') {
        const currentYear = new Date().getFullYear();
        const params = {
            sportId: 1,
            season: currentYear,
            fields: 'people,id,fullName,firstName,lastName,primaryNumber,currentTeam,id,primaryPosition,code,abbreviation,useName,boxscoreName,nickName,mlbDebutDate,nameFirstLast,firstLastName,lastFirstName,lastInitName,initLastName,fullFMLName,fullLFMName,nameSlug'
        };
        const data = await this.makeRequest('/sports/1/players', params);
        if (!data.people) {
            return { people: [] };
        }
        // Client-side filtering based on MLB-StatsAPI lookup_player implementation
        const searchTerms = name.toLowerCase().split(' ');
        const filteredPlayers = data.people.filter((player) => {
            // Check if all search terms match any player field values
            return searchTerms.every(term => {
                return Object.values(player).some(value => {
                    return value && value.toString().toLowerCase().includes(term);
                });
            });
        });
        return { people: filteredPlayers };
    }
    /**
     * Get all MLB teams
     */
    async getAllTeams() {
        const data = await this.makeRequest('/teams', {
            sportId: 1,
            hydrate: 'venue,league,division'
        });
        return data.teams?.map((team) => ({
            id: team.id,
            name: team.name,
            teamName: team.teamName,
            locationName: team.locationName,
            abbreviation: team.abbreviation,
            league: team.league ? {
                id: team.league.id,
                name: team.league.name
            } : undefined,
            division: team.division ? {
                id: team.division.id,
                name: team.division.name
            } : undefined,
            venue: team.venue ? {
                id: team.venue.id,
                name: team.venue.name,
                city: team.venue.location?.city || '',
                state: team.venue.location?.state
            } : undefined
        })) || [];
    }
    /**
     * Get player information by ID
     */
    async getPlayerInfo(playerId) {
        const data = await this.makeRequest(`/people/${playerId}`, {
            hydrate: 'currentTeam,stats'
        });
        if (!data.people || data.people.length === 0) {
            throw new Error(`Player with ID ${playerId} not found`);
        }
        return data.people[0];
    }
    /**
     * Get box score data for a specific game
     */
    async getBoxScore(gamePk) {
        const data = await this.makeRequest(`/game/${gamePk}/boxscore`, {});
        return data;
    }
    /**
     * Get player game logs for a season
     */
    async getPlayerGameLogs(playerId, season, gameType = 'R') {
        const currentYear = new Date().getFullYear();
        const params = {
            stats: 'gameLog',
            season: season || currentYear,
            gameType
        };
        const data = await this.makeRequest(`/people/${playerId}/stats`, params);
        if (!data.stats || data.stats.length === 0) {
            throw new Error(`No game logs found for player with ID ${playerId}`);
        }
        return data;
    }
    /**
     * Get enhanced schedule with game PKs for box score retrieval
     */
    async getScheduleWithGamePks(params) {
        const queryParams = {
            startDate: params.startDate,
            endDate: params.endDate,
            hydrate: 'team,linescore,venue,decisions'
        };
        if (params.teamId)
            queryParams.teamId = params.teamId;
        if (params.gameType)
            queryParams.gameType = params.gameType;
        const data = await this.makeRequest('/schedule', queryParams);
        // Extract game PKs and basic info
        const games = [];
        if (data.dates) {
            for (const date of data.dates) {
                for (const game of date.games || []) {
                    games.push({
                        gamePk: game.gamePk,
                        gameDate: game.gameDate,
                        status: game.status,
                        teams: game.teams,
                        venue: game.venue
                    });
                }
            }
        }
        return { games, totalGames: games.length };
    }
    /**
     * Look up players by name, position, team, etc.
     * Constitutional Compliance: Uses MLB-StatsAPI reference architecture patterns
     */
    async lookupPlayer(searchTerm, gameType = 'R', season, sportId = 1) {
        const currentYear = new Date().getFullYear();
        const useSeason = season || currentYear;
        const params = {
            sportId,
            season: useSeason,
            fields: 'people,id,fullName,firstName,lastName,primaryNumber,currentTeam,id,primaryPosition,code,abbreviation,useName,boxscoreName,nickName,mlbDebutDate,birthDate,birthCity,birthCountry,height,weight,active,nameFirstLast,firstLastName'
        };
        if (gameType !== 'R') {
            params.gameType = gameType;
        }
        const data = await this.makeRequest(`/sports/${sportId}/players`, params);
        if (!data.people || data.people.length === 0) {
            return [];
        }
        // Client-side filtering using MLB-StatsAPI lookup_player logic
        const searchTerms = searchTerm.toLowerCase().split(' ');
        const matchedPlayers = data.people.filter((player) => {
            return searchTerms.every(term => {
                return Object.values(player).some(value => {
                    return value && value.toString().toLowerCase().includes(term);
                });
            });
        });
        if (matchedPlayers.length === 0) {
            throw new Error(`No players found matching "${searchTerm}"`);
        }
        return data.people.map((player) => ({
            id: player.id,
            fullName: player.fullName,
            firstName: player.firstName,
            lastName: player.lastName,
            primaryNumber: player.primaryNumber,
            primaryPosition: player.primaryPosition,
            currentTeam: player.currentTeam,
            mlbDebutDate: player.mlbDebutDate,
            birthDate: player.birthDate,
            birthCity: player.birthCity,
            birthCountry: player.birthCountry,
            height: player.height,
            weight: player.weight,
            active: player.active
        }));
    }
    /**
     * Look up teams by name, city, abbreviation, etc.
     */
    async lookupTeam(searchTerm, season, sportId = 1) {
        const params = {
            sportId
        };
        if (season) {
            params.season = season;
        }
        const data = await this.makeRequest('/teams', params);
        if (!data.teams || data.teams.length === 0) {
            throw new Error('No teams data available');
        }
        // Filter teams by search term (name, city, abbreviation)
        const searchLower = searchTerm.toLowerCase();
        const matchingTeams = data.teams.filter((team) => team.name.toLowerCase().includes(searchLower) ||
            team.locationName.toLowerCase().includes(searchLower) ||
            team.abbreviation.toLowerCase().includes(searchLower) ||
            team.teamName.toLowerCase().includes(searchLower) ||
            team.shortName?.toLowerCase().includes(searchLower));
        if (matchingTeams.length === 0) {
            throw new Error(`No teams found matching "${searchTerm}"`);
        }
        return matchingTeams.map((team) => ({
            id: team.id,
            name: team.name,
            teamName: team.teamName,
            locationName: team.locationName,
            abbreviation: team.abbreviation,
            shortName: team.shortName,
            league: team.league,
            division: team.division,
            venue: team.venue,
            active: team.active
        }));
    }
    /**
     * Get detailed boxscore for a game with enhanced batting stats
     */
    async getBoxscore(gamePk, timecode) {
        const params = {};
        if (timecode)
            params.timecode = timecode;
        const data = await this.makeRequest(`/game/${gamePk}/boxscore`, params);
        if (!data.teams) {
            throw new Error(`No boxscore data found for game ${gamePk}`);
        }
        // Enhanced processing for better batting stats structure
        const processTeamBoxscore = (teamData) => {
            const players = [];
            // Process all players
            if (teamData.players) {
                for (const playerId in teamData.players) {
                    const player = teamData.players[playerId];
                    if (player.person) {
                        players.push({
                            id: player.person.id,
                            fullName: player.person.fullName,
                            position: player.position?.name || player.position?.abbreviation,
                            jerseyNumber: player.jerseyNumber,
                            battingStats: player.stats?.batting || {},
                            pitchingStats: player.stats?.pitching || {},
                            fieldingStats: player.stats?.fielding || {},
                            gameStatus: player.gameStatus?.isCurrentBatter ? 'Current Batter' :
                                player.gameStatus?.isCurrentPitcher ? 'Current Pitcher' : 'Active'
                        });
                    }
                }
            }
            return {
                team: teamData.team,
                teamStats: {
                    batting: teamData.teamStats?.batting || {},
                    pitching: teamData.teamStats?.pitching || {},
                    fielding: teamData.teamStats?.fielding || {}
                },
                players: players,
                batters: teamData.batters || [],
                pitchers: teamData.pitchers || [],
                bench: teamData.bench || [],
                bullpen: teamData.bullpen || []
            };
        };
        return {
            gamePk,
            gameInfo: {
                attendance: data.info?.find((info) => info.label === 'Attendance')?.value,
                weather: data.info?.find((info) => info.label === 'Weather')?.value,
                wind: data.info?.find((info) => info.label === 'Wind')?.value,
                firstPitch: data.info?.find((info) => info.label === 'First pitch')?.value,
                timeOfGame: data.info?.find((info) => info.label === 'T')?.value
            },
            teams: {
                away: processTeamBoxscore(data.teams.away),
                home: processTeamBoxscore(data.teams.home)
            },
            officials: data.officials || [],
            info: data.info || [],
            pitchingNotes: data.pitchingNotes || []
        };
    }
    /**
     * Get game highlights
     */
    async getGameHighlights(gamePk) {
        const data = await this.makeRequest(`/game/${gamePk}/content`);
        if (!data.highlights) {
            throw new Error(`No highlights found for game ${gamePk}`);
        }
        return {
            gamePk,
            highlights: data.highlights.highlights?.items || [],
            recap: data.editorial?.recap || null
        };
    }
    /**
     * Get league leaders for specified stat categories
     */
    async getLeagueLeaders(leaderCategories, season, leagueId, limit = 10) {
        const currentYear = new Date().getFullYear();
        const params = {
            leaderCategories,
            season: season || currentYear,
            limit
        };
        if (leagueId) {
            params.leagueId = leagueId;
        }
        const data = await this.makeRequest('/stats/leaders', params);
        if (!data.leagueLeaders || data.leagueLeaders.length === 0) {
            throw new Error(`No league leaders found for ${leaderCategories}`);
        }
        return {
            season: params.season,
            categories: data.leagueLeaders.map((category) => ({
                leaderCategory: category.leaderCategory,
                leaders: category.leaders.map((leader) => ({
                    rank: leader.rank,
                    value: leader.value,
                    person: {
                        id: leader.person.id,
                        fullName: leader.person.fullName
                    },
                    team: leader.team ? {
                        id: leader.team.id,
                        name: leader.team.name
                    } : null
                }))
            }))
        };
    }
    /**
     * Get MLB jobs information
     * jobType examples: 'umpire', 'manager', 'coach', 'trainer', etc.
     */
    async getJobs(jobType, sportId = 1, date) {
        const params = {
            jobType: jobType
        };
        if (sportId)
            params.sportId = sportId;
        if (date)
            params.date = date; // Format: YYYY-MM-DD
        const data = await this.makeRequest('/jobs', params);
        return {
            jobType: jobType,
            totalJobs: data.totalItems || 0,
            jobs: data.jobs?.map((job) => ({
                id: job.id,
                title: job.title,
                jobType: job.jobType,
                person: job.person ? {
                    id: job.person.id,
                    fullName: job.person.fullName,
                    firstName: job.person.firstName,
                    lastName: job.person.lastName
                } : null,
                team: job.team ? {
                    id: job.team.id,
                    name: job.team.name,
                    abbreviation: job.team.abbreviation
                } : null,
                startDate: job.startDate,
                endDate: job.endDate,
                isActive: job.isActive
            })) || []
        };
    }
    /**
     * Get MLB metadata for various types
     * Available types: awards, baseballStats, eventTypes, gameStatus, gameTypes,
     * hitTrajectories, jobTypes, languages, leagueLeaderTypes, logicalEvents, metrics,
     * pitchCodes, pitchTypes, platforms, positions, reviewReasons, rosterTypes,
     * scheduleEventTypes, situationCodes, sky, standingsTypes, statGroups, statTypes, windDirection
     */
    async getMeta(type, ver = 'v1') {
        const endpoint = `/${ver}/${type}`;
        const data = await this.makeRequest(endpoint);
        return {
            type: type,
            version: ver,
            totalItems: data.length || 0,
            data: data || []
        };
    }
    // ========================================
    // BASE SPORT API INTERFACE IMPLEMENTATIONS
    // Phase 1 Refactoring: Implement abstract methods from BaseSportAPI
    // ========================================
    /**
     * Search for players by name (implements BaseSportAPI)
     * Wraps the MLB-specific searchMLBPlayers method
     */
    async searchPlayers(name, options) {
        const results = await this.searchMLBPlayers(name, options?.activeStatus || 'Y');
        return results.people?.map((player) => ({
            id: player.id,
            fullName: player.fullName,
            firstName: player.firstName,
            lastName: player.lastName
        })) || [];
    }
    /**
     * Get all teams (implements BaseSportAPI)
     * Wraps the existing getAllTeams method
     */
    async getTeams(options) {
        const teams = await this.getAllTeams();
        return teams.map(team => ({
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            city: team.locationName
        }));
    }
    /**
     * Get live game data (implements BaseSportAPI)
     * Wraps the existing getLiveGame method
     */
    async getGame(gameId) {
        const gamePk = typeof gameId === 'string' ? parseInt(gameId) : gameId;
        const game = await this.getLiveGame(gamePk);
        return {
            id: game.gamePk,
            gameDate: game.gameDate,
            homeTeam: {
                id: game.teams.home.team.id,
                name: game.teams.home.team.name,
                abbreviation: ''
            },
            awayTeam: {
                id: game.teams.away.team.id,
                name: game.teams.away.team.name,
                abbreviation: ''
            },
            status: game.status.detailedState,
            homeScore: game.teams.home.score,
            awayScore: game.teams.away.score
        };
    }
}
//# sourceMappingURL=mlb-api.js.map