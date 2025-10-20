# Multi-Sport Architecture Design

## Overview
This document outlines the architecture for extending the MLB MCP Server to support NBA and NFL stats using a unified, dynamic approach inspired by the balldontlie-mcp reference implementation.

## Current State Analysis

### What We Have (MLB)
```
src/mlb-api.ts          → MLB-specific API client
src/index.ts            → MLB-only MCP server
src/comparison-utils.ts → MLB-specific comparison logic
```

### What We Need (Multi-Sport)
```
src/
  ├── api/
  │   ├── base-api.ts           → Abstract base class
  │   ├── mlb-api.ts            → MLB implementation
  │   ├── nba-api.ts            → NBA implementation (new)
  │   └── nfl-api.ts            → NFL implementation (new)
  ├── formatters/
  │   ├── base-formatter.ts     → Common formatting interface
  │   ├── mlb-formatter.ts      → MLB-specific formatting
  │   ├── nba-formatter.ts      → NBA-specific formatting (new)
  │   └── nfl-formatter.ts      → NFL-specific formatting (new)
  ├── comparison/
  │   ├── base-comparison.ts    → Abstract comparison logic
  │   ├── mlb-comparison.ts     → MLB comparison (refactored)
  │   ├── nba-comparison.ts     → NBA comparison (new)
  │   └── nfl-comparison.ts     → NFL comparison (new)
  ├── types/
  │   ├── common.ts             → Shared types across all sports
  │   ├── mlb-types.ts          → MLB-specific types
  │   ├── nba-types.ts          → NBA-specific types (new)
  │   └── nfl-types.ts          → NFL-specific types (new)
  ├── index.ts                  → Unified MCP server with sport routing
  └── sport-factory.ts          → Factory pattern for sport API selection
```

## Design Patterns to Implement

### 1. Strategy Pattern (Sport Selection)
```typescript
// src/sport-factory.ts
export enum SportLeague {
  MLB = 'MLB',
  NBA = 'NBA',
  NFL = 'NFL'
}

export class SportAPIFactory {
  static createAPI(league: SportLeague): BaseSportAPI {
    switch (league) {
      case SportLeague.MLB:
        return new MLBAPIClient('https://statsapi.mlb.com/api/v1');
      case SportLeague.NBA:
        return new NBAAPIClient('https://api.balldontlie.io/v1');
      case SportLeague.NFL:
        return new NFLAPIClient('https://api.balldontlie.io/v1');
      default:
        throw new Error(`Unsupported league: ${league}`);
    }
  }
}
```

### 2. Abstract Base Class (API Interface)
```typescript
// src/api/base-api.ts
export abstract class BaseSportAPI {
  protected baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  // Common methods all sports must implement
  abstract searchPlayers(name: string, options?: any): Promise<any>;
  abstract getPlayerStats(playerId: number, options?: any): Promise<any>;
  abstract getTeams(): Promise<any>;
  abstract getTeamInfo(teamId: number): Promise<any>;
  abstract getSchedule(params: any): Promise<any>;
  abstract getGame(gameId: number): Promise<any>;
  
  // Common utility methods
  protected async makeRequest(endpoint: string, params?: any): Promise<any> {
    // Shared request logic with error handling
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new SportAPIError(
        `API request failed: ${response.status}`,
        response.status,
        endpoint
      );
    }
    
    return response.json();
  }
}
```

