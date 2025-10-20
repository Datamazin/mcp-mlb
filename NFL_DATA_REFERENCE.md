# NFL Data Reference - ESPN API

## Date: October 19, 2025
## Source: ESPN NFL API (Public)

---

## 🏈 Overview

ESPN provides free, public APIs for NFL data including teams, players, scores, schedules, and statistics.

**Base URL**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl`  
**Authentication**: None required (public API)  
**Format**: JSON  
**Rate Limits**: None documented (be respectful)

---

## 📊 ESPN NFL API Endpoints

> **Reference**: This documentation is based on the comprehensive [ESPN API Gist by nntrn](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c)

**Base URLs**:
- `https://site.api.espn.com/apis/site/v2/sports/football/nfl` - Site API (v2)
- `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl` - Core API (v2)
- `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl` - Web API (v3)

---

### 1. Teams - Get All NFL Teams
**Endpoint**: `/teams`  
**Full URL**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`

**Response Structure**:
```json
{
  "sports": [{
    "leagues": [{
      "teams": [{
        "team": {
          "id": "12",
          "uid": "s:20~l:28~t:12",
          "slug": "kansas-city-chiefs",
          "location": "Kansas City",
          "name": "Chiefs",
          "abbreviation": "KC",
          "displayName": "Kansas City Chiefs",
          "shortDisplayName": "Chiefs",
          "color": "e31837",
          "alternateColor": "ffb612",
          "isActive": true,
          "logos": [{
            "href": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
            "width": 500,
            "height": 500
          }]
        }
      }]
    }]
  }]
}
```

**Key Fields**:
- `id` - Team ID (1-34, used for other API calls)
- `abbreviation` - 3-letter code (KC, BUF, etc.)
- `displayName` - Full team name
- `logos` - Team logo URLs at various sizes

**Usage**: Get all 32 NFL teams with IDs for subsequent API calls

**Alternative URLs**:
- Core API: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams?limit=32`
- Detailed Roster: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}?enable=roster,projection,stats`

---

### 2. Team Roster - Get Players by Team
**Endpoint**: `/teams/{teamId}/roster`  
**Example**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/roster`

**Response Structure**:
```json
{
  "team": {
    "id": "12",
    "abbreviation": "KC",
    "displayName": "Kansas City Chiefs"
  },
  "athletes": [{
    "position": "Quarterback",
    "items": [{
      "id": "3139477",
      "uid": "s:20~l:28~a:3139477",
      "displayName": "Patrick Mahomes",
      "shortName": "P. Mahomes",
      "weight": 225,
      "displayWeight": "225 lbs",
      "height": 74,
      "displayHeight": "6' 2\"",
      "age": 29,
      "dateOfBirth": "1995-09-17T07:00Z",
      "jersey": "15",
      "position": {
        "name": "Quarterback",
        "displayName": "Quarterback",
        "abbreviation": "QB"
      },
      "headshot": {
        "href": "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png"
      },
      "experience": {
        "years": 7
      }
    }]
  }]
}
```

**Usage**: 
- Get team rosters (~53 players per team)
- Build player search index (cache all rosters)
- Position-based queries

**Alternative URLs**:
- Core API by Season: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/teams/{id}/athletes?limit=200`
- Depth Charts: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/teams/{id}/depthcharts`

---

