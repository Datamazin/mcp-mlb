#!/usr/bin/env node
/**
 * Multi-Sport MCP Server (MLB + NBA + NFL)
 *
 * This server provides comprehensive access to MLB, NBA, and NFL data through the Model Context Protocol.
 * It offers tools for retrieving team information, player statistics, game schedules,
 * live scores, and historical data using official APIs.
 *
 * Supported Leagues:
 * - MLB (Major League Baseball) - MLB Stats API
 * - NBA (National Basketball Association) - NBA.com Stats API
 * - NFL (National Football League) - ESPN NFL API
 *
 * Resources:
 * - MLB Stats API: https://statsapi.mlb.com/
 * - MLB.com Official Site: https://www.mlb.com/
 * - NBA Stats API: https://stats.nba.com/stats/
 * - NBA.com Official Site: https://www.nba.com/
 * - ESPN NFL API: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 * - ESPN.com Official Site: https://www.espn.com/nfl/
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MLBAPIClient } from './mlb-api.js';
import { comparePlayers, formatComparisonResult } from './comparison-utils.js';
import { SportAPIFactory } from './api/sport-api-factory.js';
import { ComparisonFactory } from './comparison/comparison-factory.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';
import path from 'path';
const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
// Game Type Constants - Comprehensive MLB Game Type Support
const GAME_TYPES = {
    // Regular Season
    'R': 'Regular Season',
    'E': 'Exhibition',
    'S': 'Spring Training',
    'F': 'Fall League',
    'A': 'All-Star Game',
    'I': 'Intrasquad',
    // Postseason
    'P': 'Playoffs (All)',
    'D': 'Division Series',
    'L': 'League Championship',
    'W': 'World Series',
    'WC': 'Wild Card',
    // Special Games
    'ASGHR': 'All-Star Home Run Derby',
    'WBC': 'World Baseball Classic',
    'CWS': 'College World Series'
};
// Game Type Schema for consistent validation
const gameTypeSchema = z.enum(['R', 'E', 'S', 'F', 'A', 'I', 'P', 'D', 'L', 'W', 'WC', 'ASGHR', 'WBC', 'CWS'])
    .default('R')
    .describe(`Game type: ${Object.entries(GAME_TYPES).map(([key, value]) => `${key}=${value}`).join(', ')}`);
// Create the MCP server
const server = new McpServer({
    name: 'multi-sport-mcp-server',
    version: '2.0.0',
});
// Initialize MLB API client
const mlbClient = new MLBAPIClient(MLB_API_BASE);
/**
 * Tool: Get team roster for any season (supports historical data)
 */
