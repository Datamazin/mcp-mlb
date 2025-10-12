# Dynamic Script Architecture Implementation Guide

**Constitution Reference**: MLB MCP Server Constitution v2.1.0 - Principle VI: Dynamic Script Architecture

## Overview

This guide demonstrates how to refactor single-use, player-specific scripts into dynamic, reusable tools that comply with the MLB MCP Server Constitution and leverage MLB-StatsAPI patterns.

## Constitutional Requirements

### ❌ VIOLATION Examples (Anti-Patterns)
```bash
pete-alonso-power-analysis.js    # Player-specific file name
aaron-judge-monthly-stats.js     # Single-use implementation
mets-2024-roster.js             # Team/year specific script
```

### ✅ COMPLIANT Examples (Dynamic Architecture)
```bash
analyze-player-power-stats.js    # Dynamic player analysis
get-player-monthly-stats.js      # Variable player/season support
get-team-roster.js              # Dynamic team/year queries
```

## Refactoring Example: Pete Alonso → Dynamic Player Analysis

### Original Script Issues
```javascript
// ❌ Constitutional violations in pete-alonso-power-analysis.js:
const peteAlonsoId = 624413;  // Hardcoded player
async function analyzePeteAlonsoPowerStats(season = 2024) // Single player function
```

### Refactored Dynamic Implementation
```javascript
// ✅ Constitution-compliant analyze-player-power-stats.js:
async function analyzePlayerPowerStats(playerName, season, gameType) // Dynamic parameters
const searchResults = await client.searchPlayers(playerName);        // Real-time lookup
const metaData = await client.getMeta('gameTypes');                  // Metadata validation
```

## Implementation Checklist

### 🎯 MLB-StatsAPI Reference Compliance
- [ ] Research equivalent functionality in [MLB-StatsAPI wiki](https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints)
- [ ] Follow proven patterns for endpoint usage and error handling
- [ ] Implement MLB-StatsAPI style caching and performance optimizations

### 🔄 Dynamic Parameter Support
- [ ] Accept player/team names as command-line arguments
- [ ] Support season year parameter with reasonable defaults
- [ ] Include game type parameter with metadata validation
- [ ] Provide comprehensive help documentation

### 🎪 Real-time API Validation
- [ ] Use `client.searchPlayers()` for dynamic player lookup
- [ ] Validate game types using `client.getMeta('gameTypes')`
- [ ] Include fallback to known player databases
- [ ] Provide helpful error messages with suggestions

### 📊 Enhanced Output
- [ ] Include player name in output headers
- [ ] Show parameter values used (season, game type)
- [ ] Provide visual representations when applicable
- [ ] Include data source attribution

## Script Template Structure

```javascript
/**
 * [Feature] - Dynamic Version
 * 
 * References:
 * - MLB-StatsAPI: https://github.com/toddrob99/MLB-StatsAPI
 * - Endpoints: https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints
 * 
 * Usage: node [script-name].js "Parameter" YYYY [gameType]
 */

import { MLBAPIClient } from './build/mlb-api.js';

async function dynamicFunction(param1, param2, param3 = 'default') {
  // 1. MLB-StatsAPI pattern research and setup
  // 2. Dynamic parameter validation with metadata
  // 3. Real-time API queries with fallbacks
  // 4. Enhanced output with parameter context
  // 5. Error handling with helpful suggestions
}

// Command line argument parsing
const args = process.argv.slice(2);
const param1 = args[0] || 'Default Value';
const param2 = parseInt(args[1]) || new Date().getFullYear();
const param3 = args[2] || 'R';

// Help documentation
if (args.length === 0) {
  console.log('Usage examples and parameter documentation');
}

// Parameter validation
if (/* validation logic */) {
  console.log('Error message with suggestions');
  process.exit(1);
}

// Execute dynamic function
dynamicFunction(param1, param2, param3).catch(console.error);
```

## Migration Strategy

### Phase 1: Audit Existing Scripts
```bash
# Find constitutional violations
find . -name "*-alonso-*.js" -o -name "*-judge-*.js" -o -name "*-2024-*.js"

# Examples requiring refactoring:
pete-alonso-power-analysis.js → analyze-player-power-stats.js
aaron-judge-monthly-stats.js → get-player-monthly-stats.js  
mets-2024-homerun-leaders.js → get-team-homerun-leaders.js
```

### Phase 2: Refactor to Dynamic Architecture
1. **Rename files** to reflect dynamic capability
2. **Add parameter support** for variable queries
3. **Implement metadata validation** using MLB API
4. **Add MLB-StatsAPI pattern** compliance
5. **Include comprehensive help** documentation

### Phase 3: Validation
1. **Test with multiple players/teams** to ensure dynamics work
2. **Verify metadata-driven validation** functions correctly
3. **Confirm MLB-StatsAPI pattern** compliance
4. **Validate error handling** with invalid parameters

## Benefits of Dynamic Architecture

### 🚀 Scalability
- Single script handles unlimited players/teams/seasons
- Reduced code duplication and maintenance burden
- Consistent interfaces across all analysis tools

### 🎯 User Experience
- Comprehensive help documentation
- Intelligent parameter validation
- Helpful error messages with suggestions

### 🏗️ Architecture
- MLB-StatsAPI pattern compliance ensures proven reliability
- Metadata-driven design stays current with MLB API changes
- Real-time validation prevents stale data issues

## Real-World Example Usage

```bash # Constitutional compliance in action:

# ❌ OLD: Multiple single-use scripts
node pete-alonso-power-analysis.js
node aaron-judge-power-analysis.js
node vladimir-guerrero-power-analysis.js

# ✅ NEW: One dynamic script handles all players
node analyze-player-power-stats.js "Pete Alonso" 2024
node analyze-player-power-stats.js "Aaron Judge" 2024 R
node analyze-player-power-stats.js "Vladimir Guerrero Jr" 2023 P
```

## Constitution Compliance Verification

✅ **Dynamic API-First Development**: Uses real-time MLB API queries
✅ **MLB Metadata-Driven Architecture**: Validates parameters with `/meta` endpoints  
✅ **Comprehensive Game Type Support**: Supports all MLB game types
✅ **Real-time API Validation**: Live player search and parameter validation
✅ **MLB-StatsAPI Reference Architecture**: Follows proven patterns and endpoints
✅ **Dynamic Script Architecture**: Variable parameters, no single-use implementations
✅ **Official MLB.com Integration**: Can be extended with official resource links

This approach ensures all scripts are constitutional, scalable, and maintainable while leveraging the proven patterns of the MLB-StatsAPI project.