### 3. Player Details - Get Individual Player Info
**Endpoint**: `/athletes/{playerId}`  
**Example**: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/3139477`

**Response Structure**:
```json
{
  "athlete": {
    "id": "3139477",
    "uid": "s:20~l:28~a:3139477",
    "displayName": "Patrick Mahomes",
    "fullName": "Patrick Lavon Mahomes II",
    "firstName": "Patrick",
    "lastName": "Mahomes",
    "position": {
      "name": "Quarterback",
      "abbreviation": "QB"
    },
    "jersey": "15",
    "team": {
      "id": "12",
      "abbreviation": "KC",
      "displayName": "Kansas City Chiefs"
    },
    "birth": {
      "date": "1995-09-17T07:00Z",
      "city": "Tyler",
      "state": "Texas",
      "country": "USA"
    },
    "college": {
      "name": "Texas Tech",
      "mascot": "Red Raiders"
    },
    "height": 74,
    "weight": 225,
    "experience": {
      "years": 7
    },
    "headshot": {
      "href": "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png"
    },
    "statistics": [{
      "name": "careerStats",
      "displayName": "Career Stats",
      "labels": ["GP", "COMP", "ATT", "YDS", "TD", "INT", "QBR"],
      "descriptions": ["Games Played", "Completions", "Attempts", "Yards", "Touchdowns", "Interceptions", "QB Rating"],
      "totals": [99, 2241, 3443, 28424, 219, 63, 103.8]
    }]
  }
}
```

**Usage**:
- Player profile information
- Career statistics
- Bio information (college, birth, etc.)

**Additional Player Endpoints**:
- ⭐ **Player Overview**: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/overview`
- ⭐ **Gamelog**: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/gamelog`
- ⭐ **Splits**: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/splits`
- **Event Log** (stats per game): `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/athletes/{id}/eventlog`
- **All Active Players**: `https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true`
- **Search Players**: `https://site.web.api.espn.com/apis/common/v3/search?query={name}&limit=100`

---

### 4. Scoreboard - Get Games and Scores
**Endpoint**: `/scoreboard`  
**Full URL**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20241013`

**Parameters**:
- `dates` - YYYYMMDD format (e.g., 20241013 for Oct 13, 2024)
- `limit` - Number of games to return (optional)
- `seasontype` - 1=Preseason, 2=Regular Season, 3=Postseason

**Response Structure**:
```json
{
  "leagues": [{
    "name": "National Football League",
    "abbreviation": "NFL"
  }],
  "season": {
    "year": 2024,
    "type": 2
  },
  "week": {
    "number": 6,
    "text": "Week 6"
  },
  "events": [{
    "id": "401671716",
    "uid": "s:20~l:28~e:401671716",
    "date": "2024-10-13T17:00Z",
    "name": "Kansas City Chiefs at San Francisco 49ers",
    "shortName": "KC @ SF",
    "competitions": [{
      "id": "401671716",
      "uid": "s:20~l:28~e:401671716~c:401671716",
      "date": "2024-10-13T17:00Z",
      "attendance": 70000,
      "status": {
        "type": {
          "id": "3",
          "name": "STATUS_FINAL",
          "state": "post",
          "completed": true
        }
      },
      "competitors": [{
        "id": "12",
        "uid": "s:20~l:28~t:12",
        "type": "team",
        "order": 0,
        "homeAway": "away",
        "team": {
          "id": "12",
          "abbreviation": "KC",
          "displayName": "Kansas City Chiefs",
          "shortDisplayName": "Chiefs",
          "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
        },
        "score": "28",
        "linescores": [
          {"value": 7},
          {"value": 7},
          {"value": 7},
          {"value": 7}
        ],
        "statistics": [{
          "name": "firstDowns",
          "displayValue": "21"
        }]
      }, {
        "id": "25",
        "homeAway": "home",
        "team": {
          "id": "25",
          "abbreviation": "SF",
          "displayName": "San Francisco 49ers"
        },
        "score": "18"
      }],
      "situation": {
        "lastPlay": {
          "text": "Game ended"
        }
      }
    }]
  }]
}
```

**Usage**:
- Get games by date
- Live scores during games
- Final scores after games
- Weekly schedule

**Additional Game Endpoints**:
- ⭐ **Game Summary**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={eventId}`
- **Play by Play**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{id}/competitions/{id}/plays?limit=300`
- **Drives**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{id}/competitions/{id}/drives`
- **Win Probabilities**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{id}/competitions/{id}/probabilities?limit=200`
- **XHR Scoreboard**: `https://cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50`

---

