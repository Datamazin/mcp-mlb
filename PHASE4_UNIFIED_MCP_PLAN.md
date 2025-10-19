# Phase 4: Unified Multi-Sport MCP Server Implementation Plan

## Date: October 19, 2025
## Status: 🚧 IN PROGRESS

---

## 🎯 Objective

Create a unified MCP server that provides access to both MLB and NBA data through a single interface. Users can specify which sport they want to query, and the server routes requests to the appropriate API client.

---

## 🏗️ Architecture Overview

### Current State (Phase 2)
- **MLB MCP Server** - 24 tools, all MLB-specific
- **NBA API Client** - Fully functional, extends BaseSportAPI
- **NBA Comparison** - Fully functional, extends BaseComparison
- **No MCP integration for NBA** - Can't use NBA from Claude Desktop yet

### Target State (Phase 4)
- **Unified MCP Server** - Single server for all sports
- **Sport Parameter** - Each tool accepts `league` parameter
- **Smart Routing** - Requests routed to MLB or NBA API
- **Backwards Compatible** - Existing MLB tools still work

---

## 📋 Implementation Strategy

### Approach: **Parameter-Based Routing**

Add a `league` parameter to relevant tools. Based on the league selection, route to the appropriate API client.

**Advantages**:
- Simple and clean
- Backwards compatible (league defaults to MLB)
- Easy to extend to NFL later
- Claude can specify sport in natural language

**Example**:
```typescript
server.registerTool(
  'get-player-stats',
  {
    inputSchema: {
      league: z.enum(['mlb', 'nba', 'nfl']).default('mlb'),
      playerId: z.number(),
      season: z.number().optional()
    }
  },
  async ({ league, playerId, season }) => {
    const apiClient = getAPIClient(league);
    return await apiClient.getPlayerStats(playerId, season);
  }
);
```

---

## 🔧 Tools to Implement

### Universal Tools (Work Across All Sports)

1. **`search-players`** - Search players in any league
   - Input: `league`, `name`, `activeStatus`
   - Routes to: MLB/NBA searchPlayers()
   
2. **`get-player-stats`** - Get player statistics
   - Input: `league`, `playerId`, `season`, `statType`
   - Routes to: MLB/NBA getPlayerStats()
   
3. **`get-player-info`** - Get player information
   - Input: `league`, `playerId`
   - Routes to: MLB/NBA getPlayerInfo()

4. **`get-teams`** - Get all teams
   - Input: `league`
   - Routes to: MLB/NBA getTeams()
   
5. **`get-team-info`** - Get team details
   - Input: `league`, `teamId`
   - Routes to: MLB/NBA getTeamInfo()
   
6. **`get-schedule`** - Get game schedule
   - Input: `league`, `startDate`, `endDate`, `teamId`
   - Routes to: MLB/NBA getSchedule()
   
7. **`get-game`** - Get game details
   - Input: `league`, `gameId`
   - Routes to: MLB/NBA getGame()

8. **`compare-players`** - Compare two players
   - Input: `league`, `player1Id`, `player2Id`, `season`
   - Routes to: MLB/NBA comparison classes

### Sport-Specific Tools (Keep Separate)

#### MLB-Only Tools (No NBA Equivalent)
- `get-team-roster` - Rosters work differently in NBA
- `get-live-game` - Real-time play-by-play (MLB-specific format)
- `get-box-score` - Detailed box scores (MLB format)
- `get-player-game-logs` - Game logs (different formats)
- `visualize-player-stats` - Chart generation (MLB-specific)
- `get-mlb-com-links` - MLB.com specific
- `get-postseason-schedule` - MLB postseason format
- `get-mlb-jobs` - MLB personnel
- `get-mlb-meta` - MLB metadata

#### NBA-Only Tools (To Be Created)
- `get-nba-player-game-stats` - NBA game stats format
- `get-nba-team-roster` - NBA roster structure
- `get-nba-standings` - NBA standings format
- `get-nba-com-links` - NBA.com specific

---

## 🔀 API Client Factory

Create a factory to instantiate the correct API client based on league:

