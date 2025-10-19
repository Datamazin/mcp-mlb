# Multi-Sport Implementation Roadmap

## Quick Summary
This roadmap outlines the step-by-step process to extend your MLB MCP Server to support NBA and NFL statistics.

**Reference Implementation:** [balldontlie-mcp](https://github.com/mikechao/balldontlie-mcp/blob/main/src/index.ts)

## Prerequisites

### 1. API Access
- ✅ **MLB API**: Already working (free, no key required)
  - Base URL: `https://statsapi.mlb.com/api/v1`
- 🔑 **NBA API**: Requires [balldontlie.io](https://www.balldontlie.io/) API key
  - Sign up at: https://app.balldontlie.io/
  - Free tier: 10 requests/minute, 1000 requests/day
  - Paid tier: Higher limits available
- ✅ **NFL API**: Uses [nflverse-data](https://github.com/nflverse/nflverse-data) (free, no key required)
  - Data hosted on GitHub releases (JSON/Parquet files)
  - Base URL: `https://github.com/nflverse/nflverse-data/releases/download/`
  - Documentation: https://nflreadr.nflverse.com/

### 2. Dependencies
```bash
npm install @balldontlie/sdk  # Official SDK for NBA data
# nflverse uses direct HTTP requests to GitHub releases - no SDK needed
```

### 3. Environment Variables
```bash
# Add to .env
BALLDONTLIE_API_KEY=your_api_key_here  # Only needed for NBA

# NFL uses public GitHub URLs - no authentication required
NFL_DATA_BASE=https://github.com/nflverse/nflverse-data/releases/download/
```

## Implementation Phases

### 📦 Phase 1: Code Refactoring (Foundation)
**Goal:** Extract base classes from existing MLB code without breaking anything

#### Step 1.1: Create Base API Class
```bash
# Create new file
touch src/api/base-api.ts
```

**Tasks:**
- [ ] Extract common API methods to `BaseSportAPI` abstract class
- [ ] Move `makeRequest()` to base class
- [ ] Define abstract methods all sports must implement
- [ ] Move `SportAPIError` to base class

#### Step 1.2: Refactor MLB API
```bash
# Move existing file
mv src/mlb-api.ts src/api/mlb-api.ts
```

**Tasks:**
- [ ] Make `MLBAPIClient` extend `BaseSportAPI`
- [ ] Keep all MLB-specific methods
- [ ] Update imports in `index.ts`
- [ ] Run tests to ensure nothing broke

#### Step 1.3: Create Base Comparison Class
```bash
# Create new file
touch src/comparison/base-comparison.ts
```

**Tasks:**
- [ ] Extract common comparison logic to `BaseComparison`
- [ ] Define abstract methods for metrics and formatting
- [ ] Move common winner calculation logic
- [ ] Create shared interfaces

#### Step 1.4: Refactor MLB Comparison
```bash
# Move and refactor
mv src/comparison-utils.ts src/comparison/mlb-comparison.ts
```

**Tasks:**
- [ ] Make `MLBComparison` extend `BaseComparison`
- [ ] Keep MLB-specific metrics
- [ ] Update imports across the project
- [ ] Verify all existing scripts still work

#### Step 1.5: Create Sport Factory
```bash
# Create new file
touch src/sport-factory.ts
```

**Tasks:**
- [ ] Create `SportLeague` enum (MLB, NBA, NFL)
- [ ] Implement `SportAPIFactory.createAPI()`
- [ ] Add configuration management
- [ ] Test factory pattern

**Validation:**
```bash
npm run build
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso"  # Should still work
```

---

### 🏀 Phase 2: NBA Implementation
**Goal:** Add full NBA support using balldontlie.io API

#### Step 2.1: Create NBA API Client
```bash
# Create new file
touch src/api/nba-api.ts
```

**Tasks:**
- [ ] Implement `NBAAPIClient extends BaseSportAPI`
- [ ] Add API key authentication
- [ ] Implement `searchPlayers()` with first/last name support
- [ ] Implement `getPlayerStats()` with season filtering
- [ ] Implement `getTeams()`
- [ ] Implement `getSchedule()`
- [ ] Implement `getGame()`

**NBA API Endpoints:**
```typescript
// Players
GET /nba/players?first_name=LeBron&last_name=James&cursor=0

// Player Stats
GET /nba/stats?player_ids[]=237&seasons[]=2024

// Teams
GET /nba/teams

// Games
GET /nba/games?dates[]=2024-10-19&team_ids[]=5

// Specific Game
GET /nba/games/:id
```

#### Step 2.2: Create NBA Comparison
```bash
# Create new file
touch src/comparison/nba-comparison.ts
```

**Tasks:**
- [ ] Implement `NBAComparison extends BaseComparison`
- [ ] Define NBA metrics (pts, reb, ast, stl, blk, fg%, 3pt%, etc.)
- [ ] Create stat groups: 'overall', 'scoring', 'defense', 'efficiency'
- [ ] Implement NBA-specific formatting
- [ ] Add per-game vs total stats handling

**NBA Stat Groups:**
```typescript
// Scoring: pts, fg_pct, fg3_pct, ft_pct
// Overall: pts, reb, ast, stl, blk
// Defense: reb, stl, blk, dreb, oreb
// Efficiency: fg_pct, fg3_pct, ft_pct, turnover
```

#### Step 2.3: Create NBA Types
```bash
# Create new file
touch src/types/nba-types.ts
```

**Tasks:**
- [ ] Define NBA player interfaces
- [ ] Define NBA stats interfaces
- [ ] Define NBA team interfaces
- [ ] Define NBA game interfaces

#### Step 2.4: Create NBA Formatter
```bash
# Create new file
touch src/formatters/nba-formatter.ts
```

**Tasks:**
- [ ] Format player search results
- [ ] Format player stats
- [ ] Format team info
- [ ] Format game data
- [ ] Format comparison results

#### Step 2.5: Test NBA Functionality
```bash
# Test script
node -e "
const { SportAPIFactory } = require('./build/sport-factory.js');
const api = SportAPIFactory.createAPI('NBA');
api.searchPlayers('LeBron James').then(console.log);
"
```

**Validation:**
```bash
# CLI test
node compare-players-multi-sport.cjs NBA "LeBron James" "Kevin Durant" 2024 overall

# MCP server test (once integrated)
# Use compare-players tool with league: 'NBA'
```

---

### 🏈 Phase 3: NFL Implementation
**Goal:** Add full NFL support using nflverse-data (GitHub-hosted JSON/Parquet files)

#### Step 3.1: Create NFL API Client
```bash
# Create new file
touch src/api/nfl-api.ts
```

**Tasks:**
- [ ] Implement `NFLAPIClient extends BaseSportAPI`
- [ ] Use GitHub releases for data (no auth required)
- [ ] Implement caching strategy for large JSON files
- [ ] Handle Parquet or CSV data formats
- [ ] Implement all standard methods

**NFL Data Endpoints (nflverse):**
```typescript
// Players (current roster)
GET https://github.com/nflverse/nflverse-data/releases/download/players/players.csv

// Rosters by Season
GET https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{YEAR}.parquet

// Player Stats (weekly)
GET https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_{YEAR}.parquet

// Teams
GET https://github.com/nflverse/nflverse-data/releases/download/teams/teams.csv

// Schedule
GET https://github.com/nflverse/nflverse-data/releases/download/schedules/schedules_{YEAR}.csv

// Play-by-play (for game details)
GET https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{YEAR}.parquet
```

**Data Format Notes:**
- Most data available in CSV, Parquet, and RDS formats
- Parquet recommended for large datasets (better compression)
- CSV easier to parse in JavaScript/Node.js
- Files updated regularly via GitHub Actions

#### Step 3.2: Create NFL Comparison
```bash
# Create new file
touch src/comparison/nfl-comparison.ts
```

**Tasks:**
- [ ] Implement `NFLComparison extends BaseComparison`
- [ ] Define NFL metrics by position (QB, RB, WR, TE, DEF)
- [ ] Create stat groups: 'passing', 'rushing', 'receiving', 'defense'
- [ ] Handle position-specific stats from nflverse data
- [ ] Aggregate weekly stats for season/career totals
- [ ] Format for readability

**NFL Stat Groups (nflverse fields):**
```typescript
// Passing: 
//   passing_yards, passing_tds, interceptions, completions, attempts,
//   completion_percentage, passing_epa, passing_2pt_conversions

// Rushing: 
//   rushing_yards, rushing_tds, carries, rushing_fumbles, rushing_fumbles_lost,
//   rushing_first_downs, rushing_epa, rushing_2pt_conversions

// Receiving: 
//   receiving_yards, receiving_tds, receptions, targets, receiving_fumbles,
//   receiving_fumbles_lost, receiving_air_yards, receiving_yards_after_catch,
//   receiving_first_downs, receiving_epa, receiving_2pt_conversions

// Defense: 
//   tackles (from PFR data), sacks, interceptions, forced_fumbles,
//   fumble_recoveries, defensive_tds, safety (from play-by-play)

// Fantasy:
//   fantasy_points, fantasy_points_ppr (available in player_stats)
```

**Data Aggregation Strategy:**
- Weekly stats stored in `player_stats_{YEAR}.parquet`
- Aggregate by `player_id` and `season` for season totals
- Career totals require loading multiple years
- Use `recent_team` for current team affiliation

#### Step 3.3: Add Parquet Parsing Support
```bash
# Install parquet parser for Node.js
npm install parquetjs-lite
# OR use arrow for better performance
npm install apache-arrow
```

**Tasks:**
- [ ] Add Parquet file parsing capability
- [ ] Create CSV fallback for simpler queries
- [ ] Implement file caching (files are large, ~50-200MB)
- [ ] Handle GZIP compressed CSV files

#### Step 3.4: Create NFL Types & Formatter
```bash
# Create files
touch src/types/nfl-types.ts
touch src/formatters/nfl-formatter.ts
```

**Tasks:**
- [ ] Define NFL interfaces matching nflverse schema
- [ ] Create NFL-specific formatters
- [ ] Handle position-based formatting
- [ ] Map nflverse field names to friendly names

**NFLverse Data Types:**
```typescript
// Player from players.csv
interface NFLPlayer {
  gsis_id: string;          // Primary ID
  short_name: string;
  full_name: string;
  position: string;
  height: string;
  weight: number;
  college: string;
  status: string;           // ACT, RES, etc.
  entry_year: number;
  rookie_year: number;
  draft_club: string;
  draft_number: number;
}

// Stats from player_stats_{YEAR}.parquet
interface NFLPlayerStats {
  player_id: string;        // Links to gsis_id
  player_name: string;
  player_display_name: string;
  position: string;
  position_group: string;   // QB, RB, WR, TE, etc.
  season: number;
  week: number;
  // ... all stat fields
}
```

#### Step 3.5: Test NFL Functionality
```bash
# CLI test
node compare-players-multi-sport.cjs NFL "Patrick Mahomes" "Josh Allen" 2024 passing
node compare-players-multi-sport.cjs NFL "Christian McCaffrey" "Derrick Henry" 2024 rushing

# Test with player search (requires roster data)
node -e "
const { NFLAPIClient } = require('./build/api/nfl-api.js');
const api = new NFLAPIClient();
api.searchPlayers('Patrick Mahomes').then(console.log);
"
```

---

### 🔧 Phase 4: Unified Server Integration
**Goal:** Update MCP server to support all three sports

#### Step 4.1: Update Index.ts
```bash
# Edit src/index.ts
```

**Tasks:**
- [ ] Add league parameter to all tools
- [ ] Implement sport routing with switch statements
- [ ] Update tool descriptions
- [ ] Add sport-specific validation
- [ ] Update error handling

#### Step 4.2: Update All Tools

**Tools to Update:**
- [ ] `get-teams` - Add league parameter
- [ ] `get-team-info` - Add league parameter
- [ ] `search-players` - Add league parameter, handle different search patterns
- [ ] `get-player-stats` - Add league parameter, handle different stat types
- [ ] `compare-players` - Add league parameter, route to correct comparison
- [ ] `get-schedule` - Add league parameter
- [ ] `get-live-game` - Add league parameter

#### Step 4.3: Create Multi-Sport CLI
```bash
# Create new file
touch compare-players-multi-sport.cjs
```

**Tasks:**
- [ ] Unified CLI that accepts league parameter
- [ ] Auto-detect default stat groups per sport
- [ ] Better error messages
- [ ] Help text with examples

#### Step 4.4: Update Existing CLIs
```bash
# Update these files
# compare-players-enhanced.cjs
# compare-batters.cjs
# compare-pitchers.cjs
```

**Options:**
1. Keep MLB-specific CLIs as-is (backwards compatibility)
2. Add league parameter to existing scripts
3. Create sport-specific wrappers that call multi-sport CLI

---

### 📚 Phase 5: Documentation & Polish
**Goal:** Comprehensive documentation and user experience

#### Step 5.1: Update README
```bash
# Edit README.md
```

**Tasks:**
- [ ] Multi-sport overview section
- [ ] Setup instructions for all sports
- [ ] API key configuration
- [ ] Usage examples for MLB, NBA, NFL
- [ ] Migration guide from v1.0

#### Step 5.2: Create Examples
```bash
# Create examples directory
mkdir examples
touch examples/mlb-examples.md
touch examples/nba-examples.md
touch examples/nfl-examples.md
```

**Examples to Include:**
- [ ] Player search examples
- [ ] Stats retrieval examples
- [ ] Comparison examples
- [ ] Schedule queries
- [ ] Live game data

#### Step 5.3: Create Migration Guide
```bash
# Create file
touch MIGRATION_V1_TO_V2.md
```

**Tasks:**
- [ ] Breaking changes (if any)
- [ ] New features
- [ ] Updated CLI usage
- [ ] Environment variable changes
- [ ] Code examples

#### Step 5.4: Performance Optimization
**Tasks:**
- [ ] Add caching for team lists (rarely change)
- [ ] Optimize API requests (batch where possible)
- [ ] Add rate limiting handling
- [ ] Implement retry logic with exponential backoff

#### Step 5.5: Error Handling Enhancement
**Tasks:**
- [ ] Sport-specific error messages
- [ ] API rate limit detection
- [ ] Helpful suggestions in errors
- [ ] Graceful degradation

---

## Testing Checklist

### Unit Tests
```bash
npm test
```

**Coverage:**
- [ ] Base API class
- [ ] MLB API client
- [ ] NBA API client
- [ ] NFL API client
- [ ] Base comparison
- [ ] MLB comparison
- [ ] NBA comparison
- [ ] NFL comparison
- [ ] Sport factory
- [ ] Formatters

### Integration Tests
**MCP Server:**
- [ ] `get-teams` for all sports
- [ ] `search-players` for all sports
- [ ] `get-player-stats` for all sports
- [ ] `compare-players` for all sports
- [ ] Error handling for invalid leagues

**CLI Scripts:**
- [ ] MLB player comparison
- [ ] NBA player comparison
- [ ] NFL player comparison
- [ ] Invalid league handling
- [ ] Player not found handling

### Manual Testing
**Test Cases:**
```bash
# MLB
node compare-players-multi-sport.cjs MLB "Aaron Judge" "Pete Alonso" career hitting
node compare-players-multi-sport.cjs MLB "Max Scherzer" "Jacob deGrom" 2024 pitching

# NBA
node compare-players-multi-sport.cjs NBA "LeBron James" "Kevin Durant" 2024 overall
node compare-players-multi-sport.cjs NBA "Stephen Curry" "Damian Lillard" 2024 scoring

# NFL
node compare-players-multi-sport.cjs NFL "Patrick Mahomes" "Josh Allen" 2024 passing
node compare-players-multi-sport.cjs NFL "Derrick Henry" "Christian McCaffrey" 2024 rushing
node compare-players-multi-sport.cjs NFL "Travis Kelce" "George Kittle" 2024 receiving
```

---

## Estimated Timeline

### Conservative Estimate
- **Phase 1 (Refactoring):** 2-3 days
- **Phase 2 (NBA):** 3-4 days
- **Phase 3 (NFL):** 2-3 days
- **Phase 4 (Integration):** 2-3 days
- **Phase 5 (Documentation):** 1-2 days
- **Testing & Bug Fixes:** 2-3 days

**Total:** 12-18 days

### Aggressive Estimate
- **Phase 1:** 1 day
- **Phase 2:** 2 days
- **Phase 3:** 1 day
- **Phase 4:** 1 day
- **Phase 5:** 1 day
- **Testing:** 1 day

**Total:** 7 days

---

## Risk Mitigation

### Risk 1: API Rate Limits
**Solution:** Implement caching and rate limiting
```typescript
// Add to base-api.ts
private cache = new Map();
private rateLimiter = new RateLimiter(10, 60000); // 10 req/min

async makeRequest(endpoint: string) {
  await this.rateLimiter.wait();
  
  const cacheKey = `${endpoint}${JSON.stringify(params)}`;
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }
  
  const result = await fetch(...);
  this.cache.set(cacheKey, result);
  return result;
}
```

### Risk 2: Breaking Changes
**Solution:** 
- Keep v1.0 MLB-only branch
- Version MCP server (v2.0.0)
- Maintain backwards compatibility with league='MLB' as default

### Risk 3: Different API Structures
**Solution:**
- Use adapter pattern to normalize responses
- Create common interfaces
- Handle edge cases in sport-specific code

### Risk 4: Missing Data
**Solution:**
- Graceful handling of null/undefined values
- Clear error messages about data availability
- Default values where appropriate

---

## Success Criteria

### Must Have
- [ ] All three sports (MLB, NBA, NFL) fully functional
- [ ] All existing MLB functionality still works
- [ ] MCP server supports multi-sport queries
- [ ] CLI tools work for all sports
- [ ] Documentation complete
- [ ] Tests passing

### Nice to Have
- [ ] Caching for performance
- [ ] Cross-sport comparisons (e.g., "Who's more dominant: LeBron in NBA or Judge in MLB?")
- [ ] Historical data support
- [ ] Advanced analytics (efficiency ratings, VORP, etc.)
- [ ] Data visualization

---

## Quick Start Commands

```bash
# Phase 1: Setup
npm install @balldontlie/sdk
echo "BALLDONTLIE_API_KEY=your_key_here" >> .env

# Create directory structure
mkdir -p src/api src/comparison src/types src/formatters

# Phase 2-4: Implementation
# Follow the phase-by-phase tasks above

# Phase 5: Test
npm run build
npm test

# Try it out
node compare-players-multi-sport.cjs MLB "Aaron Judge" "Pete Alonso"
node compare-players-multi-sport.cjs NBA "LeBron James" "Kevin Durant"
node compare-players-multi-sport.cjs NFL "Patrick Mahomes" "Josh Allen"
```

---

## Additional Resources

### MLB
- **MLB Stats API:** https://statsapi.mlb.com/docs/
- **MLB Stats API Explorer:** https://statsapi.mlb.com/

### NBA
- **balldontlie.io Documentation:** https://docs.balldontlie.io/
- **balldontlie SDK:** https://www.npmjs.com/package/@balldontlie/sdk
- **Reference Implementation:** https://github.com/mikechao/balldontlie-mcp

### NFL
- **nflverse-data GitHub:** https://github.com/nflverse/nflverse-data
- **nflreadr Documentation:** https://nflreadr.nflverse.com/
- **nflverse Website:** https://www.nflverse.com/
- **Data Dictionaries:** https://nflreadr.nflverse.com/articles/dictionary.html
- **Available Datasets:** https://github.com/nflverse/nflverse-data/releases
- **Parquet.js:** https://www.npmjs.com/package/parquetjs-lite
- **Apache Arrow:** https://www.npmjs.com/package/apache-arrow

---

## Questions to Consider

1. **Should we keep separate CLIs for each sport or use one unified CLI?**
   - Recommendation: One unified CLI + sport-specific wrappers for convenience

2. **How to handle sport-specific features (e.g., MLB postseason, NBA playoffs)?**
   - Recommendation: Add sport-specific tools where needed

3. **Should we support cross-sport comparisons?**
   - Recommendation: Phase 6 (future enhancement)

4. **How to handle different stat availability across sports?**
   - Recommendation: Clear documentation + graceful error messages

---

Ready to implement? Start with Phase 1 and work your way through! The architecture document (`MULTI_SPORT_ARCHITECTURE.md`) has all the detailed code examples you'll need.