### 5. Standings - Division and Conference Standings
**Endpoint**: `/standings`  
**Full URL**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings`

**Parameters**:
- `season` - Year (e.g., 2024) (optional)
- `group` - 1=AFC, 2=NFC (optional)

**Response Structure**:
```json
{
  "uid": "s:20~l:28~g:9",
  "id": "9",
  "name": "National Football League",
  "abbreviation": "NFL",
  "children": [{
    "uid": "s:20~l:28~g:9~d:1",
    "id": "1",
    "name": "AFC East",
    "abbreviation": "AFC East",
    "standings": {
      "entries": [{
        "team": {
          "id": "2",
          "abbreviation": "BUF",
          "displayName": "Buffalo Bills",
          "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png"
        },
        "stats": [
          {"name": "wins", "displayName": "Wins", "value": 10},
          {"name": "losses", "displayName": "Losses", "value": 3},
          {"name": "winPercent", "displayName": "Win %", "value": 0.769},
          {"name": "gamesBehind", "displayName": "GB", "value": 0.0},
          {"name": "pointsFor", "displayName": "PF", "value": 345},
          {"name": "pointsAgainst", "displayName": "PA", "value": 232},
          {"name": "differential", "displayName": "DIFF", "value": 113}
        ]
      }]
    }
  }]
}
```

**Usage**:
- Division standings
- Conference standings
- Win-loss records
- Points for/against

**Alternative Standings URLs**:
- **XHR Standings**: `https://cdn.espn.com/core/nfl/standings?xhr=1`
- **Group Standings** (by division/conference): `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/{seasonType}/groups/{groupId}/standings`
  - AFC (groupId=8), NFC (groupId=7)

---

### 6. Additional Important Endpoints

**Schedule**:
- **Team Schedule**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}/schedule?season={year}`
- **Weekly Events**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/{seasonType}/weeks/{week}/events`
- **XHR Schedule**: `https://cdn.espn.com/core/nfl/schedule?xhr=1&year={year}&week={week}`

**Special Game Days**:
- **Monday Night Football**: `https://site.api.espn.com/apis/site/v2/mondaynightfootball`
- **Thursday Night Football**: `https://site.api.espn.com/apis/site/v2/thursdaynightfootball`
- **Sunday Night Football**: `https://site.api.espn.com/apis/site/v2/sundaynightfootball`

**Leaders & Statistics**:
- **Current Leaders**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders`
- **Season Leaders**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/{seasonType}/leaders`
- **QBR Weekly**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/2/weeks/{week}/qbr/10000?limit=100`

**News**:
- **NFL News**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50`
- **Team News**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team={teamId}`

**Injuries**:
- **Team Injuries**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/{id}/injuries?limit=100`
- **Site Injuries API**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries?team={abbrev}`

**Other**:
- **Transactions**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/transactions`
- **Draft**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/draft`
- **Free Agents**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/freeagents`

---

## 🗺️ NFL Team ID Mapping

```typescript
const NFL_TEAMS: { [key: string]: number } = {
  // AFC East
  'bills': 2,
  'dolphins': 15,
  'patriots': 17,
  'jets': 20,
  
  // AFC North
  'ravens': 33,
  'bengals': 4,
  'browns': 5,
  'steelers': 23,
  
  // AFC South
  'texans': 34,
  'colts': 11,
  'jaguars': 30,
  'titans': 10,
  
  // AFC West
  'broncos': 7,
  'chiefs': 12,
  'raiders': 13,
  'chargers': 24,
  
  // NFC East
  'cowboys': 6,
  'giants': 19,
  'eagles': 21,
  'commanders': 28,
  
  // NFC North
  'bears': 3,
  'lions': 8,
  'packers': 9,
  'vikings': 16,
  
  // NFC South
  'falcons': 1,
  'panthers': 29,
  'saints': 18,
  'buccaneers': 27,
  
  // NFC West
  'cardinals': 22,
  'rams': 14,
  '49ers': 25,
  'seahawks': 26
};
```