### 3. Sport-Specific Implementations
```typescript
// src/api/mlb-api.ts (refactored from existing)
export class MLBAPIClient extends BaseSportAPI {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
  
  async searchPlayers(name: string, options?: MLBSearchOptions): Promise<MLBPlayer[]> {
    // MLB-specific implementation
    const { season, activeStatus = 'Y' } = options || {};
    return this.makeRequest('/sports/1/players', { season });
  }
  
  async getPlayerStats(playerId: number, options?: MLBStatsOptions): Promise<MLBPlayerStats> {
    // MLB-specific implementation
    const { season, gameType = 'R', stats = 'season', group = 'hitting' } = options || {};
    return this.makeRequest(`/people/${playerId}/stats`, { stats, season, gameType, group });
  }
  
  // ... other MLB-specific methods
}

// src/api/nba-api.ts (new - uses free NBA.com Stats API)
interface NBAPlayer {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export class NBAAPIClient extends BaseSportAPI {
  private headers = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.nba.com',
    'Referer': 'https://www.nba.com/'
  };
  
  private playerCache: NBAPlayer[] = [];
  private cacheLoaded = false;
  
  constructor(baseUrl: string) {
    super(baseUrl);  // https://stats.nba.com/stats
  }
  
  private async loadPlayerCache(): Promise<void> {
    if (this.cacheLoaded) return;
    
    const response = await this.makeRequest('/commonallplayers', {
      LeagueID: '00',
      Season: this.getCurrentSeason(),
      IsOnlyCurrentSeason: '0'
    });
    
    this.playerCache = this.parsePlayerList(response);
    this.cacheLoaded = true;
  }
  
  async searchPlayers(name: string, options?: NBASearchOptions): Promise<NBAPlayer[]> {
    await this.loadPlayerCache();
    
    const searchTerm = name.toLowerCase();
    return this.playerCache.filter(p => 
      p.full_name.toLowerCase().includes(searchTerm)
    );
  }
  
  async getPlayerStats(playerId: number, options?: NBAStatsOptions): Promise<any> {
    const { season, perMode = 'PerGame' } = options || {};
    
    const response = await this.makeRequest('/playercareerstats', {
      PlayerID: playerId.toString(),
      PerMode: perMode
    });
    
    // Parse NBA.com's resultSets format
    const seasonStats = this.parseResultSet(response, 'SeasonTotalsRegularSeason');
    const careerStats = this.parseResultSet(response, 'CareerTotalsRegularSeason');
    
    if (season) {
      return seasonStats.find((s: any) => s.SEASON_ID === season);
    }
    
    return {
      seasons: seasonStats,
      career: careerStats[0]
    };
  }
  
  // Override makeRequest to add NBA.com headers
  protected async makeRequest(endpoint: string, params?: any): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new SportAPIError(
        `NBA API request failed: ${response.statusText}`,
        response.status,
        endpoint
      );
    }
    
    return response.json();
  }
  
  private parseResultSet(response: any, resultSetName?: string): any[] {
    const resultSet = resultSetName 
      ? response.resultSets.find((rs: any) => rs.name === resultSetName)
      : response.resultSets[0];
      
    if (!resultSet) return [];
    
    const headers = resultSet.headers;
    const rows = resultSet.rowSet;
    
    return rows.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index];
      });
      return obj;
    });
  }
  
  private parsePlayerList(response: any): NBAPlayer[] {
    const players = this.parseResultSet(response);
    return players.map(p => ({
      id: p.PERSON_ID,
      full_name: p.DISPLAY_FIRST_LAST,
      first_name: p.DISPLAY_FIRST_LAST.split(' ')[0],
      last_name: p.DISPLAY_FIRST_LAST.split(' ').slice(1).join(' '),
      is_active: p.ROSTERSTATUS === 1
    }));
  }
  
  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // NBA season starts in October
    return month >= 10 
      ? `${year}-${(year + 1).toString().slice(2)}`
      : `${year - 1}-${year.toString().slice(2)}`;
  }
}

// src/api/nfl-api.ts (new - uses nflverse-data from GitHub)
export class NFLAPIClient extends BaseSportAPI {
  private dataCache: Map<string, any>;
  private cacheExpiry: Map<string, number>;
  
  constructor(baseUrl: string) {
    super(baseUrl);  // GitHub releases base URL
    this.dataCache = new Map();
    this.cacheExpiry = new Map();
  }
  
  async searchPlayers(name: string, options?: NFLSearchOptions): Promise<NFLPlayer[]> {
    // Load players.csv from GitHub releases
    const { season } = options || {};
    const playersUrl = `${this.baseUrl}players/players.csv`;
    const players = await this.loadCSV(playersUrl);
    
    // Filter by name
    const searchTerms = name.toLowerCase().split(' ');
    return players.filter(player => 
      searchTerms.every(term => 
        player.full_name?.toLowerCase().includes(term) ||
        player.short_name?.toLowerCase().includes(term)
      )
    );
  }
  
  async getPlayerStats(playerId: string, options?: NFLStatsOptions): Promise<NFLPlayerStats> {
    // Load player_stats_{YEAR}.parquet from GitHub releases
    const { season = new Date().getFullYear() } = options || {};
    const statsUrl = `${this.baseUrl}player_stats/player_stats_${season}.parquet`;
    
    // Load and parse Parquet file (or CSV fallback)
    const stats = await this.loadParquetOrCSV(statsUrl);
    
    // Filter by player_id and aggregate
    const playerStats = stats.filter(stat => stat.player_id === playerId);
    
    // Aggregate weekly stats into season totals
    return this.aggregateStats(playerStats);
  }
  
  async getTeams(): Promise<NFLTeam[]> {
    const teamsUrl = `${this.baseUrl}teams/teams.csv`;
    return this.loadCSV(teamsUrl);
  }
  
  async getSchedule(params: NFLScheduleParams): Promise<any> {
    const { season } = params;
    const scheduleUrl = `${this.baseUrl}schedules/schedules_${season}.csv`;
    return this.loadCSV(scheduleUrl);
  }
  
  async getGame(gameId: string): Promise<any> {
    // Load play-by-play data for detailed game info
    const season = gameId.substring(0, 4); // Game ID format: YYYY_MM_AWAY_HOME
    const pbpUrl = `${this.baseUrl}pbp/play_by_play_${season}.parquet`;
    const pbp = await this.loadParquetOrCSV(pbpUrl);
    
    // Filter to specific game
    return pbp.filter(play => play.game_id === gameId);
  }
  
  // Helper methods
  private async loadCSV(url: string): Promise<any[]> {
    // Check cache first
    if (this.dataCache.has(url) && this.cacheExpiry.get(url)! > Date.now()) {
      return this.dataCache.get(url);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new SportAPIError(`Failed to load NFL data: ${response.status}`, response.status, url);
    }
    
    const csvText = await response.text();
    const data = this.parseCSV(csvText);
    
    // Cache for 1 hour
    this.dataCache.set(url, data);
    this.cacheExpiry.set(url, Date.now() + 3600000);
    
    return data;
  }
  
  private async loadParquetOrCSV(url: string): Promise<any[]> {
    // Try Parquet first, fallback to CSV
    try {
      const parquetUrl = url.replace('.csv', '.parquet');
      return await this.loadParquet(parquetUrl);
    } catch {
      // Fallback to CSV
      const csvUrl = url.replace('.parquet', '.csv');
      return await this.loadCSV(csvUrl);
    }
  }
  
  private async loadParquet(url: string): Promise<any[]> {
    // Use parquetjs-lite or apache-arrow to parse
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    // Parse Parquet (implementation depends on library choice)
    // return parseParquet(buffer);
    
    throw new Error('Parquet parsing not yet implemented');
  }
  
  private parseCSV(csvText: string): any[] {
    // Simple CSV parser (or use library like csv-parse)
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim();
        return obj;
      }, {} as any);
    });
  }
  
  private aggregateStats(weeklyStats: any[]): any {
    // Aggregate weekly stats into totals
    const totals: any = {
      player_id: weeklyStats[0]?.player_id,
      player_name: weeklyStats[0]?.player_name,
      position: weeklyStats[0]?.position,
      games_played: weeklyStats.length
    };
    
    // Sum all numeric fields
    weeklyStats.forEach(week => {
      Object.keys(week).forEach(key => {
        if (typeof week[key] === 'number' && key !== 'week') {
          totals[key] = (totals[key] || 0) + week[key];
        }
      });
    });
    
    return totals;
  }
}
```

