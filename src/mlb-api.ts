/**
 * MLB Stats API Client
 * 
 * A client for interacting with the MLB Stats API to fetch team information,
 * player statistics, game schedules, live scores, and other baseball data.
 */

// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

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

export class MLBAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to the MLB Stats API
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    console.error(`Making request to: ${url.toString()}`);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`MLB API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current MLB standings
   */
  async getStandings(params: MLBStandingsParams): Promise<MLBStandings[]> {
    const queryParams: Record<string, any> = {
      standingsType: params.standingsType || 'regularSeason'
    };

    if (params.leagueId) queryParams.leagueId = params.leagueId;
    if (params.divisionId) queryParams.divisionId = params.divisionId;
    if (params.season) queryParams.season = params.season;
    if (params.gameType) queryParams.gameType = params.gameType;

    const data = await this.makeRequest('/standings', queryParams);
    
    const standings: MLBStandings[] = [];
    
    data.records?.forEach((record: any) => {
      record.teamRecords?.forEach((teamRecord: any) => {
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
  async getTeamInfo(teamId: number, hydrate?: string): Promise<MLBTeam> {
    const params: Record<string, any> = {};
    if (hydrate) params.hydrate = hydrate;

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
  async getTeamRoster(teamId: number, season?: number): Promise<any> {
    const currentYear = new Date().getFullYear();
    const params: Record<string, any> = {};
    
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
   * Get player statistics
   */
  async getPlayerStats(playerId: number, season?: number, gameType: string = 'R'): Promise<MLBPlayerStats> {
    const currentYear = new Date().getFullYear();
    const params = {
      stats: 'season',
      season: season || currentYear,
      gameType
    };

    const data = await this.makeRequest(`/people/${playerId}/stats`, params);
    
    if (!data.stats || data.stats.length === 0) {
      throw new Error(`No stats found for player with ID ${playerId}`);
    }

    // Find the hitting stats
    const hittingStats = data.stats.find((stat: any) => 
      stat.group && stat.group.displayName && 
      stat.group.displayName.toLowerCase().includes('hitting')
    );

    if (!hittingStats || !hittingStats.splits || hittingStats.splits.length === 0) {
      throw new Error(`No hitting stats found for player with ID ${playerId}`);  
    }

    const split = hittingStats.splits[0];
    const player = split.player;
    
    // Transform the API response to match the expected MCP schema
    const transformedStats = data.stats.map((stat: any) => ({
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
  async getSchedule(params: MLBScheduleParams): Promise<any> {
    const queryParams: Record<string, any> = {
      startDate: params.startDate,
      endDate: params.endDate,
      hydrate: 'team,linescore,venue'
    };

    if (params.teamId) queryParams.teamId = params.teamId;
    if (params.gameType) queryParams.gameType = params.gameType;

    return this.makeRequest('/schedule', queryParams);
  }

  /**
   * Get postseason schedule using dedicated postseason endpoint
   */
  async getPostseasonSchedule(season?: number, series?: string): Promise<any> {
    const queryParams: Record<string, any> = {
      hydrate: 'team,linescore,venue,decisions,person'
    };

    if (season) queryParams.season = season;
    if (series) queryParams.series = series; // e.g., 'WS', 'ALCS', 'NLDS', 'WC'

    return this.makeRequest('/schedule/postseason', queryParams);
  }

  /**
   * Get live game data
   */
  async getLiveGame(gamePk: number): Promise<any> {
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
        innings: data.liveData.linescore.innings?.map((inning: any) => ({
          num: inning.num,
          away: { runs: inning.away?.runs },
          home: { runs: inning.home?.runs }
        })) || []
      } : undefined
    };
  }

  /**
   * Search for players by name
   */
  async searchPlayers(name: string, activeStatus: string = 'Y'): Promise<any> {
    const params = {
      q: name
    };

    return this.makeRequest('/people/search', params);
  }

  /**
   * Get all MLB teams
   */
  async getAllTeams(): Promise<MLBTeam[]> {
    const data = await this.makeRequest('/teams', { 
      sportId: 1,
      hydrate: 'venue,league,division'
    });
    
    return data.teams?.map((team: any) => ({
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
  async getPlayerInfo(playerId: number): Promise<any> {
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
  async getBoxScore(gamePk: number): Promise<any> {
    const data = await this.makeRequest(`/game/${gamePk}/boxscore`, {});
    return data;
  }

  /**
   * Get player game logs for a season
   */
  async getPlayerGameLogs(playerId: number, season?: number, gameType: string = 'R'): Promise<any> {
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
  async getScheduleWithGamePks(params: MLBScheduleParams): Promise<any> {
    const queryParams: Record<string, any> = {
      startDate: params.startDate,
      endDate: params.endDate,
      hydrate: 'team,linescore,venue,decisions'
    };

    if (params.teamId) queryParams.teamId = params.teamId;
    if (params.gameType) queryParams.gameType = params.gameType;

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
   */
  async lookupPlayer(searchTerm: string, gameType: string = 'R', season?: number, sportId: number = 1): Promise<any[]> {
    // Use the same endpoint as searchPlayers but with more comprehensive return data
    const params: Record<string, any> = {
      q: searchTerm
    };

    const data = await this.makeRequest('/people/search', params);
    
    if (!data.people || data.people.length === 0) {
      throw new Error(`No players found matching "${searchTerm}"`);
    }

    return data.people.map((player: any) => ({
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
  async lookupTeam(searchTerm: string, season?: number, sportId: number = 1): Promise<any[]> {
    const params: Record<string, any> = {
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
    const matchingTeams = data.teams.filter((team: any) => 
      team.name.toLowerCase().includes(searchLower) ||
      team.locationName.toLowerCase().includes(searchLower) ||
      team.abbreviation.toLowerCase().includes(searchLower) ||
      team.teamName.toLowerCase().includes(searchLower) ||
      team.shortName?.toLowerCase().includes(searchLower)
    );

    if (matchingTeams.length === 0) {
      throw new Error(`No teams found matching "${searchTerm}"`);
    }

    return matchingTeams.map((team: any) => ({
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
   * Get detailed boxscore for a game
   */
  async getBoxscore(gamePk: number): Promise<any> {
    const data = await this.makeRequest(`/game/${gamePk}/boxscore`);
    
    if (!data.teams) {
      throw new Error(`No boxscore data found for game ${gamePk}`);
    }

    return {
      gamePk,
      teams: data.teams,
      officials: data.officials,
      info: data.info,
      pitchingNotes: data.pitchingNotes
    };
  }

  /**
   * Get game highlights
   */
  async getGameHighlights(gamePk: number): Promise<any> {
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
  async getLeagueLeaders(leaderCategories: string, season?: number, leagueId?: number, limit: number = 10): Promise<any> {
    const currentYear = new Date().getFullYear();
    const params: Record<string, any> = {
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
      categories: data.leagueLeaders.map((category: any) => ({
        leaderCategory: category.leaderCategory,
        leaders: category.leaders.map((leader: any) => ({
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
}