---

## 🏗️ Implementation Strategy for Phase 3

### NFLAPIClient Structure
```typescript
export class NFLAPIClient extends BaseSportAPI {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  private playerCache: BasePlayer[] | null = null;
  private cacheExpiry: number | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  // Required BaseSportAPI methods
  async searchPlayers(query: string, activeStatus?: string): Promise<BasePlayer[]> {
    // Load all team rosters, cache for 24h, search client-side
    if (!this.playerCache || !this.cacheExpiry || Date.now() > this.cacheExpiry) {
      await this.loadPlayerCache();
    }
    return this.searchInCache(query);
  }
  
  async getPlayerStats(playerId: string | number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/athletes/${playerId}`);
    return await response.json();
  }
  
  async getTeams(): Promise<BaseTeam[]> {
    const response = await fetch(`${this.baseUrl}/teams`);
    const data = await response.json();
    return this.parseTeams(data);
  }
  
  async getTeamInfo(teamId: string | number): Promise<BaseTeam> {
    const response = await fetch(`${this.baseUrl}/teams/${teamId}`);
    return await response.json();
  }
  
  async getSchedule(params: BaseScheduleParams): Promise<BaseGame[]> {
    const dateStr = this.formatDate(params.startDate);
    const response = await fetch(`${this.baseUrl}/scoreboard?dates=${dateStr}`);
    const data = await response.json();
    return this.parseGames(data);
  }
  
  async getGame(gameId: string | number): Promise<BaseGame> {
    // Game details available in scoreboard endpoint
    const response = await fetch(`${this.baseUrl}/scoreboard`);
    const data = await response.json();
    return this.findGame(data, gameId);
  }
  
  async getPlayerInfo(playerId: string | number): Promise<BasePlayer> {
    return await this.getPlayerStats(playerId);
  }
  
  // NFL-specific methods
  async getScoreboard(date: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/scoreboard?dates=${date}`);
    return await response.json();
  }
  
  async getStandings(season?: number, conference?: number): Promise<any> {
    let url = `${this.baseUrl}/standings`;
    const params = [];
    if (season) params.push(`season=${season}`);
    if (conference) params.push(`group=${conference}`);
    if (params.length) url += `?${params.join('&')}`;
    
    const response = await fetch(url);
    return await response.json();
  }
  
  async getTeamRoster(teamId: string | number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/roster`);
    return await response.json();
  }
  
  private async loadPlayerCache(): Promise<void> {
    const teams = await this.getTeams();
    const players: BasePlayer[] = [];
    
    for (const team of teams) {
      const roster = await this.getTeamRoster(team.id);
      players.push(...this.parseRoster(roster, team));
    }
    
    this.playerCache = players;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }
  
  private formatDate(date: string): string {
    // Convert YYYY-MM-DD to YYYYMMDD
    return date.replace(/-/g, '');
  }
}
```

---

## 📊 NFL Comparison Metrics by Position

### Quarterbacks
```typescript
const qbMetrics: ComparisonMetric[] = [
  { key: 'completions', name: 'Completions', higherIsBetter: true },
  { key: 'attempts', name: 'Attempts', higherIsBetter: true },
  { key: 'passingYards', name: 'Passing Yards', higherIsBetter: true },
  { key: 'passingTDs', name: 'Passing TDs', higherIsBetter: true },
  { key: 'interceptions', name: 'Interceptions', higherIsBetter: false },
  { key: 'completionPct', name: 'Completion %', higherIsBetter: true },
  { key: 'qbRating', name: 'QB Rating', higherIsBetter: true },
  { key: 'rushingYards', name: 'Rushing Yards', higherIsBetter: true }
];
```

### Running Backs
```typescript
const rbMetrics: ComparisonMetric[] = [
  { key: 'rushingYards', name: 'Rushing Yards', higherIsBetter: true },
  { key: 'rushingTDs', name: 'Rushing TDs', higherIsBetter: true },
  { key: 'yardsPerCarry', name: 'Yards/Carry', higherIsBetter: true },
  { key: 'receptions', name: 'Receptions', higherIsBetter: true },
  { key: 'receivingYards', name: 'Receiving Yards', higherIsBetter: true },
  { key: 'fumbles', name: 'Fumbles', higherIsBetter: false }
];
```

### Wide Receivers / Tight Ends
```typescript
const wrMetrics: ComparisonMetric[] = [
  { key: 'receptions', name: 'Receptions', higherIsBetter: true },
  { key: 'receivingYards', name: 'Receiving Yards', higherIsBetter: true },
  { key: 'receivingTDs', name: 'Receiving TDs', higherIsBetter: true },
  { key: 'yardsPerReception', name: 'Yards/Reception', higherIsBetter: true },
  { key: 'targets', name: 'Targets', higherIsBetter: true },
  { key: 'catchPct', name: 'Catch %', higherIsBetter: true }
];
```

### Defensive Players
```typescript
const defMetrics: ComparisonMetric[] = [
  { key: 'tackles', name: 'Tackles', higherIsBetter: true },
  { key: 'sacks', name: 'Sacks', higherIsBetter: true },
  { key: 'interceptions', name: 'Interceptions', higherIsBetter: true },
  { key: 'forcedFumbles', name: 'Forced Fumbles', higherIsBetter: true },
  { key: 'passesDefended', name: 'Passes Defended', higherIsBetter: true }
];
```

---

## 🧪 Example API Calls

### Get All Teams
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams"
```