### 4. Unified Comparison Framework
```typescript
// src/comparison/base-comparison.ts
export interface ComparisonMetric {
  key: string;
  name: string;
  higherIsBetter: boolean;
  category?: string; // offense, defense, special teams for NFL
}

export abstract class BaseComparison {
  protected api: BaseSportAPI;
  
  constructor(api: BaseSportAPI) {
    this.api = api;
  }
  
  abstract getKeyMetrics(statGroup: string): ComparisonMetric[];
  abstract extractStats(playerData: any, statGroup: string): Record<string, any>;
  abstract formatResult(result: ComparisonResult): string;
  
  // Common comparison logic
  async comparePlayers(
    player1Id: number,
    player2Id: number,
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Fetch data
    const [player1Data, player2Data] = await Promise.all([
      this.api.getPlayerStats(player1Id, options),
      this.api.getPlayerStats(player2Id, options)
    ]);
    
    // Extract relevant stats
    const stats1 = this.extractStats(player1Data, options.statGroup);
    const stats2 = this.extractStats(player2Data, options.statGroup);
    
    // Get metrics
    const metrics = this.getKeyMetrics(options.statGroup);
    
    // Perform comparison
    const comparison = metrics.map(metric => {
      const value1 = stats1[metric.key] || 0;
      const value2 = stats2[metric.key] || 0;
      
      let winner: 'player1' | 'player2' | 'tie';
      if (value1 > value2) {
        winner = metric.higherIsBetter ? 'player1' : 'player2';
      } else if (value2 > value1) {
        winner = metric.higherIsBetter ? 'player2' : 'player1';
      } else {
        winner = 'tie';
      }
      
      return {
        category: metric.name,
        player1Value: value1,
        player2Value: value2,
        winner,
        difference: Math.abs(value1 - value2)
      };
    });
    
    // Calculate winner
    const player1Wins = comparison.filter(c => c.winner === 'player1').length;
    const player2Wins = comparison.filter(c => c.winner === 'player2').length;
    
    return {
      player1: { id: player1Id, stats: stats1 },
      player2: { id: player2Id, stats: stats2 },
      comparison,
      overallWinner: player1Wins > player2Wins ? 'player1' : 
                     player2Wins > player1Wins ? 'player2' : 'tie'
    };
  }
}

// src/comparison/mlb-comparison.ts (refactor existing)
export class MLBComparison extends BaseComparison {
  getKeyMetrics(statGroup: string): ComparisonMetric[] {
    switch (statGroup) {
      case 'hitting':
        return [
          { key: 'avg', name: 'Batting Average', higherIsBetter: true },
          { key: 'ops', name: 'OPS', higherIsBetter: true },
          { key: 'homeRuns', name: 'Home Runs', higherIsBetter: true },
          { key: 'rbi', name: 'RBIs', higherIsBetter: true },
          { key: 'hits', name: 'Hits', higherIsBetter: true }
        ];
      case 'pitching':
        return [
          { key: 'era', name: 'ERA', higherIsBetter: false },
          { key: 'whip', name: 'WHIP', higherIsBetter: false },
          { key: 'wins', name: 'Wins', higherIsBetter: true },
          { key: 'strikeOuts', name: 'Strikeouts', higherIsBetter: true },
          { key: 'inningsPitched', name: 'Innings Pitched', higherIsBetter: true }
        ];
      default:
        return [];
    }
  }
  
  extractStats(playerData: any, statGroup: string): Record<string, any> {
    const statObj = playerData.stats?.find((s: any) => 
      s.group?.displayName?.toLowerCase().includes(statGroup.toLowerCase())
    );
    return statObj?.stats || {};
  }
  
  formatResult(result: ComparisonResult): string {
    // MLB-specific formatting
    return this.formatBasicComparison(result);
  }
}

// src/comparison/nba-comparison.ts (new)
export class NBAComparison extends BaseComparison {
  getKeyMetrics(statGroup: string): ComparisonMetric[] {
    switch (statGroup) {
      case 'scoring':
        return [
          { key: 'pts', name: 'Points Per Game', higherIsBetter: true },
          { key: 'fg_pct', name: 'Field Goal %', higherIsBetter: true },
          { key: 'fg3_pct', name: '3-Point %', higherIsBetter: true },
          { key: 'ft_pct', name: 'Free Throw %', higherIsBetter: true }
        ];
      case 'overall':
        return [
          { key: 'pts', name: 'Points Per Game', higherIsBetter: true },
          { key: 'reb', name: 'Rebounds Per Game', higherIsBetter: true },
          { key: 'ast', name: 'Assists Per Game', higherIsBetter: true },
          { key: 'stl', name: 'Steals Per Game', higherIsBetter: true },
          { key: 'blk', name: 'Blocks Per Game', higherIsBetter: true }
        ];
      default:
        return [];
    }
  }
  
  extractStats(playerData: any, statGroup: string): Record<string, any> {
    // NBA-specific extraction
    return playerData.data?.[0] || {};
  }
  
  formatResult(result: ComparisonResult): string {
    // NBA-specific formatting
    return this.formatBasicComparison(result);
  }
}

// src/comparison/nfl-comparison.ts (new)
export class NFLComparison extends BaseComparison {
  getKeyMetrics(statGroup: string): ComparisonMetric[] {
    switch (statGroup) {
      case 'passing':
        return [
          { key: 'passing_yards', name: 'Passing Yards', higherIsBetter: true },
          { key: 'passing_tds', name: 'Passing TDs', higherIsBetter: true },
          { key: 'interceptions', name: 'Interceptions', higherIsBetter: false },
          { key: 'completion_pct', name: 'Completion %', higherIsBetter: true },
          { key: 'passer_rating', name: 'Passer Rating', higherIsBetter: true }
        ];
      case 'rushing':
        return [
          { key: 'rushing_yards', name: 'Rushing Yards', higherIsBetter: true },
          { key: 'rushing_tds', name: 'Rushing TDs', higherIsBetter: true },
          { key: 'yards_per_carry', name: 'Yards Per Carry', higherIsBetter: true },
          { key: 'rushing_attempts', name: 'Rushing Attempts', higherIsBetter: true }
        ];
      case 'receiving':
        return [
          { key: 'receiving_yards', name: 'Receiving Yards', higherIsBetter: true },
          { key: 'receiving_tds', name: 'Receiving TDs', higherIsBetter: true },
          { key: 'receptions', name: 'Receptions', higherIsBetter: true },
          { key: 'yards_per_reception', name: 'Yards Per Reception', higherIsBetter: true }
        ];
      default:
        return [];
    }
  }
  
  extractStats(playerData: any, statGroup: string): Record<string, any> {
    // NFL-specific extraction
    return playerData.data?.[0] || {};
  }
  
  formatResult(result: ComparisonResult): string {
    // NFL-specific formatting
    return this.formatBasicComparison(result);
  }
}
```

