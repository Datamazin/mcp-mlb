# Phase 2: NBA Implementation - Ready to Start

## Status: Phase 1 Complete ✅ | Phase 2 Ready to Begin

---

## Phase 1 Completion Summary

### What Was Accomplished
- ✅ Created `BaseSportAPI` abstract class (src/api/base-api.ts)
- ✅ Created `BaseComparison` abstract class (src/comparison/base-comparison.ts)
- ✅ Refactored MLB API to extend BaseSportAPI (src/api/mlb-api.ts)
- ✅ Refactored MLB comparison to extend BaseComparison (src/comparison/mlb-comparison.ts)
- ✅ Comprehensive test suite: 8/8 tests passing
- ✅ 100% backwards compatibility verified
- ✅ Documentation: PHASE1_VERIFICATION_REPORT.md

### Test Results
```
Total Tests: 8
✅ Passed: 8
❌ Failed: 0
Success Rate: 100%
```

### Git Status
- Branch: `multi-sport-mcp`
- Commits: 3 (refactoring + tests + docs)
- Ready to merge or continue

---

## Phase 2: NBA Implementation Plan

### Objective
Implement NBA.com Stats API support using the base architecture established in Phase 1.

### NBA API Details
- **Base URL**: `https://stats.nba.com/stats`
- **Auth**: None required (free API)
- **Headers**: Requires browser-like headers (User-Agent, Referer, Origin)
- **Data Format**: `resultSets` array with `headers` and `rowSet`
- **Player Search**: Client-side filtering (load all players, cache 24h)
- **Documentation**: NBA_DATA_REFERENCE.md (600+ lines, complete)

### Files to Create

#### 1. `src/api/nba-api.ts` (NEW)
**Purpose**: NBA API client extending BaseSportAPI

**Key Components**:
```typescript
export class NBAAPIClient extends BaseSportAPI {
  // Required headers for NBA.com
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0...',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
  };
  
  // Player caching (24h TTL)
  private playerCache: NBAPlayer[] | null = null;
  private cacheExpiry: number | null = null;
  
  // Implement BaseSportAPI methods
  async searchPlayers(name: string): Promise<BasePlayer[]>
  async getPlayerStats(playerId: string | number): Promise<any>
  async getTeams(): Promise<BaseTeam[]>
  async getTeamInfo(teamId: string | number): Promise<BaseTeam>
  async getSchedule(params: BaseScheduleParams): Promise<BaseGame[]>
  async getGame(gameId: string | number): Promise<BaseGame>
  async getPlayerInfo(playerId: string | number): Promise<BasePlayer>
  
  // NBA-specific methods
  async searchNBAPlayers(query: string, activeOnly?: boolean): Promise<NBAPlayer[]>
  async getCareerStats(playerId: string | number): Promise<NBACareerStats>
  async getTodaysGames(): Promise<NBAGame[]>
}
```

**NBA-Specific Types**:
```typescript
export interface NBAPlayer extends BasePlayer {
  isActive: boolean;
  fromYear: number;
  toYear: number;
  position?: string;
  jerseyNumber?: string;
}

export interface NBAPlayerStats {
  playerId: string;
  season: string;
  // Overall
  gp: number;        // Games played
  min: number;       // Minutes
  pts: number;       // Points
  // Scoring
  fgm: number;       // Field goals made
  fga: number;       // Field goals attempted
  fg_pct: number;    // FG%
  fg3m: number;      // 3-pointers made
  fg3a: number;      // 3-pointers attempted
  fg3_pct: number;   // 3P%
  ftm: number;       // Free throws made
  fta: number;       // Free throws attempted
  ft_pct: number;    // FT%
  // Playmaking
  ast: number;       // Assists
  tov: number;       // Turnovers
  // Defense
  stl: number;       // Steals
  blk: number;       // Blocks
  pf: number;        // Personal fouls
  // Rebounding
  reb: number;       // Total rebounds
  oreb: number;      // Offensive rebounds
  dreb: number;      // Defensive rebounds
}
```

**Key Endpoints**:
- `commonallplayers` - Load all players (for caching)
- `playercareerstats` - Get player career/season stats
- `commonplayerinfo` - Get player details
- `commonteamyears` - Get all teams
- `teaminfocommon` - Get team details
- `scoreboardv2` - Get games/schedule
- `boxscoresummaryv2` - Get game details

**Response Parsing**:
```typescript
// NBA.com returns data in resultSets format
{
  "resultSets": [
    {
      "headers": ["PERSON_ID", "DISPLAY_FIRST_LAST", ...],
      "rowSet": [
        [203999, "Nikola Jokic", ...],
        [2544, "LeBron James", ...]
      ]
    }
  ]
}

// Parse to object array
private parseResultSet<T>(resultSet: { headers: string[]; rowSet: any[][] }): T[] {
  return resultSet.rowSet.map(row => {
    const obj: any = {};
    resultSet.headers.forEach((header, index) => {
      obj[header.toLowerCase()] = row[index];
    });
    return obj as T;
  });
}
```

#### 2. `src/comparison/nba-comparison.ts` (NEW)
**Purpose**: NBA player comparison extending BaseComparison