```typescript
// src/api/sport-api-factory.ts
import { BaseSportAPI } from './base-api.js';
import { MLBAPIClient } from './mlb-api.js';
import { NBAAPIClient } from './nba-api.js';

export type League = 'mlb' | 'nba' | 'nfl';

export class SportAPIFactory {
  private static mlbClient: MLBAPIClient | null = null;
  private static nbaClient: NBAAPIClient | null = null;
  
  static getClient(league: League): BaseSportAPI {
    switch (league.toLowerCase()) {
      case 'mlb':
        if (!this.mlbClient) {
          this.mlbClient = new MLBAPIClient('https://statsapi.mlb.com/api/v1');
        }
        return this.mlbClient;
        
      case 'nba':
        if (!this.nbaClient) {
          this.nbaClient = new NBAAPIClient();
        }
        return this.nbaClient;
        
      case 'nfl':
        throw new Error('NFL API not yet implemented (Phase 3)');
        
      default:
        throw new Error(`Unknown league: ${league}. Supported: mlb, nba`);
    }
  }
}
```

---

## 🔀 Comparison Factory

Create a factory for comparison classes:

```typescript
// src/comparison/comparison-factory.ts
import { BaseComparison } from './base-comparison.js';
import { MLBComparison } from './mlb-comparison.js';
import { NBAComparison } from './nba-comparison.js';
import { League } from '../api/sport-api-factory.js';

export class ComparisonFactory {
  private static mlbComparison: MLBComparison | null = null;
  private static nbaComparison: NBAComparison | null = null;
  
  static getComparison(league: League): BaseComparison {
    switch (league.toLowerCase()) {
      case 'mlb':
        if (!this.mlbComparison) {
          this.mlbComparison = new MLBComparison();
        }
        return this.mlbComparison;
        
      case 'nba':
        if (!this.nbaComparison) {
          this.nbaComparison = new NBAComparison();
        }
        return this.nbaComparison;
        
      case 'nfl':
        throw new Error('NFL comparison not yet implemented (Phase 3)');
        
      default:
        throw new Error(`Unknown league: ${league}`);
    }
  }
}
```

---

## 📝 Implementation Steps

### Step 1: Create Factories ✅
- [x] Create `src/api/sport-api-factory.ts`
- [x] Create `src/comparison/comparison-factory.ts`
- [x] Build and verify TypeScript compilation

### Step 2: Update Universal Tools 🚧
- [ ] Add `league` parameter to tool schemas
- [ ] Use factory to get API client
- [ ] Route requests appropriately
- [ ] Test with both MLB and NBA

**Tools to Update**:
1. `search-players` - Universal player search
2. `get-player-stats` - Universal stats retrieval
3. `get-player-info` - Universal player info
4. `get-teams` - Universal team list
5. `get-team-info` - Universal team details
6. `get-schedule` - Universal schedule
7. `get-game` - Universal game details
8. `compare-players` - Universal comparison

### Step 3: Create NBA-Specific Tools 📋
- [ ] `get-nba-standings` - NBA standings
- [ ] `get-nba-team-roster` - NBA roster format
- [ ] `get-nba-player-career` - NBA career stats
- [ ] `get-nba-com-links` - NBA.com links

### Step 4: Update Server Metadata 📝
- [ ] Update server name to "Multi-Sport MCP Server"
- [ ] Update description to mention MLB and NBA
- [ ] Update version to 2.0.0

### Step 5: Testing & Verification ✅
- [ ] Test MLB tools (backwards compatibility)
- [ ] Test NBA tools (new functionality)
- [ ] Test comparison with both leagues
- [ ] Create comprehensive test script
- [ ] Document all tools

### Step 6: Documentation 📚
- [ ] Update README with NBA examples
- [ ] Create tool reference guide
- [ ] Create user guide for Claude Desktop
- [ ] Update Claude Desktop config examples

---

## 🧪 Testing Strategy

### Test Cases

**1. MLB Player Search**
```json
{
  "tool": "search-players",
  "params": {
    "league": "mlb",
    "name": "Shohei Ohtani"
  }
}
```

**2. NBA Player Search**
```json
{
  "tool": "search-players",
  "params": {
    "league": "nba",
    "name": "LeBron James"
  }
}
```

**3. MLB Player Stats**
```json
{
  "tool": "get-player-stats",
  "params": {
    "league": "mlb",
    "playerId": 660271,
    "season": 2024
  }
}
```

**4. NBA Player Stats**
```json
{
  "tool": "get-player-stats",
  "params": {
    "league": "nba",
    "playerId": 2544,
    "season": 2024
  }
}
```

**5. MLB Player Comparison**
```json
{
  "tool": "compare-players",
  "params": {
    "league": "mlb",
    "player1Id": 660271,
    "player2Id": 545361,
    "season": "career"
  }
}
```