### 5. Unified MCP Server with Sport Routing
```typescript
// src/index.ts (refactored)
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SportLeague, SportAPIFactory } from './sport-factory.js';
import { MLBComparison } from './comparison/mlb-comparison.js';
import { NBAComparison } from './comparison/nba-comparison.js';
import { NFLComparison } from './comparison/nfl-comparison.js';

const server = new McpServer({
  name: 'multi-sport-mcp-server',
  version: '2.0.0',
});

// League enum for all tools
const leagueEnum = z.enum(['MLB', 'NBA', 'NFL']);

/**
 * Tool: Get Teams (Multi-Sport)
 */
server.registerTool(
  'get-teams',
  {
    title: 'Get Teams',
    description: 'Get all teams from MLB, NBA, or NFL',
    inputSchema: {
      league: leagueEnum.describe('League to get teams from')
    }
  },
  async ({ league }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    const teams = await api.getTeams();
    
    // Format based on league
    const formatter = FormatterFactory.create(league as SportLeague);
    const text = formatter.formatTeams(teams);
    
    return {
      content: [{ type: 'text', text }]
    };
  }
);

/**
 * Tool: Search Players (Multi-Sport)
 */
server.registerTool(
  'search-players',
  {
    title: 'Search Players',
    description: 'Search for players across MLB, NBA, or NFL',
    inputSchema: {
      league: leagueEnum.describe('League to search in'),
      firstName: z.string().optional().describe('First name'),
      lastName: z.string().optional().describe('Last name'),
      fullName: z.string().optional().describe('Full name (for MLB)'),
      cursor: z.number().optional().describe('Pagination cursor')
    }
  },
  async ({ league, firstName, lastName, fullName, cursor }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    
    // Handle different search patterns per league
    let results;
    if (league === 'MLB' && fullName) {
      results = await api.searchPlayers(fullName);
    } else {
      results = await api.searchPlayers('', { firstName, lastName, cursor });
    }
    
    const formatter = FormatterFactory.create(league as SportLeague);
    const text = formatter.formatPlayers(results);
    
    return {
      content: [{ type: 'text', text }]
    };
  }
);

/**
 * Tool: Get Player Stats (Multi-Sport)
 */
server.registerTool(
  'get-player-stats',
  {
    title: 'Get Player Stats',
    description: 'Get player statistics from MLB, NBA, or NFL',
    inputSchema: {
      league: leagueEnum.describe('League'),
      playerId: z.number().describe('Player ID'),
      season: z.union([z.string(), z.number()]).optional().describe('Season'),
      statGroup: z.string().optional().describe('Stat group (hitting/pitching for MLB, overall/scoring for NBA, passing/rushing/receiving for NFL)')
    }
  },
  async ({ league, playerId, season, statGroup }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    const stats = await api.getPlayerStats(playerId, { season, statGroup });
    
    const formatter = FormatterFactory.create(league as SportLeague);
    const text = formatter.formatPlayerStats(stats, statGroup);
    
    return {
      content: [{ type: 'text', text }]
    };
  }
);

/**
 * Tool: Compare Players (Multi-Sport)
 */
server.registerTool(
  'compare-players',
  {
    title: 'Compare Two Players',
    description: 'Compare statistics between two players from the same league',
    inputSchema: {
      league: leagueEnum.describe('League (both players must be from same league)'),
      player1Id: z.number().describe('First player ID'),
      player2Id: z.number().describe('Second player ID'),
      season: z.union([z.string(), z.number()]).default('career').describe('Season or "career"'),
      statGroup: z.string().optional().describe('Stat group to compare')
    }
  },
  async ({ league, player1Id, player2Id, season, statGroup }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    
    // Get appropriate comparison class
    let comparison;
    switch (league) {
      case 'MLB':
        comparison = new MLBComparison(api);
        break;
      case 'NBA':
        comparison = new NBAComparison(api);
        break;
      case 'NFL':
        comparison = new NFLComparison(api);
        break;
    }
    
    const result = await comparison.comparePlayers(player1Id, player2Id, {
      season,
      statGroup: statGroup || (league === 'MLB' ? 'hitting' : 'overall')
    });
    
    const text = comparison.formatResult(result);
    
    return {
      content: [{ type: 'text', text }],
      structuredContent: result
    };
  }
);

/**
 * Tool: Get Schedule (Multi-Sport)
 */
server.registerTool(
  'get-schedule',
  {
    title: 'Get Game Schedule',
    description: 'Get game schedule for MLB, NBA, or NFL',
    inputSchema: {
      league: leagueEnum.describe('League'),
      startDate: z.string().describe('Start date (YYYY-MM-DD)'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
      teamId: z.number().optional().describe('Filter by team ID'),
      season: z.number().optional().describe('Season year')
    }
  },
  async ({ league, startDate, endDate, teamId, season }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    const schedule = await api.getSchedule({
      startDate,
      endDate,
      teamId,
      season
    });
    
    const formatter = FormatterFactory.create(league as SportLeague);
    const text = formatter.formatSchedule(schedule);
    
    return {
      content: [{ type: 'text', text }]
    };
  }
);

/**
 * Tool: Get Live Game (Multi-Sport)
 */
server.registerTool(
  'get-live-game',
  {
    title: 'Get Live Game Data',
    description: 'Get live game data including score and play-by-play',
    inputSchema: {
      league: leagueEnum.describe('League'),
      gameId: z.number().describe('Game ID')
    }
  },
  async ({ league, gameId }) => {
    const api = SportAPIFactory.createAPI(league as SportLeague);
    const game = await api.getGame(gameId);
    
    const formatter = FormatterFactory.create(league as SportLeague);
    const text = formatter.formatLiveGame(game);
    
    return {
      content: [{ type: 'text', text }]
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Multi-Sport MCP Server is running');
}

main().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
```

