# NBA Data Reference Guide

## Overview

This guide documents how to access NBA.com's official stats API directly via HTTP requests. The NBA.com Stats API is **completely free** and requires **no authentication**.

**Key Benefits:**
- ✅ **Free** - No API key required
- ✅ **Official Data** - Direct from NBA.com
- ✅ **Comprehensive** - Player stats, team data, schedules, live scores, play-by-play
- ✅ **No Rate Limits** - (reasonable usage expected)
- ✅ **Historical Data** - Access to all seasons back to 1946

**Reference Implementation:**
- Python SDK: [swar/nba_api](https://github.com/swar/nba_api) (3.1k stars)
- Documentation: https://github.com/swar/nba_api/tree/master/docs

---

## Base URL

```
https://stats.nba.com/stats/
```

**Important:** All requests must include proper headers to avoid being blocked:

```typescript
const headers = {
  'Host': 'stats.nba.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
  'Connection': 'keep-alive'
};
```

---

## Core Endpoints

### 1. Player Search (Static Data)

For player search, use the `nba_api` approach: maintain a static list of players that's updated periodically.

**Static Player Data:**
```typescript
interface NBAPlayer {
  id: number;           // Player ID (e.g., 2544 for LeBron James)
  full_name: string;    // "LeBron James"
  first_name: string;   // "LeBron"
  last_name: string;    // "James"
  is_active: boolean;   // true/false
}
```

**Implementation Strategy:**
1. Use `commonallplayers` endpoint to fetch all players once
2. Cache the player list locally (updates infrequently)
3. Implement client-side search by name

**Endpoint:** `commonallplayers`
```
GET https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2024-25&IsOnlyCurrentSeason=0
```

**Parameters:**
- `LeagueID`: `00` (NBA), `10` (WNBA), `20` (G League)
- `Season`: Format `YYYY-YY` (e.g., `2024-25`)
- `IsOnlyCurrentSeason`: `0` (all players) or `1` (current season only)

**Response Structure:**
```json
{
  "resource": "commonallplayers",
  "parameters": {...},
  "resultSets": [
    {
      "name": "CommonAllPlayers",
      "headers": ["PERSON_ID", "DISPLAY_LAST_COMMA_FIRST", "DISPLAY_FIRST_LAST", "ROSTERSTATUS", "FROM_YEAR", "TO_YEAR", "PLAYERCODE", "TEAM_ID", "TEAM_CITY", "TEAM_NAME", "TEAM_ABBREVIATION", "GAMES_PLAYED_FLAG", "OTHERLEAGUE_EXPERIENCE_CH"],
      "rowSet": [
        [2544, "James, LeBron", "LeBron James", 1, "2003", "2024", "lebron_james", 1610612747, "Los Angeles", "Lakers", "LAL", "Y", ""]
        // ... more players
      ]
    }
  ]
}
```

---

### 2. Player Career Stats

**Endpoint:** `playercareerstats`
```
GET https://stats.nba.com/stats/playercareerstats?PlayerID=2544&PerMode=PerGame
```

**Parameters:**
- `PlayerID`: NBA player ID (required)
- `PerMode`: `Totals`, `PerGame`, `Per36`, `Per100Possessions`, `Per100Plays`

**Response Structure:**
```json
{
  "resource": "playercareerstats",
  "resultSets": [
    {
      "name": "SeasonTotalsRegularSeason",
      "headers": ["PLAYER_ID", "SEASON_ID", "LEAGUE_ID", "TEAM_ID", "TEAM_ABBREVIATION", "PLAYER_AGE", "GP", "GS", "MIN", "FGM", "FGA", "FG_PCT", "FG3M", "FG3A", "FG3_PCT", "FTM", "FTA", "FT_PCT", "OREB", "DREB", "REB", "AST", "STL", "BLK", "TOV", "PF", "PTS"],
      "rowSet": [
        [2544, "2023-24", "00", 1610612747, "LAL", 39, 71, 71, 35.3, 9.5, 18.5, 0.514, 1.3, 4.3, 0.302, 5.9, 8.2, 0.719, 1.0, 6.3, 7.3, 8.3, 1.3, 0.5, 3.5, 1.6, 25.7]
        // ... more seasons
      ]
    },
    {
      "name": "CareerTotalsRegularSeason",
      "headers": [...],
      "rowSet": [[...]]  // Career totals
    },
    {
      "name": "SeasonTotalsPostSeason",
      "headers": [...],
      "rowSet": [...]  // Playoff stats
    }
  ]
}
```

**Key Stats:**
- **GP**: Games Played
- **GS**: Games Started
- **MIN**: Minutes per game
- **PTS**: Points
- **REB**: Rebounds (OREB + DREB)
- **AST**: Assists
- **STL**: Steals
- **BLK**: Blocks
- **FG_PCT**: Field Goal Percentage
- **FG3_PCT**: 3-Point Percentage
- **FT_PCT**: Free Throw Percentage
- **TOV**: Turnovers
- **PF**: Personal Fouls

---

### 3. Player Game Log

Get stats for each game in a season.

**Endpoint:** `playergamelog`
```
GET https://stats.nba.com/stats/playergamelog?PlayerID=2544&Season=2024-25&SeasonType=Regular+Season
```

**Parameters:**
- `PlayerID`: NBA player ID (required)
- `Season`: Format `YYYY-YY` (required)
- `SeasonType`: `Regular Season`, `Playoffs`, `Pre Season`, `All Star`

---

### 4. Player Info

Get detailed player information.

**Endpoint:** `commonplayerinfo`
```
GET https://stats.nba.com/stats/commonplayerinfo?PlayerID=2544
```

**Response includes:**
- Player bio (height, weight, birthdate, draft info)
- Current team
- Jersey number
- Position

---

### 5. Team List

**Endpoint:** `commonteamyears`
```
GET https://stats.nba.com/stats/commonteamyears?LeagueID=00
```

**Parameters:**
- `LeagueID`: `00` (NBA)

**Response:**
```json
{
  "resultSets": [
    {
      "name": "TeamYears",
      "headers": ["LEAGUE_ID", "TEAM_ID", "MIN_YEAR", "MAX_YEAR", "ABBREVIATION", "NICKNAME", "YEARFOUNDED", "CITY", "ARENA", "ARENACAPACITY", "OWNER", "GENERALMANAGER", "HEADCOACH", "DLEAGUEAFFILIATION"],
      "rowSet": [
        ["00", 1610612747, "1948", "2024", "LAL", "Lakers", 1948, "Los Angeles", "Crypto.com Arena", 18997, "Jerry Buss Family Trusts", "Rob Pelinka", "Darvin Ham", "South Bay Lakers"]
        // ... more teams
      ]
    }
  ]
}
```

---

### 6. Schedule

**Endpoint:** `scheduleleaguev2` (v2 is simpler than v3)
```
GET https://stats.nba.com/stats/scheduleleaguev2?LeagueID=00&Season=2024-25
```

**Parameters:**
- `LeagueID`: `00` (NBA)
- `Season`: Format `YYYY-YY`

---

### 7. Live Scoreboard

**Endpoint:** `scoreboardv2`
```
GET https://stats.nba.com/stats/scoreboardv2?GameDate=2024-10-19&LeagueID=00&DayOffset=0
```

**Parameters:**
- `GameDate`: Format `YYYY-MM-DD` or `MM/DD/YYYY`
- `LeagueID`: `00` (NBA)
- `DayOffset`: `0` (today), `-1` (yesterday), `1` (tomorrow)

**Response Structure:**
```json
{
  "resultSets": [
    {
      "name": "GameHeader",
      "headers": ["GAME_DATE_EST", "GAME_SEQUENCE", "GAME_ID", "GAME_STATUS_ID", "GAME_STATUS_TEXT", "GAMECODE", "HOME_TEAM_ID", "VISITOR_TEAM_ID", "SEASON", "LIVE_PERIOD", "LIVE_PC_TIME", "NATL_TV_BROADCASTER_ABBREVIATION", "LIVE_PERIOD_TIME_BCAST", "WH_STATUS"],
      "rowSet": [...]
    },
    {
      "name": "LineScore",
      "headers": ["GAME_DATE_EST", "GAME_SEQUENCE", "GAME_ID", "TEAM_ID", "TEAM_ABBREVIATION", "TEAM_CITY_NAME", "TEAM_WINS_LOSSES", "PTS_QTR1", "PTS_QTR2", "PTS_QTR3", "PTS_QTR4", "PTS_OT1", "PTS_OT2", "PTS_OT3", "PTS_OT4", "PTS", "FG_PCT", "FT_PCT", "FG3_PCT", "AST", "REB", "TOV"],
      "rowSet": [...]
    }
  ]
}
```

---

### 8. Box Score

Get detailed stats for a specific game.

**Endpoint:** `boxscoretraditionalv2`
```
GET https://stats.nba.com/stats/boxscoretraditionalv2?GameID=0022400001&StartPeriod=0&EndPeriod=10&StartRange=0&EndRange=28800&RangeType=0
```

**Parameters:**
- `GameID`: 10-digit game ID (required)
- `StartPeriod`: `0` (all periods)
- `EndPeriod`: `10` (include OT)
- `RangeType`: `0` (entire game)

**Game ID Format:**
- `002` - Game type (00 = preseason, 002 = regular season, 004 = playoffs)
- `2400` - Season (2024-25 → 2400, 2023-24 → 2300)
- `001` - Game number

---

### 9. Play-by-Play

**Endpoint:** `playbyplayv2`
```
GET https://stats.nba.com/stats/playbyplayv2?GameID=0022400001&StartPeriod=0&EndPeriod=10
```

---

### 10. Player Comparison

**Endpoint:** `playercompare`
```
GET https://stats.nba.com/stats/playercompare?PlayerIDList=2544,201939&VsPlayerIDList=201935,203999&Season=2024-25&SeasonType=Regular+Season&PerMode=PerGame&MeasureType=Base
```

**Parameters:**
- `PlayerIDList`: Comma-separated player IDs (Team 1)
- `VsPlayerIDList`: Comma-separated player IDs (Team 2)
- `Season`: Format `YYYY-YY`
- `SeasonType`: `Regular Season`, `Playoffs`
- `PerMode`: `PerGame`, `Totals`
- `MeasureType`: `Base`, `Advanced`, `Misc`, `Four Factors`, `Scoring`, `Opponent`, `Usage`, `Defense`

---

## TypeScript Interfaces

### Player Stats
```typescript
interface NBAPlayerStats {
  // Basic Info
  PLAYER_ID: number;
  PLAYER_NAME?: string;
  SEASON_ID: string;        // "2024-25"
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  PLAYER_AGE: number;
  
  // Game Info
  GP: number;               // Games Played
  GS: number;               // Games Started
  MIN: number;              // Minutes per game
  
  // Shooting
  FGM: number;              // Field Goals Made
  FGA: number;              // Field Goals Attempted
  FG_PCT: number;           // Field Goal Percentage
  FG3M: number;             // 3-Point Field Goals Made
  FG3A: number;             // 3-Point Field Goals Attempted
  FG3_PCT: number;          // 3-Point Percentage
  FTM: number;              // Free Throws Made
  FTA: number;              // Free Throws Attempted
  FT_PCT: number;           // Free Throw Percentage
  
  // Rebounds
  OREB: number;             // Offensive Rebounds
  DREB: number;             // Defensive Rebounds
  REB: number;              // Total Rebounds
  
  // Other Stats
  AST: number;              // Assists
  STL: number;              // Steals
  BLK: number;              // Blocks
  TOV: number;              // Turnovers
  PF: number;               // Personal Fouls
  PTS: number;              // Points
}
```

### Player Info
```typescript
interface NBAPlayerInfo {
  PERSON_ID: number;
  FIRST_NAME: string;
  LAST_NAME: string;
  DISPLAY_FIRST_LAST: string;
  DISPLAY_LAST_COMMA_FIRST: string;
  DISPLAY_FI_LAST: string;
  BIRTHDATE: string;
  SCHOOL: string;
  COUNTRY: string;
  LAST_AFFILIATION: string;
  HEIGHT: string;           // "6-9"
  WEIGHT: string;           // "250"
  SEASON_EXP: number;
  JERSEY: string;
  POSITION: string;         // "F", "G", "C", "F-G", etc.
  ROSTERSTATUS: string;     // "Active", "Inactive"
  TEAM_ID: number;
  TEAM_NAME: string;
  TEAM_ABBREVIATION: string;
  TEAM_CODE: string;
  TEAM_CITY: string;
  PLAYERCODE: string;       // "lebron_james"
  FROM_YEAR: number;
  TO_YEAR: number;
  DRAFT_YEAR: string;
  DRAFT_ROUND: string;
  DRAFT_NUMBER: string;
  GREATEST_75_FLAG: string; // "Y" or "N"
}
```

### Team
```typescript
interface NBATeam {
  TEAM_ID: number;
  ABBREVIATION: string;     // "LAL"
  NICKNAME: string;         // "Lakers"
  CITY: string;            // "Los Angeles"
  YEARFOUNDED: number;
  ARENA: string;
  ARENACAPACITY: number;
  OWNER: string;
  GENERALMANAGER: string;
  HEADCOACH: string;
  DLEAGUEAFFILIATION: string;
}
```

### Game
```typescript
interface NBAGame {
  GAME_ID: string;          // "0022400001"
  GAME_DATE_EST: string;    // "2024-10-22"
  GAME_STATUS_ID: number;   // 1=scheduled, 2=in progress, 3=final
  GAME_STATUS_TEXT: string; // "Final", "Q2 7:30", "9:00 PM ET"
  HOME_TEAM_ID: number;
  VISITOR_TEAM_ID: number;
  SEASON: string;           // "2024"
  LIVE_PERIOD: number;      // Current quarter (1-4, 5+ for OT)
  LIVE_PC_TIME: string;     // Time remaining in period
  NATL_TV_BROADCASTER_ABBREVIATION: string | null;
}
```

---

## Implementation Strategy

### 1. API Client Structure

```typescript
export class NBAAPIClient extends BaseSportAPI {
  private baseUrl = 'https://stats.nba.com/stats';
  private headers = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'https://www.nba.com',
    'Referer': 'https://www.nba.com/',
    'Connection': 'keep-alive'
  };
  
  private playerCache: Map<number, NBAPlayerInfo> = new Map();
  private allPlayers: NBAPlayer[] = [];
  
  constructor() {
    super();
    this.loadPlayerCache();
  }
  
  private async loadPlayerCache() {
    // Load all players once and cache
    const response = await this.makeRequest('commonallplayers', {
      LeagueID: '00',
      Season: this.getCurrentSeason(),
      IsOnlyCurrentSeason: '0'
    });
    this.allPlayers = this.parsePlayerList(response);
  }
  
  async searchPlayers(name: string): Promise<NBAPlayer[]> {
    // Search cached player list (no API call needed)
    const searchTerm = name.toLowerCase();
    return this.allPlayers.filter(p => 
      p.full_name.toLowerCase().includes(searchTerm)
    );
  }
  
  async getPlayerStats(playerId: number, season?: string, perMode: string = 'PerGame') {
    return this.makeRequest('playercareerstats', {
      PlayerID: playerId.toString(),
      PerMode: perMode
    });
  }
  
  private async makeRequest(endpoint: string, params: Record<string, string>) {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new SportAPIError(`NBA API error: ${response.statusText}`, 'NBA_API_ERROR');
    }
    
    return response.json();
  }
  
  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // NBA season starts in October
    if (month >= 10) {
      return `${year}-${(year + 1).toString().slice(2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(2)}`;
    }
  }
  
  private parsePlayerList(response: any): NBAPlayer[] {
    const resultSet = response.resultSets[0];
    const headers = resultSet.headers;
    const rows = resultSet.rowSet;
    
    return rows.map((row: any[]) => ({
      id: row[headers.indexOf('PERSON_ID')],
      full_name: row[headers.indexOf('DISPLAY_FIRST_LAST')],
      first_name: row[headers.indexOf('DISPLAY_FIRST_LAST')].split(' ')[0],
      last_name: row[headers.indexOf('DISPLAY_FIRST_LAST')].split(' ').slice(1).join(' '),
      is_active: row[headers.indexOf('ROSTERSTATUS')] === 1
    }));
  }
}
```

---

### 2. Response Parsing Helper

NBA.com API returns data in a structured format with `resultSets`:

```typescript
function parseNBAResponse<T>(response: any, resultSetName: string = null): T[] {
  // If no resultSetName specified, use first result set
  const resultSet = resultSetName 
    ? response.resultSets.find((rs: any) => rs.name === resultSetName)
    : response.resultSets[0];
    
  if (!resultSet) {
    throw new Error(`Result set not found: ${resultSetName}`);
  }
  
  const headers = resultSet.headers;
  const rows = resultSet.rowSet;
  
  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index];
    });
    return obj as T;
  });
}

// Usage
const stats = parseNBAResponse<NBAPlayerStats>(response, 'SeasonTotalsRegularSeason');
```

---

### 3. Stat Groups for Comparisons

```typescript
export const NBA_STAT_GROUPS = {
  overall: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT'],
  scoring: ['PTS', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT'],
  playmaking: ['AST', 'TOV', 'AST_TO_RATIO'],
  rebounding: ['REB', 'OREB', 'DREB', 'OREB_PCT', 'DREB_PCT'],
  defense: ['STL', 'BLK', 'PF', 'DEF_RTG'],
  efficiency: ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT'],
  advanced: ['PER', 'TS_PCT', 'USG_PCT', 'OFF_RTG', 'DEF_RTG', 'NET_RTG', 'AST_PCT', 'BLK_PCT', 'STL_PCT']
};

export const NBA_STAT_LABELS: Record<string, string> = {
  GP: 'Games Played',
  GS: 'Games Started',
  MIN: 'Minutes',
  PTS: 'Points',
  REB: 'Rebounds',
  OREB: 'Offensive Rebounds',
  DREB: 'Defensive Rebounds',
  AST: 'Assists',
  STL: 'Steals',
  BLK: 'Blocks',
  TOV: 'Turnovers',
  PF: 'Personal Fouls',
  FGM: 'Field Goals Made',
  FGA: 'Field Goals Attempted',
  FG_PCT: 'FG%',
  FG3M: '3-Pointers Made',
  FG3A: '3-Pointers Attempted',
  FG3_PCT: '3P%',
  FTM: 'Free Throws Made',
  FTA: 'Free Throws Attempted',
  FT_PCT: 'FT%',
  // Advanced stats
  PER: 'Player Efficiency Rating',
  TS_PCT: 'True Shooting %',
  EFG_PCT: 'Effective FG%',
  USG_PCT: 'Usage Rate',
  OFF_RTG: 'Offensive Rating',
  DEF_RTG: 'Defensive Rating',
  NET_RTG: 'Net Rating'
};
```

---

## Important Notes

### Rate Limiting
- NBA.com doesn't publish official rate limits
- **Best practice:** Add 0.6-1 second delay between requests
- Cache aggressively (especially player lists and team data)
- Avoid hammering the API during live games

### Headers Are Critical
- **Must include proper browser headers** or requests will be blocked
- The `Referer` and `Origin` headers are particularly important
- User-Agent should look like a real browser

### Season Format
- Regular Season: `YYYY-YY` (e.g., `2024-25`)
- Always use 2-digit year for second part
- Season starts in October, ends in April (playoffs through June)

### Game IDs
- Format: `00XYYYYNNNN`
  - `00` = prefix
  - `X` = game type (0=preseason, 2=regular, 4=playoffs)
  - `YYYY` = season year (2024-25 = 2400)
  - `NNNN` = game number

### Player IDs
- Permanent IDs (don't change)
- Some famous examples:
  - LeBron James: `2544`
  - Stephen Curry: `201939`
  - Kevin Durant: `201142`
  - Giannis Antetokounmpo: `203507`
  - Nikola Jokić: `203999`

---

## Example API Calls

### Search for a Player
```bash
# Get all players (do this once and cache)
curl 'https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2024-25&IsOnlyCurrentSeason=0' \
  -H 'Host: stats.nba.com' \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Referer: https://www.nba.com/'
```

### Get Player Career Stats
```bash
curl 'https://stats.nba.com/stats/playercareerstats?PlayerID=2544&PerMode=PerGame' \
  -H 'Host: stats.nba.com' \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Referer: https://www.nba.com/'
```

### Get Today's Games
```bash
curl 'https://stats.nba.com/stats/scoreboardv2?GameDate=2024-10-19&LeagueID=00&DayOffset=0' \
  -H 'Host: stats.nba.com' \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Referer: https://www.nba.com/'
```

---

## Testing Strategy

### 1. Unit Tests
```typescript
describe('NBAAPIClient', () => {
  it('should search players by name', async () => {
    const api = new NBAAPIClient();
    const players = await api.searchPlayers('LeBron James');
    expect(players).toHaveLength(1);
    expect(players[0].full_name).toBe('LeBron James');
    expect(players[0].id).toBe(2544);
  });
  
  it('should get player career stats', async () => {
    const api = new NBAAPIClient();
    const stats = await api.getPlayerStats(2544, '2024-25', 'PerGame');
    expect(stats).toHaveProperty('SeasonTotalsRegularSeason');
  });
});
```

### 2. Integration Tests
```bash
# Test with real players
node -e "
const { NBAAPIClient } = require('./build/api/nba-api.js');
const api = new NBAAPIClient();
api.searchPlayers('Stephen Curry').then(console.log);
"
```

---

## Migration from balldontlie

### Key Differences

| Feature | balldontlie | nba_api (NBA.com) |
|---------|------------|-------------------|
| Authentication | API key required | No auth needed |
| Cost | Free tier limited | Completely free |
| Rate Limits | 10 req/min (free) | Reasonable usage |
| Data Source | Third-party | Official NBA.com |
| Historical Data | Limited | Complete (1946+) |
| Advanced Stats | Basic | Comprehensive |
| Live Data | Limited | Full scoreboard |

### Code Changes Needed

1. **Remove API Key**: No environment variable needed
2. **Add Headers**: Must include browser-like headers
3. **Response Format**: Parse `resultSets` structure instead of direct JSON
4. **Player Search**: Client-side search on cached list instead of API endpoint
5. **Season Format**: Use `YYYY-YY` instead of just `YYYY`

---

## Additional Resources

- **NBA Stats API Documentation:** https://github.com/swar/nba_api/tree/master/docs
- **Python SDK (nba_api):** https://github.com/swar/nba_api
- **Endpoint List:** https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints
- **Static Players Module:** https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/static/players.md
- **Example Notebooks:** https://github.com/swar/nba_api/tree/master/docs/examples

---

## Summary

The NBA.com Stats API (accessed via HTTP) is the **best free option** for NBA data:

✅ **Pros:**
- Completely free, no API key
- Official data source
- Comprehensive stats (basic + advanced)
- Historical data back to 1946
- Live scores and play-by-play
- No strict rate limits

⚠️ **Considerations:**
- Must include proper HTTP headers
- Response format requires parsing `resultSets`
- Need to cache player list for search functionality
- Add delays between requests for politeness

**Recommendation:** Use this over balldontlie for superior free access to official NBA data.
