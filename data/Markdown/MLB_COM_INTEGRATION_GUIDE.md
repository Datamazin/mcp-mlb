# 🌐 MLB.com Integration Guide

## Overview

The MLB MCP Server now includes comprehensive integration with **MLB.com**, the official website of Major League Baseball. This integration provides direct access to official resources, player profiles, team pages, and all MLB.com content through structured API responses.

## 🎯 **New Tools Added:**

### 1. `get-mlb-com-links`
**Purpose**: Generate direct links to MLB.com pages for any resource type

**Supported Link Types**:
- `team` - Official team pages
- `player` - Player profile pages  
- `schedule` - Game schedules and calendar
- `standings` - Division and league standings
- `news` - News articles and analysis
- `stats` - Statistical leaders and data
- `postseason` - Playoff coverage and brackets
- `draft` - Draft coverage and prospects
- `prospects` - Minor league prospects and rankings

**Example Usage**:
```javascript
// Get Mets team page and related links
{
  "linkType": "team",
  "teamId": 121,
  "primaryUrl": "https://www.mlb.com/mets/",
  "relatedUrls": [
    {
      "title": "Schedule",
      "url": "https://www.mlb.com/mets/schedule/",
      "description": "Team schedule and game results"
    },
    {
      "title": "Roster", 
      "url": "https://www.mlb.com/mets/roster/",
      "description": "Current team roster and player profiles"
    }
    // ... more related links
  ]
}
```

### 2. `get-enhanced-player-info`
**Purpose**: Get comprehensive player information with integrated MLB.com profile links

**Features**:
- Complete player biographical data
- Current team and position information
- Direct MLB.com profile URLs (stats, game logs, bio)
- Current season statistics
- Team page links when applicable

**Example Response**:
```javascript
{
  "player": {
    "id": 624413,
    "fullName": "Pete Alonso",
    "currentTeam": { "id": 121, "name": "New York Mets" },
    "primaryPosition": { "name": "First Base" }
  },
  "mlbComLinks": {
    "profileUrl": "https://www.mlb.com/player/624413",
    "statsUrl": "https://www.mlb.com/player/624413/stats",
    "gameLogsUrl": "https://www.mlb.com/player/624413/gamelogs",
    "bioUrl": "https://www.mlb.com/player/624413/bio",
    "teamUrl": "https://www.mlb.com/mets/"
  },
  "currentStats": { /* season statistics */ }
}
```

### 3. `get-enhanced-team-info`
**Purpose**: Get comprehensive team information with integrated MLB.com team pages

**Features**:
- Complete team information (venue, league, division)
- Direct MLB.com team page URLs
- Related team resource links (schedule, roster, stats, news, tickets)
- Current division standings when available

**Example Response**:
```javascript
{
  "team": {
    "id": 121,
    "name": "New York Mets",
    "division": { "name": "National League East" },
    "venue": { "name": "Citi Field", "city": "New York" }
  },
  "mlbComLinks": {
    "teamUrl": "https://www.mlb.com/mets/",
    "scheduleUrl": "https://www.mlb.com/mets/schedule/",
    "rosterUrl": "https://www.mlb.com/mets/roster/",
    "statsUrl": "https://www.mlb.com/mets/stats/",
    "newsUrl": "https://www.mlb.com/mets/news/",
    "ticketsUrl": "https://www.mlb.com/mets/tickets/"
  },
  "currentStandings": { /* team standings data */ }
}
```

## 🏟️ **Supported Teams & URL Mappings:**

The integration supports all 30 MLB teams with their official MLB.com URL slugs:

### American League:
- **East**: Angels, Orioles, Red Sox, Yankees, Rays, Blue Jays
- **Central**: White Sox, Guardians, Tigers, Royals, Twins  
- **West**: Astros, Athletics, Mariners, Rangers

### National League:
- **East**: Braves, Marlins, Mets, Phillies, Nationals
- **Central**: Cubs, Reds, Brewers, Pirates, Cardinals
- **West**: Diamondbacks, Rockies, Dodgers, Padres, Giants

## 📊 **MLB.com Resource Categories:**

