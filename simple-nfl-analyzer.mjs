#!/usr/bin/env node

/**
 * Simple NFL Fantasy Analyzer
 * Uses direct file-based communication with MCP server
 */

import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

class SimpleNFLAnalyzer {
    constructor() {
        this.allPlayers = [];
        this.gameResults = [];
        this.timestamp = new Date().toISOString();
    }

    async analyzeAllGames() {
        console.log('🏈 Step 1: Getting all NFL games...');
        
        // Create request for all games
        const gamesRequest = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "get-all-live-scores",
                "arguments": {
                    "format": "summary",
                    "sports": ["nfl"],
                    "includeInjuries": false,
                    "includeStats": false
                }
            }
        };

        writeFileSync('temp-games-request.json', JSON.stringify(gamesRequest));
        
        try {
            const gamesOutput = execSync('Get-Content temp-games-request.json | node build/index.js', {
                shell: 'powershell.exe',
                encoding: 'utf8'
            });
            
            // Extract JSON from output
            const jsonMatch = gamesOutput.match(/{"result".*}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in games response');
            }
            
            const gamesResponse = JSON.parse(jsonMatch[0]);
            const games = gamesResponse.result?.structuredContent?.sports?.nfl?.games || [];
            const completedGames = games.filter(game => game.status === 'final');
            
            console.log(`Found ${completedGames.length} completed games`);
            
            // Analyze each game
            for (let i = 0; i < completedGames.length; i++) {
                const game = completedGames[i];
                console.log(`🔍 Analyzing game ${i + 1}/${completedGames.length}: ${game.awayTeam} @ ${game.homeTeam}`);
                
                await this.analyzeGame(game);
                
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            try { unlinkSync('temp-games-request.json'); } catch (e) {}
        }
    }

    async analyzeGame(game) {
        const playerRequest = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "get-nfl-player-stats",
                "arguments": {
                    "gameId": game.gameId,
                    "includeKeyPlays": false
                }
            }
        };

        const filename = `temp-player-${game.gameId}.json`;
        writeFileSync(filename, JSON.stringify(playerRequest));
        
        try {
            const playerOutput = execSync(`Get-Content ${filename} | node build/index.js`, {
                shell: 'powershell.exe',
                encoding: 'utf8'
            });
            
            const jsonMatch = playerOutput.match(/{"result".*}/);
            if (jsonMatch) {
                const playerResponse = JSON.parse(jsonMatch[0]);
                const gameData = playerResponse.result?.structuredContent;
                
                if (gameData?.keyPlayers) {
                    const gameResult = {
                        game: `${game.awayTeam} ${game.awayScore} @ ${game.homeTeam} ${game.homeScore}`,
                        venue: game.venue,
                        players: gameData.keyPlayers.map(player => ({
                            ...player,
                            fantasyTier: this.getFantasyTier(player)
                        }))
                    };
                    
                    this.gameResults.push(gameResult);
                    this.allPlayers.push(...gameResult.players);
                    
                    console.log(`  Found ${gameData.keyPlayers.length} key players`);
                }
            }
            
        } catch (error) {
            console.log(`  ⚠️ Error analyzing ${game.gameId}: ${error.message}`);
        } finally {
            try { unlinkSync(filename); } catch (e) {}
        }
    }

    getFantasyTier(player) {
        const stats = player.stats;
        const yardMatch = stats.match(/(\\d+) yards/);
        const yards = yardMatch ? parseInt(yardMatch[1]) : 0;
        const catchMatch = stats.match(/(\\d+) catches/);
        const catches = catchMatch ? parseInt(catchMatch[1]) : 0;

        if (player.category === 'Receiving') {
            if (yards >= 150 || catches >= 12) return 'ELITE';
            if (yards >= 100 || catches >= 8) return 'TIER1';
            if (yards >= 70 || catches >= 6) return 'TIER2';
            return 'TIER3';
        } else if (player.category === 'Rushing') {
            if (yards >= 120) return 'ELITE';
            if (yards >= 80) return 'TIER1';
            if (yards >= 60) return 'TIER2';
            return 'TIER3';
        }
        return 'TIER3';
    }

    generateReport() {
        console.log('\\n📝 Generating Fantasy Football Report...');
        
        // Sort all players by performance
        const sortedPlayers = this.allPlayers.sort((a, b) => {
            const aYards = parseInt(a.stats.match(/(\\d+) yards/)?.[1] || '0');
            const bYards = parseInt(b.stats.match(/(\\d+) yards/)?.[1] || '0');
            return bYards - aYards;
        });

        // Create tiers
        const tiers = {
            ELITE: sortedPlayers.filter(p => p.fantasyTier === 'ELITE'),
            TIER1: sortedPlayers.filter(p => p.fantasyTier === 'TIER1'),
            TIER2: sortedPlayers.filter(p => p.fantasyTier === 'TIER2'),
            TIER3: sortedPlayers.filter(p => p.fantasyTier === 'TIER3')
        };

        let report = `# 🏈 Complete NFL Fantasy Analysis - ${new Date().toLocaleDateString()}\\n\\n`;
        report += `**Analysis Time:** ${this.timestamp}\\n`;
        report += `**Games Analyzed:** ${this.gameResults.length}\\n`;
        report += `**Total Players:** ${this.allPlayers.length}\\n\\n`;

        // Top performers
        report += `## 🔥 Top 15 Fantasy Performers\\n\\n`;
        sortedPlayers.slice(0, 15).forEach((player, i) => {
            report += `${i + 1}. **${player.name}** (${player.team}) - ${player.position}: ${player.stats}\\n`;
        });

        // Tiers
        report += `\\n## 🏆 Fantasy Tiers\\n\\n`;
        
        if (tiers.ELITE.length > 0) {
            report += `### 💎 ELITE TIER (${tiers.ELITE.length} players)\\n`;
            tiers.ELITE.forEach(p => report += `- **${p.name}** (${p.team}): ${p.stats}\\n`);
            report += `\\n`;
        }

        if (tiers.TIER1.length > 0) {
            report += `### 🥇 TIER 1 (${tiers.TIER1.length} players)\\n`;
            tiers.TIER1.forEach(p => report += `- **${p.name}** (${p.team}): ${p.stats}\\n`);
            report += `\\n`;
        }

        // Game breakdown
        report += `## 📊 Game-by-Game Breakdown\\n\\n`;
        this.gameResults.forEach(game => {
            report += `### ${game.game}\\n`;
            report += `**Venue:** ${game.venue}\\n`;
            if (game.players.length > 0) {
                report += `**Fantasy Contributors:**\\n`;
                game.players.forEach(p => {
                    report += `- ${p.name} (${p.position}): ${p.stats}\\n`;
                });
            }
            report += `\\n`;
        });

        // Summary
        report += `## 📈 Summary\\n\\n`;
        report += `- **Elite Performers:** ${tiers.ELITE.length}\\n`;
        report += `- **Tier 1 Performers:** ${tiers.TIER1.length}\\n`;
        report += `- **Total Fantasy Relevant:** ${this.allPlayers.length}\\n`;

        if (sortedPlayers.length > 0) {
            report += `- **Fantasy MVP:** ${sortedPlayers[0].name} (${sortedPlayers[0].team})\\n`;
        }

        // Save report
        const filename = `NFL-Fantasy-Report-${new Date().toISOString().split('T')[0]}.md`;
        writeFileSync(filename, report);
        
        console.log(`\\n🎉 Report Generated: ${filename}`);
        console.log(`\\n📊 Quick Summary:`);
        console.log(`- Games Analyzed: ${this.gameResults.length}`);
        console.log(`- Total Players: ${this.allPlayers.length}`);
        console.log(`- Elite Performers: ${tiers.ELITE.length}`);
        console.log(`- Tier 1 Performers: ${tiers.TIER1.length}`);
        
        if (sortedPlayers.length > 0) {
            console.log(`\\n🏆 Top 3 Performers:`);
            sortedPlayers.slice(0, 3).forEach((p, i) => {
                console.log(`${i + 1}. ${p.name} (${p.team}): ${p.stats}`);
            });
        }
    }
}

// Run the analyzer
const analyzer = new SimpleNFLAnalyzer();
analyzer.analyzeAllGames();