## CLI Scripts Architecture

### Unified CLI Tool
```typescript
// compare-players-multi-sport.cjs (new)
#!/usr/bin/env node

/**
 * Multi-Sport Player Comparison CLI
 * 
 * Usage: node compare-players-multi-sport.cjs <league> "Player 1" "Player 2" [season] [statGroup]
 * Example: node compare-players-multi-sport.cjs MLB "Aaron Judge" "Pete Alonso" career hitting
 * Example: node compare-players-multi-sport.cjs NBA "LeBron James" "Kevin Durant" 2024 scoring
 * Example: node compare-players-multi-sport.cjs NFL "Patrick Mahomes" "Josh Allen" 2024 passing
 */

const { SportAPIFactory, SportLeague } = require('./build/sport-factory.js');
const { MLBComparison } = require('./build/comparison/mlb-comparison.js');
const { NBAComparison } = require('./build/comparison/nba-comparison.js');
const { NFLComparison } = require('./build/comparison/nfl-comparison.js');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node compare-players-multi-sport.cjs <league> "Player 1" "Player 2" [season] [statGroup]');
    console.error('Leagues: MLB, NBA, NFL');
    process.exit(1);
  }
  
  const league = args[0].toUpperCase();
  const player1Name = args[1];
  const player2Name = args[2];
  const season = args[3] || 'career';
  const statGroup = args[4];
  
  // Validate league
  if (!['MLB', 'NBA', 'NFL'].includes(league)) {
    console.error(`Invalid league: ${league}. Must be MLB, NBA, or NFL`);
    process.exit(1);
  }
  
  console.log(`\n🏆 ${league} Player Comparison Tool`);
  console.log('━'.repeat(80));
  
  try {
    // Create API client
    const api = SportAPIFactory.createAPI(league);
    
    // Search for players
    console.error(`\nSearching for ${player1Name}...`);
    const player1Results = await api.searchPlayers(player1Name);
    const player1Id = player1Results.data?.[0]?.id || player1Results.people?.[0]?.id;
    
    console.error(`Searching for ${player2Name}...`);
    const player2Results = await api.searchPlayers(player2Name);
    const player2Id = player2Results.data?.[0]?.id || player2Results.people?.[0]?.id;
    
    if (!player1Id || !player2Id) {
      throw new Error('Could not find one or both players');
    }
    
    // Create comparison instance
    let comparison;
    switch (league) {
      case 'MLB':
        comparison = new MLBComparison(api);
        break;
      case 'NBA':
        comparison = new NBAComparison(api);
        break;
      case 'NFL':
        comparison = new NFLComparison(api);
        break;
    }
    
    // Compare players
    console.error('\nFetching and comparing player statistics...\n');
    const result = await comparison.comparePlayers(player1Id, player2Id, {
      season,
      statGroup: statGroup || getDefaultStatGroup(league)
    });
    
    // Display results
    console.log(comparison.formatResult(result));
    
    console.log('\n✅ Comparison complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

function getDefaultStatGroup(league) {
  switch (league) {
    case 'MLB': return 'hitting';
    case 'NBA': return 'overall';
    case 'NFL': return 'passing';
    default: return 'overall';
  }
}

main();
```