### Get Chiefs Roster (with detailed info)
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12?enable=roster,projection,stats"
```

### Get Patrick Mahomes Overview (comprehensive)
```bash
curl "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/3139477/overview"
```

### Get Patrick Mahomes Gamelog
```bash
curl "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/3139477/gamelog"
```

### Get Scoreboard for Oct 13, 2024
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20241013"
```

### Get Scoreboard for Week 6, 2024
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=6"
```

### Get Game Summary (detailed)
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401671716"
```

### Get Play-by-Play
```bash
curl "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671716/competitions/401671716/plays?limit=300"
```

### Get Current Standings
```bash
curl "https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings"
```

### Get AFC Standings Only
```bash
curl "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/groups/8/standings"
```

### Search for Players
```bash
curl "https://site.web.api.espn.com/apis/common/v3/search?query=mahomes&limit=10"
```

### Get All Active Players
```bash
curl "https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true"
```

### Get Season Leaders
```bash
curl "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/leaders"
```

### Get QBR for Week 6
```bash
curl "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/weeks/6/qbr/10000?limit=100"
```

---

## 📋 Phase 3 Implementation Checklist

1. ✅ Research ESPN NFL API endpoints (comprehensive gist referenced)
2. 📋 Create `src/api/nfl-api.ts` extending BaseSportAPI
3. 📋 Implement team loading (32 teams)
   - Use: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
4. 📋 Implement roster caching (~1,700 total players)
   - Use: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}/roster`
   - Or: `https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true`
5. 📋 Implement player search (client-side from cache or use search API)
   - Search API: `https://site.web.api.espn.com/apis/common/v3/search?query={name}`