server.registerTool('get-team-roster', {
    title: 'Get Team Roster',
    description: 'Get team roster for any year (supports historical data back to 1970s+)',
    inputSchema: {
        teamName: z.string().describe('Team name (e.g., "mets", "yankees", "dodgers")'),
        season: z.number().optional().describe('Season year (supports historical data, defaults to current year)')
    },
    outputSchema: {
        team: z.string(),
        season: z.number(),
        totalPlayers: z.number(),
        positionPlayers: z.array(z.object({
            name: z.string(),
            id: z.number(),
            position: z.string(),
            jerseyNumber: z.string().optional()
        })),
        pitchers: z.array(z.object({
            name: z.string(),
            id: z.number(),
            position: z.string(),
            jerseyNumber: z.string().optional()
        }))
    }
}, async (input) => {
    const { teamName, season = new Date().getFullYear() } = input;
    // MLB team ID mapping
    const MLB_TEAMS = {
        'orioles': 110, 'red sox': 111, 'yankees': 147, 'rays': 139, 'blue jays': 142,
        'white sox': 145, 'guardians': 114, 'tigers': 116, 'royals': 118, 'twins': 142,
        'astros': 117, 'angels': 108, 'athletics': 133, 'mariners': 136, 'rangers': 140,
        'braves': 144, 'marlins': 146, 'mets': 121, 'phillies': 143, 'nationals': 120,
        'cubs': 112, 'reds': 113, 'brewers': 158, 'pirates': 134, 'cardinals': 138,
        'diamondbacks': 109, 'rockies': 115, 'dodgers': 119, 'padres': 135, 'giants': 137
    };
    const normalizedTeam = teamName.toLowerCase().trim();
    const teamId = MLB_TEAMS[normalizedTeam];
    if (!teamId) {
        throw new Error(`Team "${teamName}" not found. Available teams: ${Object.keys(MLB_TEAMS).join(', ')}`);
    }
    try {
        const response = await mlbClient.getTeamRoster(teamId, season);
        const players = response.roster || [];
        if (players.length === 0) {
            throw new Error(`No roster data found for ${teamName} in ${season}. Historical roster data may not be available for this year.`);
        }
        const positionPlayers = players.filter((p) => p.position && !['P'].includes(p.position.abbreviation)).map((p) => ({
            name: p.person.fullName,
            id: p.person.id,
            position: p.position.name,
            jerseyNumber: p.jerseyNumber || 'N/A'
        }));
        const pitchers = players.filter((p) => p.position && p.position.abbreviation === 'P').map((p) => ({
            name: p.person.fullName,
            id: p.person.id,
            position: p.position.name,
            jerseyNumber: p.jerseyNumber || 'N/A'
        }));
        const output = {
            team: teamName.charAt(0).toUpperCase() + teamName.slice(1),
            season,
            totalPlayers: players.length,
            positionPlayers,
            pitchers
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching team roster: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get current MLB team standings
 */
server.registerTool('get-standings', {
    title: 'Get MLB Standings',
    description: 'Get current MLB standings by league or division with support for all game types including playoffs',
    inputSchema: {
        leagueId: z.number().optional().describe('League ID (103=AL, 104=NL)'),
        divisionId: z.number().optional().describe('Division ID (200=AL West, 201=AL East, 202=AL Central, 203=NL West, 204=NL East, 205=NL Central)'),
        standingsType: z.string().default('regularSeason').describe('Type of standings (regularSeason, springTraining, firstHalf, secondHalf, wildCard, divisionLeaders)'),
        season: z.number().optional().describe('Season year (defaults to current year)'),
        gameType: gameTypeSchema.describe('Game type for standings context (affects which games are included)')
    },
    outputSchema: {
        standings: z.array(z.object({
            team: z.string(),
            wins: z.number(),
            losses: z.number(),
            winningPercentage: z.string(),
            gamesBack: z.string(),
            division: z.string(),
            league: z.string()
        }))
    }
}, async ({ leagueId, divisionId, standingsType = 'regularSeason', season, gameType = 'R' }) => {
    try {
        const standings = await mlbClient.getStandings({
            leagueId,
            divisionId,
            standingsType,
            season,
            gameType
        });
        const output = { standings };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching standings: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get team information
 */
server.registerTool('get-team-info', {
    title: 'Get Team Information',
    description: 'Get detailed information about an MLB team',
    inputSchema: {
        teamId: z.number().describe('MLB Team ID'),
        hydrate: z.string().optional().describe('Additional data to include (e.g., "venue,league,division")')
    },
    outputSchema: {
        id: z.number(),
        name: z.string(),
        teamName: z.string(),
        locationName: z.string(),
        abbreviation: z.string(),
        league: z.object({
            id: z.number(),
            name: z.string()
        }),
        division: z.object({
            id: z.number(),
            name: z.string()
        }),
        venue: z.object({
            id: z.number(),
            name: z.string(),
            city: z.string(),
            state: z.string().optional()
        }).optional()
    }
}, async ({ teamId, hydrate }) => {
    try {
        const teamInfo = await mlbClient.getTeamInfo(teamId, hydrate);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(teamInfo, null, 2)
                }],
            structuredContent: teamInfo
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching team info: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get player statistics with dynamic stat types
 * Constitutional Compliance: Dynamic API-First Development
 */
server.registerTool('get-player-stats', {
    title: 'Get Player Statistics',
    description: 'Get statistics for an MLB player with configurable stat types',
    inputSchema: {
        playerId: z.number().describe('MLB Player ID'),
        season: z.number().optional().describe('Season year (defaults to current year)'),
        gameType: gameTypeSchema,
        stats: z.string().optional().describe('Stat type: season, career, gameLog, advanced, seasonAdvanced, careerAdvanced, byMonth, homeAndAway, statSplits, vsPlayer, lastXGames, etc. (defaults to season)')
    },
    outputSchema: {
        player: z.object({
            id: z.number(),
            fullName: z.string(),
            primaryPosition: z.object({
                code: z.string(),
                name: z.string(),
                type: z.string()
            })
        }),
        stats: z.array(z.object({
            type: z.object({
                displayName: z.string()
            }),
            group: z.object({
                displayName: z.string()
            }),
            stats: z.record(z.any())
        }))
    }
}, async ({ playerId, season, gameType = 'R', stats = 'season' }) => {
    try {
        const playerStats = await mlbClient.getPlayerStats(playerId, season, gameType, stats);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(playerStats, null, 2)
                }],
            structuredContent: playerStats
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching player stats: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get game schedule
 */
server.registerTool('get-schedule', {
    title: 'Get Game Schedule',
    description: 'Get MLB game schedule for a specific date range with support for all game types',
    inputSchema: {
        startDate: z.string().describe('Start date (YYYY-MM-DD format)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD format, defaults to startDate)'),
        teamId: z.number().optional().describe('Filter by specific team ID'),
        gameType: gameTypeSchema
    },
    outputSchema: {
        totalGames: z.number(),
        games: z.array(z.object({
            gamePk: z.number(),
            gameDate: z.string(),
            status: z.object({
                abstractGameState: z.string(),
                codedGameState: z.string(),
                detailedState: z.string()
            }),
            teams: z.object({
                away: z.object({
                    team: z.object({
                        id: z.number(),
                        name: z.string()
                    }),
                    score: z.number().optional()
                }),
                home: z.object({
                    team: z.object({
                        id: z.number(),
                        name: z.string()
                    }),
                    score: z.number().optional()
                })
            }),
            venue: z.object({
                id: z.number(),
                name: z.string()
            })
        }))
    }
}, async ({ startDate, endDate, teamId, gameType = 'R' }) => {
    try {
        let schedule;
        // Use postseason endpoint for playoff game types
        const playoffGameTypes = ['P', 'D', 'L', 'W', 'WC'];
        if (playoffGameTypes.includes(gameType)) {
            // Extract season from startDate
            const season = new Date(startDate).getFullYear();
            schedule = await mlbClient.getPostseasonSchedule(season);
            // Filter by date range if specified
            if (schedule.dates) {
                const start = new Date(startDate);
                const end = new Date(endDate || startDate);
                schedule.dates = schedule.dates.filter((dateData) => {
                    const gameDate = new Date(dateData.date);
                    return gameDate >= start && gameDate <= end;
                });
            }
        }
        else {
            // Use regular schedule endpoint
            schedule = await mlbClient.getSchedule({
                startDate,
                endDate: endDate || startDate,
                teamId,
                gameType
            });
        }
        const output = {
            totalGames: schedule.totalItems || schedule.dates?.reduce((total, date) => total + (date.games?.length || 0), 0) || 0,
            games: schedule.dates?.flatMap((date) => date.games) || []
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching schedule: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get live game data
 */
server.registerTool('get-live-game', {
    title: 'Get Live Game Data',
    description: 'Get live game data including current score, inning, and play-by-play',
    inputSchema: {
        gamePk: z.number().describe('Game primary key ID')
    },
    outputSchema: {
        gamePk: z.number(),
        gameDate: z.string(),
        status: z.object({
            abstractGameState: z.string(),
            detailedState: z.string(),
            inning: z.number().optional(),
            inningState: z.string().optional()
        }),
        teams: z.object({
            away: z.object({
                team: z.object({
                    id: z.number(),
                    name: z.string()
                }),
                score: z.number(),
                hits: z.number(),
                errors: z.number()
            }),
            home: z.object({
                team: z.object({
                    id: z.number(),
                    name: z.string()
                }),
                score: z.number(),
                hits: z.number(),
                errors: z.number()
            })
        }),
        linescore: z.object({
            innings: z.array(z.object({
                num: z.number(),
                away: z.object({ runs: z.number().optional() }),
                home: z.object({ runs: z.number().optional() })
            }))
        }).optional()
    }
}, async ({ gamePk }) => {
    try {
        const liveGame = await mlbClient.getLiveGame(gamePk);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(liveGame, null, 2)
                }],
            structuredContent: liveGame
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching live game data: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * UNIVERSAL TOOL: Search players across all sports
 */
server.registerTool('search-players', {
    title: 'Search Players (Universal)',
    description: 'Search for players by name across MLB, NBA, or NFL',
    inputSchema: {
        league: z.enum(['mlb', 'nba', 'nfl']).default('mlb').describe('League to search (mlb, nba, nfl)'),
        name: z.string().describe('Player name to search for'),
        activeStatus: z.string().default('Y').describe('Player active status (Y=Active, N=Inactive) - MLB only')
    },
    outputSchema: {
        league: z.string(),
        players: z.array(z.object({
            id: z.number(),
            fullName: z.string(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            primaryNumber: z.string().optional(),
            currentTeam: z.object({
                id: z.number(),
                name: z.string()
            }).optional(),
            primaryPosition: z.object({
                code: z.string().optional(),
                name: z.string(),
                type: z.string().optional()
            }).optional(),
            birthDate: z.string().optional(),
            currentAge: z.number().optional(),
            height: z.string().optional(),
            weight: z.number().optional(),
            active: z.boolean().optional()
        }))
    }
}, async ({ league = 'mlb', name, activeStatus = 'Y' }) => {
    try {
        const apiClient = SportAPIFactory.getClient(league);
        const searchResults = await apiClient.searchPlayers(name, activeStatus);
        // MLB returns {people: [...]}
        // NBA returns [...] directly
        const players = searchResults.people || searchResults || [];
        const output = { league, players };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error searching players in ${league.toUpperCase()}: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * UNIVERSAL TOOL: Compare two players across all sports
 */
server.registerTool('compare-players', {
    title: 'Compare Two Players (Universal)',
    description: 'Compare statistics between two players in MLB, NBA, or NFL with sport-specific metrics. NFL supports both position-based (QB, RB, WR) and category-based (passing, rushing, receiving, defensive) comparisons.',
    inputSchema: {
        league: z.enum(['mlb', 'nba', 'nfl']).default('mlb').describe('League (mlb, nba, nfl)'),
        player1Id: z.number().describe('First player\'s ID'),
        player2Id: z.number().describe('Second player\'s ID'),
        season: z.union([z.string(), z.number()]).optional().describe('Season year or "career" (NBA ignores season, NFL auto-detects if omitted)'),
        statGroup: z.string().optional().describe('MLB: hitting/pitching/fielding | NFL: Position (QB/RB/WR/TE) OR Category (passing/rushing/receiving/defensive/general/scoring) | NBA: not used')
    },
    outputSchema: {
        league: z.string(),
        player1: z.object({
            id: z.number(),
            name: z.string(),
            stats: z.record(z.any())
        }),
        player2: z.object({
            id: z.number(),
            name: z.string(),
            stats: z.record(z.any())
        }),
        comparison: z.array(z.object({
            category: z.string(),
            player1Value: z.number(),
            player2Value: z.number(),
            winner: z.enum(['player1', 'player2', 'tie']),
            difference: z.number()
        })),
        overallWinner: z.enum(['player1', 'player2', 'tie']).optional(),
        summary: z.string()
    }
}, async ({ league = 'mlb', player1Id, player2Id, season, statGroup }) => {
    try {
        let result;
        let formattedText;
        if (league === 'mlb') {
            // MLB uses legacy comparison utils (backward compatibility)
            const mlbStatGroup = (statGroup === 'hitting' || statGroup === 'pitching' || statGroup === 'fielding')
                ? statGroup
                : 'hitting';
            result = await comparePlayers(mlbClient, player1Id, player2Id, season || 'career', mlbStatGroup);
            formattedText = formatComparisonResult(result);
        }
        else if (league === 'nfl') {
            // NFL uses new comparison factory with season and position
            const comparison = ComparisonFactory.getComparison(league);
            // Pass season as number (or undefined for auto-detect) and statGroup as position
            const seasonYear = season && season !== 'career' ? Number(season) : undefined;
            result = await comparison.comparePlayers(player1Id, player2Id, seasonYear, statGroup);
            result = { league, ...result };
            formattedText = `Player Comparison (${league.toUpperCase()})\n\n` +
                `${result.player1.name} vs ${result.player2.name}\n` +
                `Winner: ${result.overallWinner === 'player1' ? result.player1.name : result.overallWinner === 'player2' ? result.player2.name : 'TIE'}\n` +
                `${result.summary}\n\n` +
                JSON.stringify(result, null, 2);
        }
        else {
            // NBA uses new comparison factory (always career stats)
            const comparison = ComparisonFactory.getComparison(league);
            result = await comparison.comparePlayers(player1Id, player2Id);
            result = { league, ...result };
            formattedText = `Player Comparison (${league.toUpperCase()})\n\n` + JSON.stringify(result, null, 2);
        }
        return {
            content: [{
                    type: 'text',
                    text: formattedText
                }],
            structuredContent: result
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error comparing players in ${league.toUpperCase()}: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get box score data
 */
server.registerTool('get-box-score', {
    title: 'Get Game Box Score',
    description: 'Get detailed box score data for a specific game',
    inputSchema: {
        gamePk: z.number().describe('Game primary key ID')
    },
    outputSchema: {
        gamePk: z.number().optional(),
        gameDate: z.string().optional(),
        teams: z.object({
            away: z.object({
                team: z.object({
                    id: z.number(),
                    name: z.string()
                }).optional(),
                teamStats: z.record(z.any()).optional(),
                players: z.record(z.any()).optional()
            }).optional(),
            home: z.object({
                team: z.object({
                    id: z.number(),
                    name: z.string()
                }).optional(),
                teamStats: z.record(z.any()).optional(),
                players: z.record(z.any()).optional()
            }).optional()
        }).optional()
    }
}, async ({ gamePk }) => {
    try {
        const boxScore = await mlbClient.getBoxScore(gamePk);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(boxScore, null, 2)
                }],
            structuredContent: boxScore
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching box score: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get player game logs
 */
server.registerTool('get-player-game-logs', {
    title: 'Get Player Game Logs',
    description: 'Get game-by-game statistics for a player in a season',
    inputSchema: {
        playerId: z.number().describe('MLB Player ID'),
        season: z.number().optional().describe('Season year (defaults to current year)'),
        gameType: gameTypeSchema
    },
    outputSchema: {
        player: z.object({
            id: z.number(),
            fullName: z.string()
        }),
        gameLogs: z.array(z.object({
            date: z.string(),
            opponent: z.string(),
            gameNumber: z.number(),
            stats: z.record(z.any())
        }))
    }
}, async ({ playerId, season, gameType = 'R' }) => {
    try {
        const gameLogsData = await mlbClient.getPlayerGameLogs(playerId, season, gameType);
        // Transform the API response to match expected schema
        const gameLogs = [];
        if (gameLogsData.stats && gameLogsData.stats.length > 0) {
            const gameLogStats = gameLogsData.stats.find((stat) => stat.type && stat.type.displayName &&
                stat.type.displayName.toLowerCase().includes('gamelog'));
            if (gameLogStats && gameLogStats.splits) {
                for (const split of gameLogStats.splits) {
                    gameLogs.push({
                        date: split.date || split.gameDate || 'Unknown',
                        opponent: `${split.isHome ? 'vs' : '@'} ${split.opponent?.name || 'Unknown'}`,
                        gameNumber: split.game?.gamePk || 0,
                        stats: split.stat || {}
                    });
                }
            }
        }
        const output = {
            player: {
                id: playerId,
                fullName: gameLogsData.player?.fullName || 'Unknown Player'
            },
            gameLogs
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching player game logs: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get enhanced schedule with game PKs
 */
server.registerTool('get-schedule-with-games', {
    title: 'Get Schedule with Game Details',
    description: 'Get MLB game schedule with game PKs for box score retrieval with support for all game types',
    inputSchema: {
        startDate: z.string().describe('Start date (YYYY-MM-DD format)'),
        endDate: z.string().optional().describe('End date (YYYY-MM-DD format, defaults to startDate)'),
        teamId: z.number().optional().describe('Filter by specific team ID'),
        gameType: gameTypeSchema
    },
    outputSchema: {
        totalGames: z.number(),
        games: z.array(z.object({
            gamePk: z.number(),
            gameDate: z.string(),
            status: z.object({
                abstractGameState: z.string(),
                detailedState: z.string()
            }),
            teams: z.object({
                away: z.object({
                    team: z.object({
                        id: z.number(),
                        name: z.string()
                    })
                }),
                home: z.object({
                    team: z.object({
                        id: z.number(),
                        name: z.string()
                    })
                })
            }),
            venue: z.object({
                id: z.number(),
                name: z.string()
            })
        }))
    }
}, async ({ startDate, endDate, teamId, gameType = 'R' }) => {
    try {
        const schedule = await mlbClient.getScheduleWithGamePks({
            startDate,
            endDate: endDate || startDate,
            teamId,
            gameType
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(schedule, null, 2)
                }],
            structuredContent: schedule
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching enhanced schedule: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Visualize player game-by-game statistics
 */
server.registerTool('visualize-player-stats', {
    title: 'Visualize Player Game-by-Game Statistics',
    description: 'Generate line chart or bar chart visualizations of player game-by-game statistical data',
    inputSchema: {
        playerId: z.number().describe('MLB Player ID'),
        season: z.number().describe('Season year'),
        gameType: gameTypeSchema,
        statCategory: z.enum(['hits', 'runs', 'rbi', 'homeRuns', 'doubles', 'triples', 'strikeOuts', 'baseOnBalls', 'atBats', 'avg']).describe('Statistical category to visualize'),
        chartType: z.enum(['line', 'bar']).default('line').describe('Type of chart (line or bar)'),
        title: z.string().optional().describe('Custom chart title'),
        saveToFile: z.boolean().default(true).describe('Save chart to data/visualizations folder'),
        filename: z.string().optional().describe('Custom filename (without extension)')
    }
}, async (request) => {
    try {
        const { playerId, season, gameType = 'R', statCategory, chartType = 'line', title, saveToFile = true, filename } = request;
        // Get player game logs
        const gameLogData = await mlbClient.getPlayerGameLogs(playerId, season, gameType);
        if (!gameLogData || !gameLogData.stats || gameLogData.stats.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `No game logs found for player ${playerId} in ${season}`
                    }],
                isError: true
            };
        }
        const gameLogs = gameLogData.stats[0].splits;
        if (!gameLogs || gameLogs.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `No game log entries found for player ${playerId} in ${season}`
                    }],
                isError: true
            };
        }
        // Extract the requested statistic from each game
        const gameData = [];
        const gameLabels = [];
        let statSum = 0;
        let validGames = 0;
        gameLogs.forEach((game, index) => {
            if (game.stat) {
                let statValue;
                switch (statCategory) {
                    case 'hits':
                        statValue = game.stat.hits || 0;
                        break;
                    case 'runs':
                        statValue = game.stat.runs || 0;
                        break;
                    case 'rbi':
                        statValue = game.stat.rbi || 0;
                        break;
                    case 'homeRuns':
                        statValue = game.stat.homeRuns || 0;
                        break;
                    case 'doubles':
                        statValue = game.stat.doubles || 0;
                        break;
                    case 'triples':
                        statValue = game.stat.triples || 0;
                        break;
                    case 'strikeOuts':
                        statValue = game.stat.strikeOuts || 0;
                        break;
                    case 'baseOnBalls':
                        statValue = game.stat.baseOnBalls || 0;
                        break;
                    case 'atBats':
                        statValue = game.stat.atBats || 0;
                        break;
                    case 'avg':
                        statValue = game.stat.atBats > 0 ? (game.stat.hits || 0) / game.stat.atBats : 0;
                        break;
                    default:
                        statValue = 0;
                }
                gameData.push(statValue);
                gameLabels.push(`Game ${index + 1}`);
                statSum += statValue;
                validGames++;
            }
        });
        if (validGames === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `No valid statistical data found for ${statCategory}`
                    }],
                isError: true
            };
        }
        // Calculate statistics
        const min = Math.min(...gameData);
        const max = Math.max(...gameData);
        const average = statSum / validGames;
        // Create chart configuration
        const width = 800;
        const height = 400;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
        const statDisplayNames = {
            hits: 'Hits',
            runs: 'Runs',
            rbi: 'RBIs',
            homeRuns: 'Home Runs',
            doubles: 'Doubles',
            triples: 'Triples',
            strikeOuts: 'Strikeouts',
            baseOnBalls: 'Walks',
            atBats: 'At Bats',
            avg: 'Batting Average'
        };
        const chartTitle = title || `${statDisplayNames[statCategory]} - Game by Game (${season})`;
        const configuration = {
            type: chartType,
            data: {
                labels: gameLabels,
                datasets: [{
                        label: statDisplayNames[statCategory],
                        data: gameData,
                        borderColor: chartType === 'line' ? 'rgb(75, 192, 192)' : undefined,
                        backgroundColor: chartType === 'line' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(54, 162, 235, 0.5)',
                        borderWidth: 2,
                        fill: chartType === 'line' ? false : undefined
                    }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: statDisplayNames[statCategory]
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Games'
                        }
                    }
                }
            }
        };
        // Generate chart image
        let imageBuffer;
        let base64Image;
        let chartUrl;
        try {
            imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
            base64Image = imageBuffer.toString('base64');
            chartUrl = `data:image/png;base64,${base64Image}`;
        }
        catch (chartError) {
            throw new Error(`Chart generation failed: ${chartError instanceof Error ? chartError.message : 'Unknown chart error'}`);
        }
        // Save chart to file if requested
        let savedFilePath;
        if (saveToFile) {
            try {
                // Create filename if not provided
                const gameTypeNames = {
                    'R': 'regular',
                    'S': 'spring',
                    'P': 'playoffs',
                    'D': 'division',
                    'L': 'championship',
                    'W': 'worldseries'
                };
                const defaultFilename = filename ||
                    `player-${playerId}-${statCategory}-${season}-${gameTypeNames[gameType] || gameType}`;
                const dataDir = path.join(process.cwd(), 'data', 'visualizations');
                // Ensure directory exists
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                savedFilePath = path.join(dataDir, `${defaultFilename}.png`);
                // Save the image
                fs.writeFileSync(savedFilePath, imageBuffer);
            }
            catch (saveError) {
                console.error('Warning: Could not save chart to file:', saveError);
            }
        }
        const result = {
            chartUrl,
            totalGames: validGames,
            statSummary: {
                min,
                max,
                average: Math.round(average * 1000) / 1000, // Round to 3 decimal places
                total: statSum
            },
            savedFile: savedFilePath || null
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error generating visualization: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Look up players by name, position, team, etc.
 */
server.registerTool('lookup-player', {
    title: 'Lookup Player',
    description: 'Search for players by name, position, team, or other criteria',
    inputSchema: {
        searchTerm: z.string().describe('Player name or search criteria (e.g., "harper", "nola,", "yankees pitcher")'),
        gameType: gameTypeSchema,
        season: z.number().optional().describe('Season year (defaults to current year)'),
        sportId: z.number().default(1).describe('Sport ID (1=MLB)')
    }
}, async ({ searchTerm, gameType = 'R', season, sportId = 1 }) => {
    try {
        const players = await mlbClient.lookupPlayer(searchTerm, gameType, season, sportId);
        const output = { players };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error looking up player: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Look up teams by name, city, abbreviation, etc.
 */
server.registerTool('lookup-team', {
    title: 'Lookup Team',
    description: 'Search for teams by name, city, abbreviation, or other criteria',
    inputSchema: {
        searchTerm: z.string().describe('Team name, city, or abbreviation (e.g., "yankees", "new york", "NYY")'),
        season: z.number().optional().describe('Season year (defaults to current year)'),
        sportId: z.number().default(1).describe('Sport ID (1=MLB)')
    }
}, async ({ searchTerm, season, sportId = 1 }) => {
    try {
        const teams = await mlbClient.lookupTeam(searchTerm, season, sportId);
        const output = { teams };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error looking up team: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get detailed game boxscore with enhanced batting statistics
 */
server.registerTool('get-boxscore', {
    title: 'Get Game Boxscore',
    description: 'Get detailed boxscore data for a specific game including comprehensive batting, pitching, and fielding statistics',
    inputSchema: {
        gamePk: z.number().describe('Game primary key (unique MLB game ID)'),
        timecode: z.string().optional().describe('Specific time code to get boxscore at particular moment (format: YYYYMMDD_HHMMSS)')
    }
}, async ({ gamePk, timecode }) => {
    try {
        const boxscore = await mlbClient.getBoxscore(gamePk, timecode);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(boxscore, null, 2)
                }],
            structuredContent: boxscore
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching boxscore: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get league leaders for statistical categories
 */
server.registerTool('get-league-leaders', {
    title: 'Get League Leaders',
    description: 'Get statistical leaders for specified categories (homeRuns, battingAverage, era, wins, etc.)',
    inputSchema: {
        leaderCategories: z.string().describe('Stat category (homeRuns, battingAverage, rbi, era, wins, strikeouts, etc.)'),
        season: z.number().optional().describe('Season year (defaults to current year)'),
        leagueId: z.number().optional().describe('League ID (103=AL, 104=NL, omit for both leagues)'),
        limit: z.number().default(10).describe('Number of leaders to return (default 10)')
    }
}, async ({ leaderCategories, season, leagueId, limit = 10 }) => {
    try {
        const leaders = await mlbClient.getLeagueLeaders(leaderCategories, season, leagueId, limit);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(leaders, null, 2)
                }],
            structuredContent: leaders
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching league leaders: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get MLB.com Links and Resources
 */
server.registerTool('get-mlb-com-links', {
    title: 'Get MLB.com Links and Resources',
    description: 'Generate direct links to MLB.com pages for teams, players, schedules, news, and other resources',
    inputSchema: {
        linkType: z.enum(['team', 'player', 'schedule', 'standings', 'news', 'stats', 'postseason', 'draft', 'prospects']).describe('Type of MLB.com link to generate'),
        teamId: z.number().optional().describe('Team ID for team-specific pages'),
        playerId: z.number().optional().describe('Player ID for player profile pages'),
        category: z.string().optional().describe('News category or stats category for filtered content')
    },
    outputSchema: {
        linkType: z.string(),
        primaryUrl: z.string(),
        relatedUrls: z.array(z.object({
            title: z.string(),
            url: z.string(),
            description: z.string()
        })),
        description: z.string()
    }
}, async ({ linkType, teamId, playerId, category }) => {
    try {
        const teamSlugs = {
            108: 'angels', 109: 'diamondbacks', 110: 'orioles', 111: 'red-sox',
            112: 'cubs', 113: 'reds', 114: 'guardians', 115: 'rockies',
            116: 'tigers', 117: 'astros', 118: 'royals', 119: 'dodgers',
            120: 'nationals', 121: 'mets', 133: 'athletics', 134: 'pirates',
            135: 'padres', 136: 'mariners', 137: 'giants', 138: 'cardinals',
            139: 'rays', 140: 'rangers', 142: 'twins', 143: 'phillies',
            144: 'braves', 145: 'white-sox', 146: 'marlins', 147: 'yankees',
            158: 'brewers'
        };
        let primaryUrl = 'https://www.mlb.com/';
        const relatedUrls = [];
        let description = '';
        switch (linkType) {
            case 'team':
                if (teamId && teamSlugs[teamId]) {
                    const teamSlug = teamSlugs[teamId];
                    primaryUrl = `https://www.mlb.com/${teamSlug}/`;
                    description = `Official MLB.com team page with roster, schedule, news, and stats`;
                    relatedUrls.push({ title: 'Schedule', url: `https://www.mlb.com/${teamSlug}/schedule/`, description: 'Team schedule and game results' }, { title: 'Roster', url: `https://www.mlb.com/${teamSlug}/roster/`, description: 'Current team roster and player profiles' }, { title: 'Stats', url: `https://www.mlb.com/${teamSlug}/stats/`, description: 'Team and player statistics' }, { title: 'News', url: `https://www.mlb.com/${teamSlug}/news/`, description: 'Latest team news and updates' }, { title: 'Tickets', url: `https://www.mlb.com/${teamSlug}/tickets/`, description: 'Purchase game tickets' });
                }
                else {
                    primaryUrl = 'https://www.mlb.com/teams/';
                    description = 'Browse all MLB teams and their official pages';
                }
                break;
            case 'player':
                if (playerId) {
                    primaryUrl = `https://www.mlb.com/player/${playerId}`;
                    description = `Official MLB.com player profile with stats, bio, and news`;
                    relatedUrls.push({ title: 'Stats', url: `https://www.mlb.com/player/${playerId}/stats`, description: 'Detailed player statistics' }, { title: 'Game Logs', url: `https://www.mlb.com/player/${playerId}/gamelogs`, description: 'Game-by-game performance' }, { title: 'Bio', url: `https://www.mlb.com/player/${playerId}/bio`, description: 'Player biography and career highlights' });
                }
                else {
                    primaryUrl = 'https://www.mlb.com/players/';
                    description = 'Search and browse MLB player profiles';
                }
                break;
            case 'schedule':
                primaryUrl = 'https://www.mlb.com/schedule/';
                description = 'Complete MLB schedule with games, times, and broadcast information';
                relatedUrls.push({ title: 'Today\'s Games', url: 'https://www.mlb.com/schedule/today', description: 'Games scheduled for today' }, { title: 'Postseason', url: 'https://www.mlb.com/postseason/', description: 'Playoff schedule and results' }, { title: 'Spring Training', url: 'https://www.mlb.com/spring-training/', description: 'Spring training schedule and information' });
                break;
            case 'standings':
                primaryUrl = 'https://www.mlb.com/standings/';
                description = 'Current MLB standings by division and wild card race';
                relatedUrls.push({ title: 'Wild Card', url: 'https://www.mlb.com/standings/wild-card', description: 'Wild card standings and race' }, { title: 'Playoff Picture', url: 'https://www.mlb.com/postseason/', description: 'Current playoff bracket and scenarios' });
                break;
            case 'news':
                primaryUrl = category ? `https://www.mlb.com/news/${category}` : 'https://www.mlb.com/news/';
                description = 'Latest MLB news, updates, and analysis';
                relatedUrls.push({ title: 'Trade Rumors', url: 'https://www.mlb.com/news/trade-rumors', description: 'Latest trade news and rumors' }, { title: 'Injuries', url: 'https://www.mlb.com/news/injuries', description: 'Injury reports and updates' }, { title: 'Awards', url: 'https://www.mlb.com/news/awards', description: 'Award winners and candidates' }, { title: 'Features', url: 'https://www.mlb.com/news/features', description: 'In-depth features and analysis' });
                break;
            case 'stats':
                primaryUrl = category ? `https://www.mlb.com/stats/${category}` : 'https://www.mlb.com/stats/';
                description = 'Comprehensive MLB statistics and leaderboards';
                relatedUrls.push({ title: 'Leaders', url: 'https://www.mlb.com/stats/leaders', description: 'Statistical leaders by category' }, { title: 'Team Stats', url: 'https://www.mlb.com/stats/team', description: 'Team statistics and rankings' }, { title: 'Advanced Stats', url: 'https://www.mlb.com/stats/advanced', description: 'Advanced metrics and analytics' }, { title: 'Historical', url: 'https://www.mlb.com/stats/historical', description: 'Historical statistics and records' });
                break;
            case 'postseason':
                primaryUrl = 'https://www.mlb.com/postseason/';
                description = 'Complete postseason coverage including bracket, schedule, and results';
                relatedUrls.push({ title: 'Bracket', url: 'https://www.mlb.com/postseason/bracket', description: 'Interactive playoff bracket' }, { title: 'Schedule', url: 'https://www.mlb.com/postseason/schedule', description: 'Playoff schedule and times' }, { title: 'History', url: 'https://www.mlb.com/postseason/history', description: 'Postseason history and records' });
                break;
            case 'draft':
                primaryUrl = 'https://www.mlb.com/draft/';
                description = 'MLB Draft coverage including prospects, results, and analysis';
                relatedUrls.push({ title: 'Prospects', url: 'https://www.mlb.com/prospects/', description: 'Top prospects and rankings' }, { title: 'Draft Results', url: 'https://www.mlb.com/draft/results', description: 'Draft picks and selections' }, { title: 'Pipeline', url: 'https://www.mlb.com/prospects/pipeline', description: 'Prospect rankings by team' });
                break;
            case 'prospects':
                primaryUrl = 'https://www.mlb.com/prospects/';
                description = 'Top prospects, rankings, and minor league coverage';
                relatedUrls.push({ title: 'Top 100', url: 'https://www.mlb.com/prospects/top-100', description: 'Top 100 prospect rankings' }, { title: 'Pipeline', url: 'https://www.mlb.com/prospects/pipeline', description: 'Team-by-team prospect rankings' }, { title: 'Draft', url: 'https://www.mlb.com/draft/', description: 'MLB Draft information' });
                break;
            default:
                primaryUrl = 'https://www.mlb.com/';
                description = 'Official Major League Baseball website';
        }
        const output = {
            linkType,
            primaryUrl,
            relatedUrls,
            description
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error generating MLB.com links: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get Enhanced Player Information with MLB.com Integration
 */
server.registerTool('get-enhanced-player-info', {
    title: 'Get Enhanced Player Information',
    description: 'Get comprehensive player information including MLB.com profile links and additional context',
    inputSchema: {
        playerId: z.number().describe('MLB Player ID'),
        includeMLBcomLinks: z.boolean().default(true).describe('Include MLB.com profile and related links'),
        season: z.number().optional().describe('Season year for stats (defaults to current year)')
    },
    outputSchema: {
        player: z.object({
            id: z.number(),
            fullName: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            primaryNumber: z.string().optional(),
            currentTeam: z.object({
                id: z.number(),
                name: z.string()
            }).optional(),
            primaryPosition: z.object({
                code: z.string(),
                name: z.string(),
                type: z.string()
            }),
            birthDate: z.string(),
            currentAge: z.number(),
            height: z.string(),
            weight: z.number(),
            active: z.boolean()
        }),
        mlbComLinks: z.object({
            profileUrl: z.string(),
            statsUrl: z.string(),
            gameLogsUrl: z.string(),
            bioUrl: z.string(),
            teamUrl: z.string().optional()
        }).optional(),
        currentStats: z.record(z.any()).optional()
    }
}, async ({ playerId, includeMLBcomLinks = true, season }) => {
    try {
        // Get basic player info
        const playerInfo = await mlbClient.searchPlayers(playerId.toString(), 'Y');
        const player = playerInfo.people?.[0];
        if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
        }
        let mlbComLinks;
        if (includeMLBcomLinks) {
            const teamSlugs = {
                108: 'angels', 109: 'diamondbacks', 110: 'orioles', 111: 'red-sox',
                112: 'cubs', 113: 'reds', 114: 'guardians', 115: 'rockies',
                116: 'tigers', 117: 'astros', 118: 'royals', 119: 'dodgers',
                120: 'nationals', 121: 'mets', 133: 'athletics', 134: 'pirates',
                135: 'padres', 136: 'mariners', 137: 'giants', 138: 'cardinals',
                139: 'rays', 140: 'rangers', 142: 'twins', 143: 'phillies',
                144: 'braves', 145: 'white-sox', 146: 'marlins', 147: 'yankees',
                158: 'brewers'
            };
            mlbComLinks = {
                profileUrl: `https://www.mlb.com/player/${playerId}`,
                statsUrl: `https://www.mlb.com/player/${playerId}/stats`,
                gameLogsUrl: `https://www.mlb.com/player/${playerId}/gamelogs`,
                bioUrl: `https://www.mlb.com/player/${playerId}/bio`,
                teamUrl: player.currentTeam?.id && teamSlugs[player.currentTeam.id]
                    ? `https://www.mlb.com/${teamSlugs[player.currentTeam.id]}/`
                    : undefined
            };
        }
        // Get current season stats if available
        let currentStats;
        try {
            const statsData = await mlbClient.getPlayerStats(playerId, season);
            currentStats = statsData.stats?.[0]?.stats;
        }
        catch (statsError) {
            // Stats may not be available, continue without them
            console.error('Could not fetch player stats:', statsError);
        }
        const output = {
            player,
            mlbComLinks,
            currentStats
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching enhanced player info: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get Enhanced Team Information with MLB.com Integration
 */
server.registerTool('get-enhanced-team-info', {
    title: 'Get Enhanced Team Information',
    description: 'Get comprehensive team information including MLB.com team pages and additional resources',
    inputSchema: {
        teamId: z.number().describe('MLB Team ID'),
        includeMLBcomLinks: z.boolean().default(true).describe('Include MLB.com team pages and related links'),
        includeCurrentStats: z.boolean().default(true).describe('Include current team statistics')
    },
    outputSchema: {
        team: z.object({
            id: z.number(),
            name: z.string(),
            teamName: z.string(),
            locationName: z.string(),
            abbreviation: z.string(),
            league: z.object({
                id: z.number(),
                name: z.string()
            }),
            division: z.object({
                id: z.number(),
                name: z.string()
            }),
            venue: z.object({
                id: z.number(),
                name: z.string(),
                city: z.string(),
                state: z.string().optional()
            }).optional()
        }),
        mlbComLinks: z.object({
            teamUrl: z.string(),
            scheduleUrl: z.string(),
            rosterUrl: z.string(),
            statsUrl: z.string(),
            newsUrl: z.string(),
            ticketsUrl: z.string()
        }).optional(),
        currentStandings: z.record(z.any()).optional()
    }
}, async ({ teamId, includeMLBcomLinks = true, includeCurrentStats = true }) => {
    try {
        // Get basic team info
        const teamInfo = await mlbClient.getTeamInfo(teamId, 'venue,league,division');
        let mlbComLinks;
        if (includeMLBcomLinks) {
            const teamSlugs = {
                108: 'angels', 109: 'diamondbacks', 110: 'orioles', 111: 'red-sox',
                112: 'cubs', 113: 'reds', 114: 'guardians', 115: 'rockies',
                116: 'tigers', 117: 'astros', 118: 'royals', 119: 'dodgers',
                120: 'nationals', 121: 'mets', 133: 'athletics', 134: 'pirates',
                135: 'padres', 136: 'mariners', 137: 'giants', 138: 'cardinals',
                139: 'rays', 140: 'rangers', 142: 'twins', 143: 'phillies',
                144: 'braves', 145: 'white-sox', 146: 'marlins', 147: 'yankees',
                158: 'brewers'
            };
            const teamSlug = teamSlugs[teamId];
            if (teamSlug) {
                mlbComLinks = {
                    teamUrl: `https://www.mlb.com/${teamSlug}/`,
                    scheduleUrl: `https://www.mlb.com/${teamSlug}/schedule/`,
                    rosterUrl: `https://www.mlb.com/${teamSlug}/roster/`,
                    statsUrl: `https://www.mlb.com/${teamSlug}/stats/`,
                    newsUrl: `https://www.mlb.com/${teamSlug}/news/`,
                    ticketsUrl: `https://www.mlb.com/${teamSlug}/tickets/`
                };
            }
        }
        // Get current standings if available
        let currentStandings;
        if (includeCurrentStats) {
            try {
                const standings = await mlbClient.getStandings({
                    divisionId: teamInfo.division?.id
                });
                const teamStanding = standings.find((s) => s.team.id === teamId);
                if (teamStanding) {
                    currentStandings = teamStanding;
                }
            }
            catch (standingsError) {
                // Standings may not be available, continue without them
                console.error('Could not fetch team standings:', standingsError);
            }
        }
        const output = {
            team: teamInfo,
            mlbComLinks,
            currentStandings
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching enhanced team info: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get postseason schedule using dedicated MLB postseason endpoint
 */
server.registerTool('get-postseason-schedule', {
    title: 'Get Postseason Schedule',
    description: 'Get MLB postseason/playoff schedule using the dedicated postseason API endpoint with detailed game information',
    inputSchema: {
        season: z.number().optional().describe('Season year (defaults to current year)'),
        series: z.string().optional().describe('Specific playoff series (WS=World Series, ALCS/NLCS=Championship Series, ALDS/NLDS=Division Series, WC=Wild Card)')
    },
    outputSchema: {
        postseasonData: z.object({
            season: z.number(),
            totalGames: z.number(),
            series: z.array(z.object({
                seriesCode: z.string(),
                seriesName: z.string(),
                games: z.array(z.object({
                    gamePk: z.number(),
                    gameDate: z.string(),
                    status: z.object({
                        abstractGameState: z.string(),
                        detailedState: z.string()
                    }),
                    teams: z.object({
                        away: z.object({
                            team: z.object({
                                id: z.number(),
                                name: z.string()
                            }),
                            score: z.number().optional()
                        }),
                        home: z.object({
                            team: z.object({
                                id: z.number(),
                                name: z.string()
                            }),
                            score: z.number().optional()
                        })
                    }),
                    venue: z.object({
                        name: z.string()
                    }).optional()
                }))
            }))
        })
    }
}, async ({ season, series }) => {
    try {
        const postseasonData = await mlbClient.getPostseasonSchedule(season, series);
        // Process the postseason data
        const processedData = {
            season: season || new Date().getFullYear(),
            totalGames: 0,
            series: []
        };
        // Handle the API response structure
        if (postseasonData.dates) {
            let totalGames = 0;
            const seriesMap = new Map();
            postseasonData.dates.forEach((dateData) => {
                dateData.games?.forEach((game) => {
                    totalGames++;
                    const seriesCode = game.seriesGameNumber ?
                        `${game.teams?.away?.team?.abbreviation || 'TBD'}_vs_${game.teams?.home?.team?.abbreviation || 'TBD'}` :
                        'Regular';
                    if (!seriesMap.has(seriesCode)) {
                        seriesMap.set(seriesCode, {
                            seriesCode,
                            seriesName: game.description || `${game.teams?.away?.team?.name || 'TBD'} vs ${game.teams?.home?.team?.name || 'TBD'}`,
                            games: []
                        });
                    }
                    seriesMap.get(seriesCode).games.push({
                        gamePk: game.gamePk,
                        gameDate: game.gameDate,
                        status: {
                            abstractGameState: game.status?.abstractGameState || 'Unknown',
                            detailedState: game.status?.detailedState || 'Unknown'
                        },
                        teams: {
                            away: {
                                team: {
                                    id: game.teams?.away?.team?.id || 0,
                                    name: game.teams?.away?.team?.name || 'TBD'
                                },
                                score: game.teams?.away?.score
                            },
                            home: {
                                team: {
                                    id: game.teams?.home?.team?.id || 0,
                                    name: game.teams?.home?.team?.name || 'TBD'
                                },
                                score: game.teams?.home?.score
                            }
                        },
                        venue: game.venue ? {
                            name: game.venue.name
                        } : undefined
                    });
                });
            });
            processedData.totalGames = totalGames;
            processedData.series = Array.from(seriesMap.values());
        }
        const output = { postseasonData: processedData };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching postseason schedule: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get MLB jobs information
 */
server.registerTool('get-mlb-jobs', {
    title: 'Get MLB Jobs',
    description: 'Get information about MLB jobs, personnel, and staff positions (umpires, managers, coaches, trainers, etc.)',
    inputSchema: {
        jobType: z.string().describe('Type of job to query (e.g., "umpire", "manager", "coach", "trainer", "scout", "front-office")'),
        sportId: z.number().default(1).describe('Sport ID (1=MLB)'),
        date: z.string().optional().describe('Specific date for jobs (YYYY-MM-DD format)')
    },
    outputSchema: {
        jobsData: z.object({
            jobType: z.string(),
            totalJobs: z.number(),
            jobs: z.array(z.object({
                id: z.number(),
                title: z.string(),
                jobType: z.string(),
                person: z.object({
                    id: z.number(),
                    fullName: z.string(),
                    firstName: z.string(),
                    lastName: z.string()
                }).optional(),
                team: z.object({
                    id: z.number(),
                    name: z.string(),
                    abbreviation: z.string()
                }).optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                isActive: z.boolean().optional()
            }))
        })
    }
}, async ({ jobType, sportId = 1, date }) => {
    try {
        const jobsData = await mlbClient.getJobs(jobType, sportId, date);
        const output = { jobsData };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching MLB jobs: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Tool: Get MLB metadata
 */
server.registerTool('get-mlb-meta', {
    title: 'Get MLB Metadata',
    description: 'Get MLB metadata for various types including awards, gameTypes, jobTypes, positions, and more',
    inputSchema: {
        type: z.string().describe('Type of metadata to retrieve (awards, baseballStats, eventTypes, gameStatus, gameTypes, hitTrajectories, jobTypes, languages, leagueLeaderTypes, logicalEvents, metrics, pitchCodes, pitchTypes, platforms, positions, reviewReasons, rosterTypes, scheduleEventTypes, situationCodes, sky, standingsTypes, statGroups, statTypes, windDirection)'),
        ver: z.string().default('v1').describe('API version (default: v1)')
    },
    outputSchema: {
        metaData: z.object({
            type: z.string(),
            version: z.string(),
            totalItems: z.number(),
            data: z.array(z.any())
        })
    }
}, async ({ type, ver = 'v1' }) => {
    try {
        const metaData = await mlbClient.getMeta(type, ver);
        const output = { metaData };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(output, null, 2)
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            content: [{
                    type: 'text',
                    text: `Error fetching MLB metadata: ${errorMessage}`
                }],
            isError: true
        };
    }
});
/**
 * Main function to start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MLB MCP Server with MLB.com Integration running on stdio');
}
// Handle errors gracefully
process.on('SIGINT', async () => {
    console.error('Shutting down MLB MCP Server...');
    process.exit(0);
});
// Start the server
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map