# MCP Dynamic Player Comparison Tool

## Overview

The MCP (Model Context Protocol) server now includes a powerful dynamic player comparison tool that accepts player names instead of requiring pre-known player IDs. This eliminates the need to create separate test files for each comparison.

## New Tool: `compare-players-by-name`

### Description
Compare two players by searching for them by name first, then comparing their statistics. Supports MLB, NBA, and NFL with automatic player lookup, including historical legends.

### Key Features

✅ **Dynamic Name Search**: Pass player names directly - no need to look up player IDs first  
✅ **Historical Player Support**: Includes NFL legends like Barry Sanders, Franco Harris, Joe Montana, etc.  
✅ **Multi-Sport Support**: Works across MLB, NBA, and NFL  
✅ **Category-Based Filtering**: NFL supports rushing, passing, receiving, defensive stats  
✅ **Active/Inactive Search**: Can search current players, retired players, or both  
✅ **Automatic Best Match**: Selects the best match from search results  
✅ **Comprehensive Results**: Shows all search candidates and comparison details  

### Usage Examples

#### NFL Historical Comparison (Barry Sanders vs Franco Harris)
```json
{
  "tool": "compare-players-by-name",
  "arguments": {
    "league": "nfl",
    "player1Name": "Barry Sanders",
    "player2Name": "Franco Harris",
    "statGroup": "rushing",
    "activeStatus": "Both"
  }
}
```

#### MLB Current Players
```json
{
  "tool": "compare-players-by-name", 
  "arguments": {
    "league": "mlb",
    "player1Name": "Aaron Judge",
    "player2Name": "Mike Trout",
    "statGroup": "hitting",
    "season": "2023"
  }
}
```

#### NBA All-Time Comparison
```json
{
  "tool": "compare-players-by-name",
  "arguments": {
    "league": "nba", 
    "player1Name": "LeBron James",
    "player2Name": "Michael Jordan",
    "activeStatus": "Both"
  }
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `league` | enum | Yes | `'mlb'`, `'nba'`, or `'nfl'` |
| `player1Name` | string | Yes | First player's name (e.g., "Barry Sanders") |
| `player2Name` | string | Yes | Second player's name (e.g., "Franco Harris") |
| `season` | string/number | No | Season year or "career" |
| `statGroup` | string | No | MLB: hitting/pitching/fielding<br>NFL: Position (QB/RB/WR) OR Category (passing/rushing/receiving/defensive)<br>NBA: not used |
| `activeStatus` | string | No | `"Y"`=Active only, `"N"`=Inactive only, `"Both"`=Active and Inactive (default: "Both") |

### NFL Stat Groups

**Position-Based:**
- `QB` - Quarterback metrics (passing yards, TDs, completion %, QB rating, etc.)
- `RB` - Running back metrics (rushing yards, TDs, yards/carry, receptions, etc.)
- `WR` / `TE` - Receiver metrics (receptions, receiving yards, TDs, yards/reception, etc.)

**Category-Based:**
- `passing` - Passing statistics (yards, TDs, completion %, QB rating, etc.)
- `rushing` - Rushing statistics (attempts, yards, TDs, yards/carry, etc.)
- `receiving` - Receiving statistics (receptions, yards, TDs, yards/reception, etc.)
- `defensive` - Defensive statistics (tackles, sacks, interceptions, etc.)
- `general` - General statistics (games played, fumbles, etc.)
- `scoring` - Scoring statistics (total points, TDs, etc.)

### Response Format

```json
{
  "league": "nfl",
  "searchResults": {
    "player1": {
      "searchTerm": "Barry Sanders",
      "found": true,
      "candidates": [
        {
          "id": "historical_barry_sanders",
          "fullName": "Barry Sanders",
          "team": "Detroit Lions",
          "position": "Running Back",
          "active": false
        }
      ],
      "selected": {
        "id": "historical_barry_sanders", 
        "fullName": "Barry Sanders"
      }
    },
    "player2": { /* Similar structure */ }
  },
  "comparison": {
    "player1": {
      "id": "historical_barry_sanders",
      "name": "Barry Sanders",
      "stats": { /* Player 1 statistics */ }
    },
    "player2": {
      "id": "historical_franco_harris",
      "name": "Franco Harris", 
      "stats": { /* Player 2 statistics */ }
    },
    "metrics": [
      {
        "category": "Rushing Yards",
        "player1Value": 15269,
        "player2Value": 12120,
        "winner": "player1",
        "difference": 3149
      }
      // ... more metrics
    ],
    "overallWinner": "player1",
    "summary": "Barry Sanders leads in 6 out of 8 rushing categories."
  }
}
```

### Historical NFL Players Supported

The tool includes a comprehensive database of NFL legends:

- **Running Backs**: Barry Sanders, Franco Harris, Eric Dickerson, Tony Dorsett, O.J. Simpson
- **Quarterbacks**: Joe Montana, Tom Brady, Peyton Manning, Johnny Unitas, Dan Marino  
- **Wide Receivers**: Jerry Rice, Randy Moss
- **And many more...**

### Error Handling

The tool provides detailed error information:
- Player not found errors with search suggestions
- Comparison failures with specific error messages
- API connectivity issues
- Invalid parameter validation

### Technical Implementation

The tool leverages:
- **SportAPIFactory**: Unified API client creation for all leagues
- **ComparisonFactory**: Sport-specific comparison logic
- **Historical Database**: Built-in NFL legends database for retired players
- **ESPN APIs**: Live data for current NFL players
- **MLB Stats API**: Official MLB player data
- **NBA Stats API**: Official NBA player data

### Benefits Over Static Files

❌ **Before**: Required creating separate test files for each comparison  
✅ **After**: Single dynamic tool accepts any player names  

❌ **Before**: Needed to know player IDs in advance  
✅ **After**: Automatic name-to-ID resolution with search suggestions  

❌ **Before**: Limited to current players only  
✅ **After**: Supports both current and historical players seamlessly  

❌ **Before**: Separate tools per sport  
✅ **After**: Universal tool works across MLB, NBA, and NFL  

This dynamic approach makes the MCP server much more flexible and user-friendly for player comparisons across all supported sports leagues.