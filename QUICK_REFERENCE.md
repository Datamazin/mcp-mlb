# 🚀 Quick Reference Guide - New Features

## New Enhanced Comparison Script

### Basic Usage
```bash
# Compare two batters (career stats)
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso"

# Compare two pitchers (career stats)
node compare-players-enhanced.cjs "Max Scherzer" "Jacob deGrom" career pitching

# Compare specific season
node compare-players-enhanced.cjs "Shohei Ohtani" "Vladimir Guerrero Jr." 2024 hitting
```

### Syntax
```bash
node compare-players-enhanced.cjs "<Player 1 Name>" "<Player 2 Name>" [season] [statGroup]
```

**Parameters:**
- `Player 1 Name` (required): First player's name
- `Player 2 Name` (required): Second player's name
- `season` (optional): Year (e.g., "2024") or "career" (default: "career")
- `statGroup` (optional): "hitting", "pitching", or "fielding" (default: "hitting")

## What's New vs. Original Scripts

### compare-players-enhanced.cjs vs. compare-batters.cjs

| Feature | Original | Enhanced |
|---------|----------|----------|
| **Stat Types** | Hitting only | Hitting, Pitching, Fielding |
| **Architecture** | Standalone | Shared utilities with MCP server |
| **Error Handling** | Basic | Enhanced with custom error classes |
| **Code Reusability** | Script-specific | Modular, importable functions |
| **Maintainability** | Medium | High |

### Key Differences

1. **Multi-Type Support**
   - Original: Separate scripts for batters/pitchers
   - Enhanced: One script for all stat types

2. **Code Architecture**
   - Original: All logic in one file
   - Enhanced: Uses shared comparison-utils module

3. **Error Messages**
   - Original: Generic errors
   - Enhanced: Detailed error context with status codes

4. **Extensibility**
   - Original: Need to modify script directly
   - Enhanced: Can import and extend utilities

## Example Comparisons

### Example 1: Modern Power Hitters
```bash
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso"
```
**Output:** Shows Judge leading in all 5 key categories (AVG, OPS, HR, RBI, Hits)

### Example 2: Elite Pitchers (2024 Season)
```bash
node compare-players-enhanced.cjs "Max Scherzer" "Jacob deGrom" 2024 pitching
```
**Output:** Shows Scherzer 3-2 despite deGrom's better ERA (due to limited innings)

### Example 3: Historical Comparison
```bash
node compare-players-enhanced.cjs "Cecil Fielder" "Prince Fielder"
```
**Output:** Father-son comparison showing Prince's better overall stats

## Quick Comparison Matrix

### Hitting Metrics Compared
1. Batting Average (AVG)
2. On-Base Plus Slugging (OPS)
3. Home Runs
4. RBIs
5. Total Hits

### Pitching Metrics Compared
1. ERA (lower is better)
2. WHIP (lower is better)
3. Wins
4. Strikeouts
5. Innings Pitched

### Fielding Metrics Compared
1. Fielding Percentage
2. Assists
3. Putouts
4. Errors (lower is better)
5. Double Plays

## When to Use Which Script

### Use `compare-batters.cjs` when:
- ✅ You want detailed batter-specific analysis
- ✅ You need per-season rate stats
- ✅ You want team/career timeline info
- ✅ You need athleticism metrics (SB, 3B, etc.)

### Use `compare-pitchers.cjs` when:
- ✅ You want detailed pitcher-specific analysis
- ✅ You need advanced pitching metrics (K/9, BB/9, etc.)
- ✅ You want detailed ERA/WHIP analysis

### Use `compare-players-enhanced.cjs` when:
- ✅ You want a quick comparison
- ✅ You're comparing mixed stat types
- ✅ You want the same logic as the MCP server
- ✅ You're building on the comparison utilities
- ✅ You want cleaner, modular code

## All Scripts Still Work!

✅ Original scripts are **NOT replaced** - they all still work:
```bash
node compare-batters.cjs "Aaron Judge" "Pete Alonso"
node compare-pitchers.cjs "Max Scherzer" "Jacob deGrom"
```

The enhanced script is an **additional option**, not a replacement.

## Quick Troubleshooting

### Error: "No players found"
**Solution:** Check spelling and try full name
```bash
# ❌ Wrong
node compare-players-enhanced.cjs "Judge" "Alonso"

# ✅ Right
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso"
```

### Error: "No stats found"
**Solution:** Make sure player has stats in that season/type
```bash
# ❌ Position player as pitcher
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso" career pitching

# ✅ Correct stat type
node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso" career hitting
```

### Multiple Players Found
The script will automatically use the first match and display who it's using.

## Advanced Tips

### 1. Compare Different Positions
```bash
# Catcher vs Catcher
node compare-players-enhanced.cjs "Gary Carter" "Thurman Munson"

# First Base vs First Base  
node compare-players-enhanced.cjs "Cecil Fielder" "Prince Fielder"
```

### 2. Era Comparisons
```bash
# Modern vs Modern
node compare-players-enhanced.cjs "Mike Trout" "Mookie Betts"

# Historical vs Historical
node compare-players-enhanced.cjs "Babe Ruth" "Lou Gehrig"
```

### 3. Season-Specific Analysis
```bash
# Compare specific MVP years
node compare-players-enhanced.cjs "Aaron Judge" "Shohei Ohtani" 2024 hitting
```

## Files Reference

### New Files
- `src/comparison-utils.ts` - Shared comparison logic
- `compare-players-enhanced.cjs` - Enhanced CLI script
- `IMPROVEMENTS.md` - Detailed documentation
- `CODE_INTEGRATION_SUMMARY.md` - Integration report
- `INTEGRATION_COMPLETE.md` - Success summary
- `QUICK_REFERENCE.md` - This file

### Modified Files
- `src/mlb-api.ts` - Enhanced error handling + bug fix
- `src/index.ts` - New compare-players MCP tool

### Unchanged Files
- ✅ `compare-batters.cjs` - Still works
- ✅ `compare-pitchers.cjs` - Still works
- ✅ All test scripts - Still work
- ✅ All other utilities - Still work

## Command Cheat Sheet

```bash
# Build TypeScript
npm run build

# Enhanced comparisons
node compare-players-enhanced.cjs "Player 1" "Player 2" [season] [type]

# Original comparisons (still work!)
node compare-batters.cjs "Batter 1" "Batter 2"
node compare-pitchers.cjs "Pitcher 1" "Pitcher 2"

# Start MCP server
npm start
```

## Need More Help?

1. **Architecture Details:** See `IMPROVEMENTS.md`
2. **Integration Info:** See `CODE_INTEGRATION_SUMMARY.md`
3. **Success Report:** See `INTEGRATION_COMPLETE.md`
4. **Quick Reference:** This file!

---

**Happy Comparing! ⚾**