**6. NBA Player Comparison**
```json
{
  "tool": "compare-players",
  "params": {
    "league": "nba",
    "player1Id": 2544,
    "player2Id": 893
  }
}
```

---

## 📊 Expected Outcomes

### Success Criteria

1. **Backwards Compatibility** ✅
   - All existing MLB tools work without changes
   - Default league is MLB (no breaking changes)
   - Existing clients don't need updates

2. **NBA Functionality** ✅
   - All 7 universal tools work with NBA
   - NBA player search returns correct results
   - NBA stats display properly
   - NBA comparison works

3. **Error Handling** ✅
   - Invalid league returns helpful error
   - Missing player returns clear message
   - API errors handled gracefully

4. **Performance** ✅
   - NBA player cache working (24h TTL)
   - MLB requests fast as before
   - No performance degradation

---

## 🎨 User Experience

### Claude Desktop Usage

**MLB Query**:
```
User: "Search for Shohei Ohtani stats in 2024"
Claude: [Calls search-players with league='mlb']
```

**NBA Query**:
```
User: "Show me LeBron James stats"
Claude: [Calls search-players with league='nba']
```

**Comparison Query**:
```
User: "Compare LeBron and Jordan"
Claude: [Calls compare-players with league='nba']
```

**Cross-Sport Query** (Future):
```
User: "Who has more championships, LeBron or Jeter?"
Claude: [Calls get-player-info for both leagues]
```

---

## 🚀 Phase 4 Milestones

### Milestone 1: Foundation ✅
- [x] Create SportAPIFactory
- [x] Create ComparisonFactory
- [x] Build and test factories

### Milestone 2: Universal Tools 🚧
- [ ] Update 8 universal tools
- [ ] Test with MLB (backwards compat)
- [ ] Test with NBA (new functionality)

### Milestone 3: NBA Tools 📋
- [ ] Create 4 NBA-specific tools
- [ ] Test all NBA tools
- [ ] Document NBA tools

### Milestone 4: Integration Testing ✅
- [ ] Comprehensive test script
- [ ] Error handling verification
- [ ] Performance testing

### Milestone 5: Documentation 📚
- [ ] Updated README
- [ ] Tool reference guide
- [ ] User guide
- [ ] Claude Desktop setup

### Milestone 6: Completion 🎉
- [ ] Phase 4 completion report
- [ ] Git commit and push
- [ ] Ready for Phase 5 or Phase 3

---

## 📈 Metrics

**Current State**:
- MCP Tools: 24 (all MLB)
- API Clients: 2 (MLB, NBA)
- Comparison Classes: 2 (MLB, NBA)
- Supported Sports: 1 (MLB via MCP)

**Target State**:
- MCP Tools: ~40 (universal + sport-specific)
- API Clients: 2 (MLB, NBA) - no change
- Comparison Classes: 2 (MLB, NBA) - no change
- Supported Sports: 2 (MLB + NBA via MCP)

---

## 🔮 Future Enhancements (Post-Phase 4)

1. **Smart League Detection** - Auto-detect league from player name
2. **Cross-Sport Comparisons** - Compare players across sports
3. **Multi-Sport Queries** - Query multiple sports at once
4. **Sport-Specific Formatting** - Better output for each sport
5. **Caching Layer** - Unified cache across sports
6. **Rate Limiting** - Per-sport rate limits
7. **Analytics** - Track tool usage by sport

---

## 💡 Key Decisions

### Decision 1: League Parameter vs Separate Servers
**Chosen**: League Parameter
**Reason**: Simpler, more maintainable, easier for users

### Decision 2: Default League
**Chosen**: MLB
**Reason**: Backwards compatibility, existing users

### Decision 3: Factory Pattern
**Chosen**: Singleton factories for clients
**Reason**: Reuse clients, maintain caches, better performance

### Decision 4: Tool Naming
**Chosen**: Universal names (get-player-stats) + specific (get-mlb-com-links)
**Reason**: Clear, consistent, easy to discover

---

**Phase 4 Goal**: Make both MLB and NBA available through a unified MCP server, accessible from Claude Desktop. Maintain backwards compatibility while adding powerful new multi-sport capabilities.

**Estimated Time**: 2-3 days
**Complexity**: Medium
**Risk**: Low (phase 1 & 2 complete, architecture proven)

---

**Let's build the future of sports data! 🚀⚾🏀**
