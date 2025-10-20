#!/usr/bin/env node

/**
 * NFL Fantasy Football Analyzer
 * Automatically analyzes ALL NFL games from today and generates a comprehensive fantasy report
 * Uses the MCP server's real NFL data integration
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

class NFLFantasyAnalyzer {
    constructor() {
        this.allGameStats = [];
        this.fantasyRockStars = [];
        this.report = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            totalGames: 0,
            totalPlayers: 0,
            topPerformers: [],
            gameBreakdown: [],
            fantasyTiers: {
                elite: [],
                tier1: [],
                tier2: [],
                tier3: []
            }
        };
    }

    async runMCPCommand(requestData) {
        return new Promise((resolve, reject) => {
            const tempFile = `temp-request-${Date.now()}.json`;
            
            try {
                // Write request to temp file
                writeFileSync(tempFile, JSON.stringify(requestData));
                
                // Run MCP server command
                const process = spawn('node', ['build/index.js'], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: true
                });

                let stdout = '';
                let stderr = '';
                
                process.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                // Send the JSON request via stdin
                process.stdin.write(JSON.stringify(requestData));
                process.stdin.end();
                
                process.on('close', (code) => {
                    try {
                        unlinkSync(tempFile);
                    } catch (e) {
                        // File cleanup failed, continue
                    }
                    
                    if (code === 0) {
                        try {
                            // Extract JSON from stdout (skip server startup messages)
                            const jsonMatch = stdout.match(/{"result".*}$/m);
                            if (jsonMatch) {
                                const response = JSON.parse(jsonMatch[0]);
                                resolve(response);
                            } else {
                                resolve({ error: 'No valid JSON response found' });
                            }
                        } catch (parseError) {
                            resolve({ error: `JSON parse error: ${parseError.message}` });
                        }
                    } else {
                        reject(new Error(`Process exited with code ${code}: ${stderr}`));
                    }
                });
                
                process.on('error', (error) => {
                    try {
                        unlinkSync(tempFile);
                    } catch (e) {
                        // File cleanup failed, continue
                    }
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllNFLGames() {
        console.log('🏈 Fetching all NFL games...');
        
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "get-all-live-scores",
                arguments: {
                    format: "summary",
                    sports: ["nfl"],
                    includeInjuries: false,
                    includeStats: false
                }
            }
        };

        const response = await this.runMCPCommand(request);
        
        if (response.result?.structuredContent?.sports?.nfl?.games) {
            return response.result.structuredContent.sports.nfl.games.filter(game => 
                game.status === 'final' && game.gameId !== 'no-nfl-games'
            );
        }
        
        return [];
    }

    async getGamePlayerStats(gameId, homeTeam, awayTeam) {
        console.log(`📊 Analyzing ${awayTeam} @ ${homeTeam} (${gameId})...`);
        
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "get-nfl-player-stats",
                arguments: {
                    gameId: gameId,
                    includeKeyPlays: false
                }
            }
        };

        try {
            const response = await this.runMCPCommand(request);
            
            if (response.result?.structuredContent) {
                return response.result.structuredContent;
            }
        } catch (error) {
            console.log(`⚠️  Error analyzing ${gameId}: ${error.message}`);
        }
        
        return { keyPlayers: [], homeTeam, awayTeam, error: 'Failed to fetch stats' };
    }

    categorizeFantasyPerformance(player) {
        const stats = player.stats;
        let points = 0;
        let tier = 'tier3';

        // Extract yards from stats string
        const yardMatch = stats.match(/(\\d+) yards/);
        const yards = yardMatch ? parseInt(yardMatch[1]) : 0;
        
        // Extract catches for PPR
        const catchMatch = stats.match(/(\\d+) catches/);
        const catches = catchMatch ? parseInt(catchMatch[1]) : 0;
        
        // Extract carries
        const carryMatch = stats.match(/(\\d+) carries/);
        const carries = carryMatch ? parseInt(carryMatch[1]) : 0;

        // Calculate approximate fantasy points
        if (player.category === 'Receiving') {
            points = yards * 0.1 + catches * 1; // PPR scoring
            if (yards >= 150 || catches >= 12) tier = 'elite';
            else if (yards >= 100 || catches >= 8) tier = 'tier1';
            else if (yards >= 70 || catches >= 6) tier = 'tier2';
        } else if (player.category === 'Rushing') {
            points = yards * 0.1 + carries * 0.1;
            if (yards >= 120) tier = 'elite';
            else if (yards >= 80) tier = 'tier1';
            else if (yards >= 60) tier = 'tier2';
        }

        return { ...player, fantasyPoints: points, tier, yards, catches, carries };
    }

    async analyzeAllGames() {
        console.log('🚀 Starting comprehensive NFL fantasy analysis...');
        
        // Get all completed games
        const games = await this.getAllNFLGames();
        this.report.totalGames = games.length;
        
        console.log(`Found ${games.length} completed NFL games to analyze`);
        
        // Analyze each game
        for (const game of games) {
            const gameStats = await this.getGamePlayerStats(
                game.gameId, 
                game.homeTeam, 
                game.awayTeam
            );
            
            // Process players from this game
            const gameData = {
                gameId: game.gameId,
                matchup: `${game.awayTeam} @ ${game.homeTeam}`,
                score: `${game.awayTeam} ${game.awayScore} - ${game.homeTeam} ${game.homeScore}`,
                venue: game.venue,
                players: []
            };
            
            if (gameStats.keyPlayers) {
                for (const player of gameStats.keyPlayers) {
                    const categorizedPlayer = this.categorizeFantasyPerformance(player);
                    gameData.players.push(categorizedPlayer);
                    this.fantasyRockStars.push(categorizedPlayer);
                    this.report.fantasyTiers[categorizedPlayer.tier].push(categorizedPlayer);
                }
            }
            
            this.report.gameBreakdown.push(gameData);
            
            // Add small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.report.totalPlayers = this.fantasyRockStars.length;
        
        // Sort tiers by fantasy points
        Object.keys(this.report.fantasyTiers).forEach(tier => {
            this.report.fantasyTiers[tier].sort((a, b) => b.fantasyPoints - a.fantasyPoints);
        });
        
        // Create top performers list
        this.report.topPerformers = this.fantasyRockStars
            .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
            .slice(0, 15);
    }

    generateMarkdownReport() {
        const report = this.report;
        
        let markdown = `# 🏈 Complete NFL Fantasy Football Analysis\n`;
        markdown += `**Date:** ${report.date}\\n`;
        markdown += `**Generated:** ${report.timestamp}\\n`;
        markdown += `**Games Analyzed:** ${report.totalGames}\\n`;
        markdown += `**Players Analyzed:** ${report.totalPlayers}\\n\\n`;
        
        markdown += `## 🔥 Top 15 Fantasy Performers\\n\\n`;
        markdown += `| Rank | Player | Team | Position | Performance | Fantasy Points |\\n`;
        markdown += `|------|--------|------|----------|-------------|----------------|\\n`;
        
        report.topPerformers.forEach((player, index) => {
            markdown += `| ${index + 1} | **${player.name}** | ${player.team} | ${player.position} | ${player.stats} | ~${player.fantasyPoints.toFixed(1)} |\\n`;
        });
        
        markdown += `\\n## 🏆 Fantasy Performance Tiers\\n\\n`;
        
        // Elite Tier
        if (report.fantasyTiers.elite.length > 0) {
            markdown += `### 💎 ELITE TIER (${report.fantasyTiers.elite.length} players)\\n`;
            report.fantasyTiers.elite.forEach(player => {
                markdown += `- **${player.name}** (${player.team}): ${player.stats}\\n`;
            });
            markdown += `\\n`;
        }
        
        // Tier 1
        if (report.fantasyTiers.tier1.length > 0) {
            markdown += `### 🥇 TIER 1 (${report.fantasyTiers.tier1.length} players)\\n`;
            report.fantasyTiers.tier1.forEach(player => {
                markdown += `- **${player.name}** (${player.team}): ${player.stats}\\n`;
            });
            markdown += `\\n`;
        }
        
        // Game-by-Game Breakdown
        markdown += `## 📊 Game-by-Game Fantasy Breakdown\\n\\n`;
        
        report.gameBreakdown.forEach(game => {
            if (game.players.length > 0) {
                markdown += `### ${game.matchup}\\n`;
                markdown += `**Final Score:** ${game.score}\\n`;
                markdown += `**Venue:** ${game.venue}\\n`;
                markdown += `**Fantasy Contributors:**\\n`;
                
                game.players
                    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
                    .forEach(player => {
                        markdown += `- ${player.name} (${player.position}): ${player.stats}\\n`;
                    });
                markdown += `\\n`;
            }
        });
        
        markdown += `## 📈 Analysis Summary\\n\\n`;
        markdown += `- **Total Games Analyzed:** ${report.totalGames}\\n`;
        markdown += `- **Elite Performers:** ${report.fantasyTiers.elite.length}\\n`;
        markdown += `- **Tier 1 Performers:** ${report.fantasyTiers.tier1.length}\\n`;
        markdown += `- **Total Fantasy Contributors:** ${report.totalPlayers}\\n\\n`;
        
        if (report.topPerformers.length > 0) {
            const topPlayer = report.topPerformers[0];
            markdown += `**Fantasy MVP of the Day:** ${topPlayer.name} (${topPlayer.team}) - ${topPlayer.stats}\\n\\n`;
        }
        
        markdown += `*Report generated using real NFL data from ESPN API via MCP server integration*\\n`;
        
        return markdown;
    }

    async generateReport() {
        try {
            await this.analyzeAllGames();
            
            console.log('\\n📝 Generating comprehensive report...');
            
            // Generate markdown report
            const markdownReport = this.generateMarkdownReport();
            
            // Save reports
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportFileName = `nfl-fantasy-report-${timestamp.split('T')[0]}.md`;
            const jsonFileName = `nfl-fantasy-data-${timestamp.split('T')[0]}.json`;
            
            writeFileSync(reportFileName, markdownReport);
            writeFileSync(jsonFileName, JSON.stringify(this.report, null, 2));
            
            console.log('\\n🎉 Analysis Complete!');
            console.log(`📄 Markdown Report: ${reportFileName}`);
            console.log(`📊 JSON Data: ${jsonFileName}`);
            console.log(`\\n📈 Summary:`);
            console.log(`- Analyzed ${this.report.totalGames} completed NFL games`);
            console.log(`- Found ${this.report.totalPlayers} fantasy-relevant performances`);
            console.log(`- Elite performers: ${this.report.fantasyTiers.elite.length}`);
            console.log(`- Tier 1 performers: ${this.report.fantasyTiers.tier1.length}`);
            
            if (this.report.topPerformers.length > 0) {
                const mvp = this.report.topPerformers[0];
                console.log(`🏆 Fantasy MVP: ${mvp.name} (${mvp.team}) - ${mvp.stats}`);
            }
            
            // Display top 5 performers
            console.log('\\n🔥 Top 5 Fantasy Performers:');
            this.report.topPerformers.slice(0, 5).forEach((player, index) => {
                console.log(`${index + 1}. ${player.name} (${player.team}): ${player.stats}`);
            });
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            console.error(error.stack);
        }
    }
}

// Run the analyzer
console.log('🏈 NFL Fantasy Football Analyzer Starting...');
console.log('This will analyze ALL completed NFL games from today\\n');

const analyzer = new NFLFantasyAnalyzer();
analyzer.generateReport();