**Key Components**:
```typescript
export class NBAComparison extends BaseComparison {
  constructor() {
    super(new NBAAPIClient());
  }
  
  // Implement abstract methods
  protected extractStats(data: any): Record<string, number> {
    // Extract stats from NBAPlayerStats
  }
  
  protected getMetrics(): ComparisonMetric[] {
    return [
      // Overall
      { key: 'pts', name: 'Points', higherIsBetter: true },
      { key: 'gp', name: 'Games Played', higherIsBetter: true },
      
      // Scoring
      { key: 'fg_pct', name: 'FG%', higherIsBetter: true, isPercentage: true },
      { key: 'fg3_pct', name: '3P%', higherIsBetter: true, isPercentage: true },
      { key: 'ft_pct', name: 'FT%', higherIsBetter: true, isPercentage: true },
      
      // Playmaking
      { key: 'ast', name: 'Assists', higherIsBetter: true },
      { key: 'tov', name: 'Turnovers', higherIsBetter: false },
      
      // Defense
      { key: 'stl', name: 'Steals', higherIsBetter: true },
      { key: 'blk', name: 'Blocks', higherIsBetter: true },
      
      // Rebounding
      { key: 'reb', name: 'Rebounds', higherIsBetter: true },
      { key: 'oreb', name: 'Offensive Rebounds', higherIsBetter: true },
      { key: 'dreb', name: 'Defensive Rebounds', higherIsBetter: true },
    ];
  }
  
  protected getPlayerName(stats: any): string {
    return `${stats.firstName} ${stats.lastName}`;
  }
}
```

**Stat Groups**:
- **Overall**: Points, Games, Minutes
- **Scoring**: FG%, 3P%, FT%, FGM, 3PM, FTM
- **Playmaking**: Assists, Turnovers, Assist/TO ratio
- **Defense**: Steals, Blocks, Personal Fouls
- **Rebounding**: Total, Offensive, Defensive
- **Efficiency**: PER, True Shooting %, Plus/Minus (if available)

#### 3. `test-nba-implementation.cjs` (NEW)
**Purpose**: Test suite for NBA implementation

**Tests**:
1. ✅ Search NBA players
2. ✅ Get player stats (LeBron James)
3. ✅ Get all NBA teams
4. ✅ Get team info (Lakers)
5. ✅ NBA player comparison (LeBron vs Jordan)
6. ✅ Get today's NBA games
7. ✅ Player caching works
8. ✅ BaseSportAPI interface compliance

#### 4. `compare-nba-players.cjs` (NEW)
**Purpose**: Example script for comparing NBA players

```javascript
// Usage: node compare-nba-players.cjs "LeBron James" "Michael Jordan"
const { NBAComparison } = require('./build/comparison/nba-comparison.js');

async function main() {
  const player1Name = process.argv[2];
  const player2Name = process.argv[3];
  
  const comparison = new NBAComparison();
  const result = await comparison.comparePlayers(player1Name, player2Name, {
    statGroups: ['overall', 'scoring', 'playmaking', 'defense', 'rebounding']
  });
  
  console.log(comparison.formatComparisonResult(result));
}

main();
```

---

## Implementation Steps

### Step 1: Create NBA API Client (2-3 hours)
1. Create `src/api/nba-api.ts`
2. Implement `NBAAPIClient` class extending `BaseSportAPI`
3. Add NBA-specific headers
4. Implement player caching mechanism
5. Implement all abstract methods from BaseSportAPI
6. Add NBA-specific helper methods
7. Handle NBA.com's `resultSets` response format
8. Build TypeScript (`npm run build`)

### Step 2: Create NBA Comparison (1-2 hours)
1. Create `src/comparison/nba-comparison.ts`
2. Implement `NBAComparison` class extending `BaseComparison`
3. Define NBA stat groups (overall, scoring, playmaking, defense, rebounding)
4. Implement abstract methods (extractStats, getMetrics, getPlayerName)
5. Add NBA-specific formatting
6. Build TypeScript (`npm run build`)

### Step 3: Create Test Suite (1 hour)
1. Create `test-nba-implementation.cjs`
2. Write 8 comprehensive tests
3. Test BaseSportAPI interface compliance
4. Test NBA-specific functionality
5. Verify player caching
6. Run tests: `node test-nba-implementation.cjs`

### Step 4: Create Example Script (30 min)
1. Create `compare-nba-players.cjs`
2. Use NBAComparison class
3. Format output similar to MLB
4. Test with LeBron vs Jordan
5. Document usage

### Step 5: Documentation (30 min)
1. Update IMPLEMENTATION_ROADMAP.md
2. Create PHASE2_COMPLETION_REPORT.md
3. Add NBA examples to README.md
4. Document known issues/limitations

---

## NBA.com API Quirks to Handle

### 1. Headers are Critical
NBA.com blocks requests without proper browser headers. Must include:
- `User-Agent`: Full browser string
- `Referer`: `https://www.nba.com/`
- `Origin`: `https://www.nba.com`

### 2. Player Search Strategy
NBA.com doesn't have a search endpoint. Strategy:
1. Load ALL players once (`commonallplayers`)
2. Cache for 24 hours
3. Search client-side with fuzzy matching
4. Prioritize active players