## Environment Configuration

### .env Structure
```bash
# ALL APIs ARE FREE - NO AUTHENTICATION REQUIRED!

# MLB API (free, official MLB Stats API)
MLB_API_BASE=https://statsapi.mlb.com/api/v1

# NBA API (free, official NBA.com Stats API)
NBA_API_BASE=https://stats.nba.com/stats

# NFL API (free, nflverse-data from GitHub)
NFL_DATA_BASE=https://github.com/nflverse/nflverse-data/releases/download/
```

### Config Management
```typescript
// src/config.ts
export interface SportConfig {
  baseUrl: string;
  requiresAuth: boolean;
  apiKey?: string;
}

export class Config {
  static getMLBConfig(): SportConfig {
    return {
      baseUrl: process.env.MLB_API_BASE || 'https://statsapi.mlb.com/api/v1',
      requiresAuth: false
    };
  }
  
  static getNBAConfig(): SportConfig {
    return {
      baseUrl: process.env.NBA_API_BASE || 'https://stats.nba.com/stats',
      requiresAuth: false
    };
  }
  
  static getNFLConfig(): SportConfig {
    return {
      baseUrl: process.env.NFL_DATA_BASE || 'https://github.com/nflverse/nflverse-data/releases/download/',
      requiresAuth: false
    };
  }
}
```