### News & Analysis
- Latest MLB news and updates
- Trade rumors and speculation
- Injury reports and player updates
- Award coverage and voting
- In-depth features and analysis

### Statistics & Leaders
- Statistical leaderboards by category
- Team statistics and rankings
- Advanced metrics and analytics
- Historical statistics and records

### Schedules & Games
- Complete MLB schedule with times
- Today's games and live scores
- Postseason schedule and results
- Spring training information

### Team Resources
- Official team homepages
- Current rosters and player profiles
- Team statistics and standings
- Latest team news and updates
- Ticket purchasing and information

### Player Profiles
- Complete player biographies
- Career statistics and achievements
- Game-by-game performance logs
- Player news and updates

### Postseason Coverage
- Interactive playoff brackets
- Postseason schedule and results
- Historical playoff information
- World Series coverage

### Prospects & Draft
- Top prospect rankings (Top 100)
- Team-by-team prospect pipelines
- MLB Draft coverage and results
- Minor league information

## 🚀 **Integration Benefits:**

### For AI Assistants:
- **Official Sources**: All links point to MLB.com official content
- **Structured Data**: Consistent API responses with metadata
- **Comprehensive Coverage**: Access to all MLB.com resource categories
- **Up-to-Date**: Links always point to current MLB.com structure

### For Developers:
- **Easy Implementation**: Simple tool calls with structured responses
- **Error Handling**: Proper fallbacks and error management
- **Scalable**: Supports all teams and players automatically
- **Maintainable**: URL mappings easily updated for MLB.com changes

### For Users:
- **Authoritative Information**: Direct access to official MLB content
- **Convenience**: One-stop access to all MLB.com resources
- **Current Data**: Always links to latest MLB.com pages
- **Complete Coverage**: Every team, player, and resource type supported

## 📋 **Usage Examples:**

### Get Yankees Team Resources:
```javascript
await mcpClient.callTool('get-mlb-com-links', {
  linkType: 'team',
  teamId: 147  // Yankees
});
```

### Get Aaron Judge Profile with MLB.com Links:
```javascript
await mcpClient.callTool('get-enhanced-player-info', {
  playerId: 592450,  // Aaron Judge
  includeMLBcomLinks: true,
  season: 2024
});
```

### Get MLB.com News Categories:
```javascript
await mcpClient.callTool('get-mlb-com-links', {
  linkType: 'news'
});
```

### Get Postseason Coverage Links:
```javascript
await mcpClient.callTool('get-mlb-com-links', {
  linkType: 'postseason'
});
```

## 🔧 **Technical Implementation:**

### URL Structure:
- **Team Pages**: `https://www.mlb.com/{team-slug}/`
- **Player Profiles**: `https://www.mlb.com/player/{player-id}`
- **Schedule**: `https://www.mlb.com/schedule/`
- **News**: `https://www.mlb.com/news/{category}`
- **Stats**: `https://www.mlb.com/stats/{category}`

### Team Slug Mapping:
All 30 MLB teams are mapped to their official MLB.com URL slugs (e.g., `mets`, `yankees`, `red-sox`, `dodgers`).

### Error Handling:
- Invalid team IDs gracefully handled
- Missing player data handled with appropriate fallbacks
- Network errors properly reported through MCP protocol

## 🎯 **Future Enhancements:**

### Potential Additions:
- **Live Content Fetching**: Scrape MLB.com content directly
- **News Integration**: Fetch and parse MLB.com news articles
- **Schedule Parsing**: Extract detailed schedule information
- **Standings Integration**: Parse live standings from MLB.com
- **Ticket Integration**: Real-time ticket availability and pricing

### API Improvements:
- **Content Caching**: Cache MLB.com content for faster responses
- **Link Validation**: Verify MLB.com links are active
- **Mobile Links**: Support for mobile.mlb.com URLs
- **Deep Linking**: Direct links to specific content sections

---

**The MLB.com integration transforms the MCP server into a comprehensive baseball information hub, providing seamless access to official MLB content while maintaining the programmatic advantages of the MCP protocol.** 🌐⚾