### 3. ResultSets Format
All responses use this structure:
```json
{
  "resultSets": [
    {
      "name": "CareerTotalsAllStarSeason",
      "headers": ["PLAYER_ID", "SEASON_ID", "PTS", ...],
      "rowSet": [[2544, "2023-24", 1500, ...]]
    }
  ]
}
```
Need helper function to convert to objects.

### 4. Field Names are UPPERCASE
NBA uses UPPERCASE field names: `PERSON_ID`, `PTS`, `REB`
Convert to lowercase for consistency: `person_id`, `pts`, `reb`

### 5. Career Stats Location
Career totals are the LAST row in season stats resultSet.
Filter: `seasonStats[seasonStats.length - 1]`

### 6. Season Format
NBA seasons: `"2024-25"` (not `"2024"` or `2024`)
Calculate based on current month (Oct-Sep season)

### 7. Active Player Status
`rosterstatus === 1` means active
`rosterstatus === 0` means inactive/retired

---

## Testing Strategy

### Unit Tests
- Each BaseSportAPI method
- Player caching mechanism
- ResultSets parsing
- Error handling

### Integration Tests
- End-to-end player search
- End-to-end comparison
- Live API calls (with rate limiting awareness)

### Backwards Compatibility
- MLB code still works
- Existing scripts unaffected
- No breaking changes

---

## Expected Challenges

### 1. API Rate Limiting
**Issue**: NBA.com may rate limit aggressive requests
**Solution**: 
- Implement exponential backoff
- Cache aggressively (24h for players)
- Add delays between requests if needed

### 2. Inconsistent Data
**Issue**: Some players may have missing stats (e.g., rookies, injured)
**Solution**:
- Default to 0 for missing numeric stats
- Handle null/undefined gracefully
- Add data validation

### 3. TypeScript Complexity
**Issue**: NBA types more complex than MLB
**Solution**:
- Keep interfaces simple
- Use `any` for complex nested structures
- Add JSDoc comments for clarity

### 4. Large Player Cache
**Issue**: All NBA players (~4500) in memory
**Solution**:
- Only cache essential fields (id, name, active status)
- Lazy load full player info when needed
- Set reasonable cache expiry (24h)

---

## Success Criteria

Phase 2 is complete when:

1. ✅ `NBAAPIClient` extends `BaseSportAPI`
2. ✅ All abstract methods implemented
3. ✅ NBA-specific methods working
4. ✅ `NBAComparison` extends `BaseComparison`
5. ✅ All comparison methods working
6. ✅ Test suite: 8/8 tests passing
7. ✅ Example script works (LeBron vs Jordan)
8. ✅ TypeScript compiles with 0 errors
9. ✅ Backwards compatibility maintained
10. ✅ Documentation updated

---

## Next Steps After Phase 2

### Phase 3: NFL Implementation
- Similar pattern to NBA
- Use nflverse data from GitHub
- Add Parquet parsing
- Create NFLAPIClient and NFLComparison

### Phase 4: Unified MCP Server
- Add `league` parameter to all MCP tools
- Route requests to correct API (MLB/NBA/NFL)
- Create SportAPIFactory
- Update tool descriptions

### Phase 5: Documentation & Polish
- Update README with all three sports
- Create comprehensive examples
- Add migration guide
- Performance optimization

---

## Resources

### Documentation
- ✅ NBA_DATA_REFERENCE.md (600+ lines)
- ✅ IMPLEMENTATION_ROADMAP.md (updated)
- ✅ MULTI_SPORT_ARCHITECTURE.md (code examples)
- ✅ PHASE1_VERIFICATION_REPORT.md (Phase 1 complete)

### Code References
- MLB API: `src/api/mlb-api.ts` (working example to follow)
- MLB Comparison: `src/comparison/mlb-comparison.ts` (pattern to follow)
- Base API: `src/api/base-api.ts` (interfaces to implement)
- Base Comparison: `src/comparison/base-comparison.ts` (abstract methods)

### External Resources
- NBA.com Stats API: https://stats.nba.com/stats
- nba_api GitHub: https://github.com/swar/nba_api
- NBA API documentation: Endpoints and parameters

---

## Estimated Timeline

**Optimistic**: 1-2 days (6-8 hours of focused work)
- 3 hours: NBA API client
- 2 hours: NBA comparison
- 1 hour: Tests
- 1 hour: Documentation
- 1 hour: Testing and debugging

**Realistic**: 2-4 days (8-12 hours)
- Account for API quirks
- Handle edge cases
- Thorough testing
- Documentation polish

**Conservative**: 1 week
- Full integration testing
- Handle all edge cases
- Complete documentation
- User feedback iteration

---

## Ready to Begin! 🚀

Phase 1 foundation is solid. Base architecture tested and working. All MLB functionality preserved. 

**Next command**: Start implementing `src/api/nba-api.ts` using MLB API as template.

**Confidence Level**: HIGH
**Risk Level**: LOW (thanks to Phase 1 foundation)
**Blockers**: NONE

Let's build NBA support! 🏀
