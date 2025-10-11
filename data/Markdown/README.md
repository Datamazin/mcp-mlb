# MLB MCP Server

A Model Context Protocol (MCP) server that provides access to Major League Baseball data through the MLB Stats API. This server enables AI applications to retrieve team information, player statistics, game schedules, live scores, and historical baseball data.

## Features

### Tools Available

- **get-standings**: Get current MLB standings by league or division
- **get-team-info**: Get detailed information about an MLB team  
- **get-player-stats**: Get statistics for an MLB player
- **get-schedule**: Get MLB game schedule for a specific date range
- **get-live-game**: Get live game data including current score, inning, and play-by-play
- **search-players**: Search for MLB players by name
- **visualize-player-stats**: Generate charts for game-by-game player statistics

### 📁 File Organization

- **Documentation**: All markdown files are stored in `data/Markdown/`
- **Visualizations**: All generated charts are stored in `data/visualizations/`
- **Utilities**: Helper functions available in `utils/file-manager.cjs`

### Data Sources

This server uses the official MLB Stats API (`https://statsapi.mlb.com/api/v1`) to provide:

- Real-time game scores and status
- Current team standings
- Player statistics (batting, pitching, fielding)
- Game schedules and results
- Team and player information
- Historical data

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage

### As a Standalone Server

```bash
npm run start
```

### With Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mlb": {
      "command": "node",
      "args": ["path/to/mcp-mlb/build/index.js"]
    }
  }
}
```

### With MCP Inspector

Test the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Examples

### Get Current Standings

```javascript
// Get all standings
await callTool('get-standings', {});

// Get American League standings only
await callTool('get-standings', { leagueId: 103 });

// Get NL East standings only  
await callTool('get-standings', { divisionId: 204 });
```

### Get Team Information

```javascript
// Get information about the Yankees (team ID 147)
await callTool('get-team-info', { 
  teamId: 147,
  hydrate: "venue,league,division"
});
```

### Search for Players

```javascript
// Search for players named "Ohtani"
await callTool('search-players', { 
  name: "Ohtani",
  activeStatus: "Y" 
});
```

### Get Player Statistics

```javascript
// Get current season stats for a player
await callTool('get-player-stats', { 
  playerId: 660271,  // Shohei Ohtani's ID
  season: 2024 
});
```

### Get Today's Games

```javascript
// Get today's schedule
await callTool('get-schedule', { 
  startDate: "2024-10-11" 
});

// Get schedule for a specific team
await callTool('get-schedule', { 
  startDate: "2024-10-11",
  teamId: 147  // Yankees
});
```

### Get Live Game Data

```javascript
// Get live data for a specific game
await callTool('get-live-game', { 
  gamePk: 775263 
});
```

## Common Team IDs

| Team | ID |
|------|----| 
| Angels | 108 |
| Astros | 117 |
| Athletics | 133 |
| Blue Jays | 141 |
| Braves | 144 |
| Brewers | 158 |
| Cardinals | 138 |
| Cubs | 112 |
| Diamondbacks | 109 |
| Dodgers | 119 |
| Giants | 137 |
| Guardians | 114 |
| Mariners | 136 |
| Marlins | 146 |
| Mets | 121 |
| Nationals | 120 |
| Orioles | 110 |
| Padres | 135 |
| Phillies | 143 |
| Pirates | 134 |
| Rangers | 140 |
| Rays | 139 |
| Red Sox | 111 |
| Reds | 113 |
| Rockies | 115 |
| Royals | 118 |
| Tigers | 116 |
| Twins | 142 |
| White Sox | 145 |
| Yankees | 147 |

## League and Division IDs

### Leagues
- American League: 103
- National League: 104

### Divisions
- AL West: 200
- AL East: 201  
- AL Central: 202
- NL West: 203
- NL East: 204
- NL Central: 205

## Development

### Watch Mode

```bash
npm run watch
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## API Reference

All tools return structured data that includes both human-readable content and machine-parseable structured content. Error handling is built-in with descriptive error messages.

### Error Handling

The server includes comprehensive error handling:
- API request failures
- Invalid parameters
- Network timeouts
- Data parsing errors

All errors are returned in a standardized format with descriptive messages.

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the MLB Stats API documentation
- Review the MCP specification
- File an issue on GitHub