## Migration Strategy

### Phase 1: Refactor Existing MLB Code
1. Extract base classes from `mlb-api.ts`
2. Create `BaseSportAPI` abstract class
3. Refactor `MLBAPIClient` to extend `BaseSportAPI`
4. Extract `BaseComparison` from `comparison-utils.ts`
5. Refactor MLB comparison to extend `BaseComparison`

### Phase 2: Add NBA Support
1. Implement `NBAAPIClient` extending `BaseSportAPI`
2. Implement `NBAComparison` extending `BaseComparison`
3. Create NBA-specific formatters
4. Add NBA types
5. Test NBA functionality

### Phase 3: Add NFL Support
1. Implement `NFLAPIClient` extending `BaseSportAPI`
2. Implement `NFLComparison` extending `BaseComparison`
3. Create NFL-specific formatters
4. Add NFL types
5. Test NFL functionality

### Phase 4: Unified Server
1. Update `index.ts` with league routing
2. Create `SportAPIFactory`
3. Update all tools to support multi-sport
4. Update CLI scripts
5. Comprehensive testing

### Phase 5: Documentation & Polish
1. Update README with multi-sport usage
2. Create migration guide for existing users
3. Add examples for each sport
4. Performance optimization
5. Error handling improvements

## Testing Strategy

