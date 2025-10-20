/**
 * NBA Stats API Client
 *
 * A client for interacting with the NBA.com Stats API to fetch player information,
 * statistics, game schedules, live scores, and other basketball data.
 *
 * Phase 2: NBA Implementation - Extends BaseSportAPI for multi-sport architecture
 * Based on: https://github.com/swar/nba_api
 */
import { BaseSportAPI, SportAPIError } from './base-api.js';
// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;
/**
 * Custom error class for NBA API errors (extends SportAPIError)
 */
export class NBAAPIError extends SportAPIError {
    constructor(message, statusCode, endpoint) {
        super(message, statusCode, endpoint);
        this.name = 'NBAAPIError';
    }
}
/**
 * NBA API Client
 */
export class NBAAPIClient extends BaseSportAPI {
    nbaBaseURL = 'https://stats.nba.com/stats';
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com',
    };
    playerCache = null;
    cacheExpiry = null;
    CACHE_DURATION = 24 * 60 * 60 * 1000;
    constructor() {
        super('https://stats.nba.com/stats');
    }
    async makeNBARequest(endpoint, params = {}) {
        try {
            const url = new URL(`${this.nbaBaseURL}/${endpoint}`);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
            const response = await fetch(url.toString(), { headers: this.headers });
            if (!response.ok) {
                throw new NBAAPIError(`NBA API request failed: ${response.statusText}`, response.status, endpoint);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof NBAAPIError)
                throw error;
            throw new NBAAPIError(`Failed to fetch from NBA API: ${endpoint}`);
        }
    }
    parseResultSet(resultSet) {
        const { headers, rowSet } = resultSet;
        return rowSet.map(row => {
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header.toLowerCase()] = row[idx];
            });
            return obj;
        });
    }
    getCurrentSeason() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        return month >= 10 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`;
    }
    async loadPlayerCache() {
        if (this.playerCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            return this.playerCache;
        }
        try {
            const response = await this.makeNBARequest('commonallplayers', {
                LeagueID: '00',
                Season: this.getCurrentSeason(),
                IsOnlyCurrentSeason: '0',
            });
            const playerData = this.parseResultSet(response.resultSets[0]);
            this.playerCache = playerData.map((p) => ({
                id: String(p.person_id),
                fullName: p.display_first_last || '',
                firstName: p.first_name || '',
                lastName: p.last_name || '',
                isActive: p.rosterstatus === 1,
                fromYear: p.from_year || 0,
                toYear: p.to_year || 0,
            }));
            this.cacheExpiry = Date.now() + this.CACHE_DURATION;
            return this.playerCache;
        }
        catch (error) {
            throw new NBAAPIError('Failed to load NBA player cache');
        }
    }
    async searchPlayers(query) {
        const players = await this.loadPlayerCache();
        const lowerQuery = query.toLowerCase();
        const matches = players.filter(p => p.fullName.toLowerCase().includes(lowerQuery) ||
            (p.firstName && p.firstName.toLowerCase().includes(lowerQuery)) ||
            (p.lastName && p.lastName.toLowerCase().includes(lowerQuery)));
        return matches.sort((a, b) => {
            if (a.isActive && !b.isActive)
                return -1;
            if (!a.isActive && b.isActive)
                return 1;
            return a.fullName.localeCompare(b.fullName);
        });
    }
    async getPlayerStats(playerId) {
        try {
            const response = await this.makeNBARequest('playercareerstats', {
                PlayerID: playerId,
                PerMode: 'Totals',
            });
            const careerTotals = this.parseResultSet(response.resultSets[0]);
            const totals = careerTotals[careerTotals.length - 1];
            // Get player name from cache
            const players = await this.loadPlayerCache();
            const player = players.find(p => p.id === String(playerId));
            const playerName = player ? player.fullName : `Player ${playerId}`;
            return {
                playerId: String(playerId),
                fullName: playerName,
                season: 'Career',
                gp: totals.gp || 0,
                pts: totals.pts || 0,
                reb: totals.reb || 0,
                ast: totals.ast || 0,
                stl: totals.stl || 0,
                blk: totals.blk || 0,
                fgm: totals.fgm || 0,
                fga: totals.fga || 0,
                fg_pct: totals.fg_pct || 0,
                fg3m: totals.fg3m || 0,
                fg3a: totals.fg3a || 0,
                fg3_pct: totals.fg3_pct || 0,
                ftm: totals.ftm || 0,
                fta: totals.fta || 0,
                ft_pct: totals.ft_pct || 0,
                oreb: totals.oreb || 0,
                dreb: totals.dreb || 0,
                tov: totals.tov || 0,
                pf: totals.pf || 0,
            };
        }
        catch (error) {
            throw new NBAAPIError(`Failed to get stats for player ${playerId}`);
        }
    }
    async getTeams() {
        try {
            const response = await this.makeNBARequest('commonteamyears', {
                LeagueID: '00',
            });
            const teamData = this.parseResultSet(response.resultSets[0]);
            const currentTeams = teamData.filter((t) => t.max_year === String(new Date().getFullYear()));
            return currentTeams.map((t) => ({
                id: String(t.team_id),
                name: t.abbreviation,
                abbreviation: t.abbreviation,
                city: '',
            }));
        }
        catch (error) {
            throw new NBAAPIError('Failed to get NBA teams');
        }
    }
    async getTeamInfo(teamId) {
        try {
            const response = await this.makeNBARequest('teaminfocommon', {
                TeamID: teamId,
                Season: this.getCurrentSeason(),
            });
            const teamData = this.parseResultSet(response.resultSets[0]);
            if (teamData.length === 0) {
                throw new NBAAPIError(`Team ${teamId} not found`);
            }
            const team = teamData[0];
            return {
                id: String(team.team_id),
                name: team.team_name,
                abbreviation: team.team_abbreviation,
                city: team.team_city,
            };
        }
        catch (error) {
            throw new NBAAPIError(`Failed to get team info for ${teamId}`);
        }
    }
    async getSchedule(params) {
        try {
            const response = await this.makeNBARequest('scoreboardv2', {
                GameDate: params.startDate,
                LeagueID: '00',
                DayOffset: 0,
            });
            const gameData = this.parseResultSet(response.resultSets[0]);
            return gameData.map((g) => ({
                id: String(g.game_id),
                gameDate: g.game_date_est,
                homeTeam: {
                    id: String(g.home_team_id),
                    name: '',
                },
                awayTeam: {
                    id: String(g.visitor_team_id),
                    name: '',
                },
                status: g.game_status_text,
                homeScore: g.home_team_score,
                awayScore: g.visitor_team_score,
            }));
        }
        catch (error) {
            throw new NBAAPIError('Failed to get NBA schedule');
        }
    }
    async getGame(gameId) {
        try {
            const response = await this.makeNBARequest('boxscoresummaryv2', {
                GameID: gameId,
            });
            const gameData = this.parseResultSet(response.resultSets[0]);
            if (gameData.length === 0) {
                throw new NBAAPIError(`Game ${gameId} not found`);
            }
            const game = gameData[0];
            return {
                id: String(gameId),
                gameDate: game.game_date_est,
                homeTeam: {
                    id: String(game.home_team_id),
                    name: '',
                },
                awayTeam: {
                    id: String(game.visitor_team_id),
                    name: '',
                },
                status: game.game_status_text,
                homeScore: game.home_team_score,
                awayScore: game.visitor_team_score,
            };
        }
        catch (error) {
            throw new NBAAPIError(`Failed to get game ${gameId}`);
        }
    }
    async getPlayerInfo(playerId) {
        try {
            const response = await this.makeNBARequest('commonplayerinfo', {
                PlayerID: playerId,
            });
            const playerData = this.parseResultSet(response.resultSets[0]);
            if (playerData.length === 0) {
                throw new NBAAPIError(`Player ${playerId} not found`);
            }
            const player = playerData[0];
            return {
                id: String(playerId),
                fullName: player.display_first_last,
                firstName: player.first_name,
                lastName: player.last_name,
            };
        }
        catch (error) {
            throw new NBAAPIError(`Failed to get player info for ${playerId}`);
        }
    }
    /**
     * Get comprehensive player overview with biographical and career context
     * Uses ESPN's athlete API for rich player information
     */
    async getPlayerOverview(playerId) {
        try {
            const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch NBA player overview for ${playerId}: ${response.status}`);
                return null;
            }
            const data = await response.json();
            const athlete = data.athlete;
            if (!athlete) {
                return null;
            }
            // Parse ESPN athlete data into BasePlayerOverview format
            const overview = {
                id: playerId,
                fullName: athlete.fullName || athlete.displayName || 'Unknown',
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                displayName: athlete.displayName,
                shortName: athlete.displayName,
                weight: athlete.displayWeight,
                height: athlete.displayHeight,
                age: athlete.age,
                birthDate: athlete.displayDOB,
                birthPlace: athlete.displayBirthPlace,
                college: athlete.college?.name,
                position: athlete.position?.displayName || athlete.position?.name,
                jerseyNumber: athlete.displayJersey?.replace('#', ''),
                team: athlete.team ? {
                    id: athlete.team.id,
                    name: athlete.team.name,
                    abbreviation: athlete.team.abbreviation,
                    displayName: athlete.team.displayName
                } : undefined,
                experience: athlete.displayExperience,
                status: athlete.status?.name,
                headshot: athlete.headshot?.href,
                careerSummary: {
                    seasons: athlete.displayExperience,
                    highlights: [],
                    awards: []
                },
                draftInfo: athlete.displayDraft ? {
                    year: parseInt(athlete.displayDraft.split(':')[0]),
                    round: parseInt(athlete.displayDraft.match(/Rd (\d+)/)?.[1] || '0'),
                    pick: parseInt(athlete.displayDraft.match(/Pk (\d+)/)?.[1] || '0'),
                    team: athlete.displayDraft.match(/\(([A-Z]+)\)/)?.[1]
                } : undefined
            };
            return overview;
        }
        catch (error) {
            console.error(`Error fetching NBA player overview for ${playerId}:`, error);
            return null;
        }
    }
}
export const nbaApi = new NBAAPIClient();
//# sourceMappingURL=nba-api.js.map