# NFL Dynamic Stat Categories Guide

## Overview

The NFL implementation now supports **dynamic stat categories**, similar to MLB's approach. You can compare players using either **position-based** or **category-based** filtering.

## Two Modes of Comparison

### 1. Position-Based Filtering (Original)

Compares players using metrics relevant to their position:

- **QB** - Quarterback metrics (passing, rushing, etc.)
- **RB** - Running back metrics (rushing, receiving, fumbles)
- **WR** - Wide receiver metrics (receiving, targets, etc.)
- **TE** - Tight end metrics (receiving-focused)

**Example:**
```javascript
compare-players(league='nfl', player1Id=3139477, player2Id=3918298, statGroup='QB')
```

### 2. Category-Based Filtering (New)

Compares players using ESPN's stat categories, focusing on specific aspects of performance:

- **passing** - Passing statistics only (43 stats from ESPN)
- **rushing** - Rushing statistics only (27 stats)
- **receiving** - Receiving statistics only (28 stats)
- **defensive** - Defensive statistics only (29 stats)
- **general** - General game stats (10 stats - games, fumbles)
- **scoring** - Scoring statistics only (17 stats - TDs, points)

**Example:**
```javascript
compare-players(league='nfl', player1Id=3139477, player2Id=3918298, statGroup='passing')
```

## When to Use Each Mode

### Use Position Mode When:
- Comparing players at the same position overall
- Want a mixed view of multiple stat types
- Analyzing a player's complete contribution (e.g., QB passing + rushing)

### Use Category Mode When:
- Want to focus on a specific aspect of performance
- Comparing players at different positions on one metric (e.g., rushing for QB vs RB)
- Need detailed breakdown of a specific stat category
- Analyzing specialized roles (e.g., receiving stats for RBs and WRs together)

## ESPN Stat Categories

ESPN returns **7 stat categories** for every player:

| Category | Stats | Description |
|----------|-------|-------------|
| **general** | 10 | Games played/started, fumbles |
| **passing** | 43 | Completions, yards, TDs, INTs, rating, etc. |
| **rushing** | 27 | Attempts, yards, YPC, long, TDs, big plays |
| **receiving** | 28 | Receptions, targets, yards, TDs, YPR |
| **defensive** | 29 | Tackles, sacks, INTs, forced fumbles, PD |
| **defensiveInterceptions** | 3 | INT-specific metrics |
| **scoring** | 17 | Total points, all TD types, 2-pt conversions |

## Category Metrics

### Passing Category (10 metrics)
- Games Played
- Completions
- Attempts
- Completion %
- Passing Yards
- Yards/Attempt
- Passing TDs
- Interceptions
- QB Rating
- Sacks Taken

### Rushing Category (8 metrics)
- Games Played
- Rushing Attempts
- Rushing Yards
- Yards/Carry
- Long Rush
- Rushing TDs
- 20+ Yard Rushes
- Fumbles

### Receiving Category (9 metrics)
- Games Played
- Receptions
- Targets
- Receiving Yards
- Yards/Reception
- Long Reception
- Receiving TDs
- 20+ Yard Receptions
- Fumbles

### Defensive Category (10 metrics)
- Games Played
- Total Tackles
- Solo Tackles
- Assist Tackles
- Sacks
- Sack Yards
- Tackles For Loss
- Passes Defended
- Forced Fumbles
- Fumble Recoveries

### General Category (5 metrics)
- Games Played
- Fumbles
- Fumbles Lost
- Forced Fumbles
- Fumbles Recovered

### Scoring Category (8 metrics)
- Total Points
- Touchdowns
- Rushing TDs
- Receiving TDs
- Passing TDs
- 2-Pt Pass Conversions
- 2-Pt Rush Conversions
- 2-Pt Rec Conversions

## Examples

### Example 1: Compare QBs on Passing Only
```javascript
compare-players(
  league='nfl',
  player1Id=3139477,  // Patrick Mahomes
  player2Id=3918298,  // Josh Allen
  statGroup='passing'
)
```
**Result:** Shows only passing metrics (completions, yards, TDs, INTs, etc.)

### Example 2: Compare RBs on Rushing
```javascript
compare-players(
  league='nfl',
  player1Id=3043078,  // Derrick Henry
  player2Id=3929630,  // Saquon Barkley
  statGroup='rushing'
)
```
**Result:** Shows only rushing metrics (attempts, yards, YPC, long, TDs)

### Example 3: Compare WRs on Receiving
```javascript
compare-players(
  league='nfl',
  player1Id=4431299,  // Rome Odunze
  player2Id=4429025,  // Quentin Johnston
  statGroup='receiving'
)
```
**Result:** Shows only receiving metrics (receptions, targets, yards, TDs)

### Example 4: Position-Based QB Comparison (Original)
```javascript
compare-players(
  league='nfl',
  player1Id=3139477,  // Patrick Mahomes
  player2Id=3918298,  // Josh Allen
  statGroup='QB'
)
```
**Result:** Shows mixed QB metrics (passing + rushing yards)

## Technical Implementation

### API Layer Enhancement
The `getPlayerStats()` method now accepts an optional `statCategory` parameter:

```typescript
getPlayerStats(playerId, { season: 2025, statCategory: 'passing' })
```

This filters ESPN's response to include only the requested category.

### Comparison Layer Enhancement
The `getMetricsForCategory()` method maps category names to specific metrics:

```typescript
getMetricsForCategory('PASSING') // Returns 10 passing metrics
getMetricsForCategory('RUSHING') // Returns 8 rushing metrics
```

### Backward Compatibility
The `getMetrics()` method checks categories first, then falls back to positions:

```typescript
protected getMetrics(statGroup?: string) {
  // Try category first
  const categoryMetrics = this.getMetricsForCategory(statGroup);
  if (categoryMetrics.length > 0) {
    return categoryMetrics;
  }
  
  // Fall back to position
  return this.getMetricsForPosition(statGroup);
}
```

## Comparison to MLB

The NFL category approach mirrors MLB's implementation:

| MLB | NFL |
|-----|-----|
| `hitting` | `passing`, `rushing`, `receiving` |
| `pitching` | `passing` (for QBs) |
| `fielding` | `defensive` |

Both implementations:
- Use ESPN's stat category structure
- Filter API responses by category
- Support dynamic metric selection
- Maintain backward compatibility with position/role-based filtering

## Benefits

1. **Focused Analysis**: Compare players on specific aspects of their game
2. **Cross-Position Comparisons**: Compare rushing stats for QBs, RBs, and WRs
3. **Detailed Metrics**: Access to all 43 passing stats, 27 rushing stats, etc.
4. **Consistent with MLB**: Same approach across both leagues
5. **Backward Compatible**: Existing position-based comparisons still work
6. **Discoverable**: `availableCategories` shows all options

## Future Enhancements

Potential additions:
- **Special Teams Category**: Punting, kicking, returning stats
- **Category Combinations**: Compare multiple categories at once
- **Custom Metric Sets**: User-defined metric combinations
- **Advanced Filtering**: Filter by stat thresholds within categories