### Unit Tests
```typescript
// test/api/mlb-api.test.ts
describe('MLBAPIClient', () => {
  it('should extend BaseSportAPI', () => {
    const client = new MLBAPIClient('https://api.example.com');
    expect(client).toBeInstanceOf(BaseSportAPI);
  });
  
  it('should search for players', async () => {
    // Test implementation
  });
});

// test/api/nba-api.test.ts
describe('NBAAPIClient', () => {
  it('should require API key', () => {
    expect(() => new NBAAPIClient('url', '')).toThrow();
  });
});

// test/comparison/multi-sport.test.ts
describe('Multi-Sport Comparison', () => {
  it('should compare MLB players', async () => {
    // Test implementation
  });
  
  it('should compare NBA players', async () => {
    // Test implementation
  });
  
  it('should compare NFL players', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// test/integration/mcp-server.test.ts
describe('Multi-Sport MCP Server', () => {
  it('should handle get-teams for all leagues', async () => {
    for (const league of ['MLB', 'NBA', 'NFL']) {
      const result = await server.tool('get-teams', { league });
      expect(result.content).toBeDefined();
    }
  });
});
```

## Benefits of This Architecture

### 1. Maintainability
- ✅ Single source of truth for each sport's logic
- ✅ Easy to add new sports (just extend base classes)
- ✅ Changes to common functionality affect all sports

### 2. Scalability
- ✅ Add new tools without duplicating code
- ✅ Support for future sports (NHL, MLS, etc.)
- ✅ Easy to add new comparison metrics

### 3. Code Reusability
- ✅ Shared base classes reduce duplication
- ✅ Common utilities work across all sports
- ✅ Formatters can share common patterns

### 4. Testability
- ✅ Each component can be tested in isolation
- ✅ Mock implementations easy to create
- ✅ Clear separation of concerns

### 5. Type Safety
- ✅ TypeScript ensures correct usage
- ✅ Sport-specific types prevent errors
- ✅ Compile-time validation

## Example Usage

### MCP Server
```typescript
// Compare MLB players
await server.tool('compare-players', {
  league: 'MLB',
  player1Id: 592450,  // Aaron Judge
  player2Id: 624413,  // Pete Alonso
  season: 'career',
  statGroup: 'hitting'
});

// Compare NBA players
await server.tool('compare-players', {
  league: 'NBA',
  player1Id: 237,     // LeBron James
  player2Id: 140,     // Kevin Durant
  season: 2024,
  statGroup: 'scoring'
});

// Compare NFL players
await server.tool('compare-players', {
  league: 'NFL',
  player1Id: 4795,    // Patrick Mahomes
  player2Id: 4881,    // Josh Allen
  season: 2024,
  statGroup: 'passing'
});
```

### CLI
```bash
# MLB
node compare-players-multi-sport.cjs MLB "Aaron Judge" "Pete Alonso" career hitting

# NBA
node compare-players-multi-sport.cjs NBA "LeBron James" "Kevin Durant" 2024 scoring

# NFL
node compare-players-multi-sport.cjs NFL "Patrick Mahomes" "Josh Allen" 2024 passing
```

## Next Steps

1. **Review this architecture document**
2. **Decide on implementation priority** (MLB refactor → NBA → NFL)
3. **Set up balldontlie.io API key** for NBA/NFL
4. **Create feature branch** for multi-sport development
5. **Implement Phase 1** (refactor existing MLB code)
6. **Test thoroughly** before proceeding to Phase 2

This architecture provides a solid foundation for supporting multiple sports while maintaining clean, maintainable code. The pattern-based approach ensures consistency and makes future additions straightforward.