6. 📋 Implement player stats retrieval
   - Overview: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/overview`
   - Gamelog: `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}/gamelog`
7. 📋 Implement schedule/scoreboard
   - Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates={date}`
   - Weekly: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/2/weeks/{week}/events`
8. 📋 Create `src/comparison/nfl-comparison.ts` extending BaseComparison
9. 📋 Add position-specific comparison metrics (QB/RB/WR/TE/DEF)
10. 📋 Update `SportAPIFactory` to include NFL
11. 📋 Update `ComparisonFactory` to include NFL
12. 📋 Create comprehensive test suite (`test-nfl-api.cjs`)
13. 📋 Update universal MCP tools to support NFL
14. 📋 Create NFL-specific tools:
    - get-nfl-weekly-schedule
    - get-nfl-prime-time-games (MNF/TNF/SNF)
    - get-nfl-injuries
    - get-nfl-qbr-leaders
15. 📋 Documentation and examples

---

## 🎯 Key Advantages of ESPN NFL API

1. ✅ **Free and Public** - No authentication required
2. ✅ **Real-time Data** - Live scores and updates
3. ✅ **Comprehensive** - Teams, players, stats, schedules
4. ✅ **JSON Format** - Same as MLB/NBA APIs
5. ✅ **Reliable** - ESPN's production API
6. ✅ **No Rate Limits** - (within reason)
7. ✅ **Similar Patterns** - Easy to implement after MLB/NBA

---

## ⚠️ Considerations

1. **No Direct Player Search** - Must build from rosters (like NBA)
2. **Position-Specific Stats** - QB ≠ RB ≠ WR stats
3. **Week-Based Schedule** - Different from MLB/NBA date-based
4. **Smaller Roster** - ~53 active players per team
5. **Stat Parsing** - Statistics embedded in player objects
6. **Game Status** - Need to handle scheduled, live, final states

---

## 📈 Estimated Effort

**Time**: 3-4 days  
**Complexity**: Medium (similar to NBA)  
**Dependencies**: Phase 4 universal tools complete  
**Test Coverage**: 10+ tests (similar to NBA/MLB)

---

## � API Parameters Reference

### Season Types
- `1` - Preseason
- `2` - Regular Season
- `3` - Postseason
- `4` - Off-season

### Conference/Group IDs
- `7` - NFC
- `8` - AFC

### Week Numbers
- Regular Season: 1-18
- Playoffs: Wild Card (19), Divisional (20), Conference Championship (21), Super Bowl (22)

### Game Status Types
```typescript
type GameStatus = 
  | "STATUS_SCHEDULED"
  | "STATUS_IN_PROGRESS"
  | "STATUS_HALFTIME"
  | "STATUS_END_PERIOD"
  | "STATUS_FINAL"
  | "STATUS_DELAYED"
  | "STATUS_POSTPONED";
```

---

## �🔗 Resources

- ⭐ **ESPN NFL API Gist** (comprehensive): https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
- **ESPN NFL**: https://www.espn.com/nfl/
- **NFL Official Site**: https://www.nfl.com/
- **Pro Football Reference**: https://www.pro-football-reference.com/
- **ESPN Hidden API Endpoints**: https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b

---

## 💡 Key Implementation Notes

1. **Player Search Strategy**:
   - Option A: Load all rosters on startup (1,700+ players), cache 24h
   - Option B: Use search API: `https://site.web.api.espn.com/apis/common/v3/search?query={name}`
   - Recommendation: Use search API for initial query, then load full roster for that team

2. **Position-Specific Stats**:
   - QB stats ≠ RB stats ≠ WR stats
   - Need to handle different stat types based on player position
   - Use `splits` endpoint for detailed positional breakdowns

3. **Week-Based Schedule**:
   - NFL uses weeks (1-18 + playoffs), not dates like MLB
   - Need to map dates to weeks for universal interface
   - Current week can be determined from scoreboard API

4. **Game Status Handling**:
   - Live games: poll every 10-30 seconds for updates
   - Use XHR endpoints for faster response times during games
   - Play-by-play available with up to 300 plays per call

5. **Caching Strategy**:
   - Teams: cache indefinitely (rarely changes)
   - Rosters: cache 24h (changes mid-season)
   - Schedules: cache until game starts
   - Live scores: no caching (real-time)
   - Player stats: cache 1h (updated after games)

---

**Status**: 📋 Ready for Phase 3 implementation  
**Next Steps**: Complete Phase 4 universal tools, then implement NFL support  
**Documentation**: Comprehensive ESPN API reference integrated ✅

🏈 **Let's add NFL to the multi-sport MCP server!**
