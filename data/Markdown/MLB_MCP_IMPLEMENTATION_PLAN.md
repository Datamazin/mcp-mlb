# MLB MCP Server - Complete Implementation Plan

Based on the comprehensive MLB-StatsAPI documentation, here are all the functions we should implement as MCP tools:

## ✅ Currently Implemented:
1. `get-team-roster` - Team roster with historical support
2. `get-standings` - League/division standings  
3. `get-team-info` - Team information
4. `get-player-stats` - Player statistics
5. `get-schedule` - Game schedules
6. `get-live-game` - Live game data
7. `search-players` - Player search
8. `visualize-player-stats` - Statistical visualization

## 🔄 High Priority - Core Functions to Add:

### Player Lookup & Search
- `lookup-player` - Search players by name, position, team, etc.
- `lookup-team` - Search teams by name, city, abbreviation

### Game Data & Analysis  
- `get-boxscore` - Detailed game boxscore
- `get-game-highlights` - Game highlights with video links
- `get-game-scoring-plays` - Scoring plays for a game
- `get-linescore` - Game linescore
- `last-game` - Team's most recent game
- `next-game` - Team's next scheduled game

### League Leaders & Stats
- `get-league-leaders` - Statistical leaders by category
- `get-team-leaders` - Team statistical leaders
- `get-player-career-stats` - Complete career statistics

### Advanced Features
- `get-game-pace` - Pace of game statistics
- `get-probable-pitchers` - Probable starting pitchers
- `get-roster-changes` - Roster transactions
- `get-injury-report` - Player injury status

## 📋 Implementation Priority:

### Phase 1: Core Search & Lookup (High Impact)
1. `lookup-player` - Essential for finding players
2. `lookup-team` - Essential for finding teams  
3. `get-boxscore` - Detailed game analysis
4. `get-league-leaders` - Statistical leaders

### Phase 2: Game Analysis (Medium Impact)
5. `get-game-highlights` - Game highlights
6. `get-game-scoring-plays` - Play-by-play analysis
7. `last-game` / `next-game` - Team schedule helpers

### Phase 3: Advanced Analytics (Nice to Have)
8. `get-game-pace` - Advanced metrics
9. `get-probable-pitchers` - Starting pitcher info
10. `get-team-leaders` - Team-specific stats

## 🎯 Implementation Approach:

1. **Extend MLBAPIClient** - Add methods for each endpoint
2. **Add MCP Tools** - Register each function as an MCP tool
3. **Maintain Consistency** - Use same patterns as existing tools
4. **Test Thoroughly** - Verify each tool works with historical data
5. **Document Usage** - Clear examples for each tool

## 📊 Expected Benefits:

- **Complete MLB Coverage** - Match all statsapi.py functionality
- **Historical Data Access** - Support for decades of baseball data  
- **Advanced Analytics** - Game-level and season-level insights
- **Player Research** - Comprehensive player lookup and stats
- **Real-time Updates** - Live game data and current standings

This will make our MCP server the most comprehensive MLB data source available for AI assistants!