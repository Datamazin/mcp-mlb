#!/usr/bin/env node

/**
 * CORRECTED NFL Fantasy Analyzer - Fixed Regex
 */

import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

class CorrectedNFLAnalyzer {
    constructor() {
        this.allPlayers = [];
        this.gameResults = [];
    }

    async analyzeAllGames() {
        console.log('🏈 CORRECTED NFL Fantasy Analysis Starting...');
        
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

        writeFileSync('temp-games.json', JSON.stringify(gamesRequest));
        
        try {
            const gamesOutput = execSync('Get-Content temp-games.json | node build/index.js', {
                shell: 'powershell.exe',
                encoding: 'utf8'
            });
            
            const jsonMatch = gamesOutput.match(/{"result".*}/);
            const gamesResponse = JSON.parse(jsonMatch[0]);
            const games = gamesResponse.result?.structuredContent?.sports?.nfl?.games || [];
            const completedGames = games.filter(game => game.status === 'final');
            
            console.log(`Found ${completedGames.length} completed games`);
            
            for (let i = 0; i < completedGames.length; i++) {
                const game = completedGames[i];
                console.log(`🔍 Game ${i + 1}/${completedGames.length}: ${game.awayTeam} @ ${game.homeTeam}`);
                await this.analyzeGame(game);
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            try { unlinkSync('temp-games.json'); } catch (e) {}
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

        const filename = `temp-${game.gameId}.json`;
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
                        players: gameData.keyPlayers.map(player => {
                            const parsed = this.parseStats(player.stats);
                            return {
                                name: player.name,
                                team: player.team,
                                position: player.position,
                                category: player.category,
                                stats: player.stats,
                                yards: parsed.yards,
                                catches: parsed.catches,
                                carries: parsed.carries,
                                fantasyTier: this.getTier(parsed, player.category)
                            };
                        })
                    };
                    
                    this.gameResults.push(gameResult);
                    this.allPlayers.push(...gameResult.players);
                    
                    // Show successful parsing
                    const sample = gameResult.players[0];
                    console.log(`  ✅ ${sample.name}: ${sample.stats} -> ${sample.yards} yards (${sample.fantasyTier})`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        } finally {
            try { unlinkSync(filename); } catch (e) {}
        }
    }

    parseStats(stats) {
        // Use proper regex without double backslashes
        const yardMatch = stats.match(/(\d+) yards/);
        const yards = yardMatch ? parseInt(yardMatch[1]) : 0;
        
        const catchMatch = stats.match(/(\d+) catches/);
        const catches = catchMatch ? parseInt(catchMatch[1]) : 0;
        
        const carryMatch = stats.match(/(\d+) carries/);
        const carries = carryMatch ? parseInt(carryMatch[1]) : 0;

        return { yards, catches, carries };
    }

    getTier(parsed, category) {
        const { yards, catches, carries } = parsed;

        if (category === 'Receiving') {
            if (yards >= 150 || catches >= 12) return 'ELITE';
            if (yards >= 100 || catches >= 8) return 'TIER1';
            if (yards >= 70 || catches >= 6) return 'TIER2';
            return 'TIER3';
        } else if (category === 'Rushing') {
            if (yards >= 120 || carries >= 20) return 'ELITE';
            if (yards >= 80 || carries >= 15) return 'TIER1';
            if (yards >= 60 || carries >= 10) return 'TIER2';
            return 'TIER3';
        }
        return 'TIER3';
    }

    generateReport() {
        console.log('\\n📝 Generating Final Report...');
        
        const sortedPlayers = this.allPlayers.sort((a, b) => b.yards - a.yards);

        const tiers = {
            ELITE: sortedPlayers.filter(p => p.fantasyTier === 'ELITE'),
            TIER1: sortedPlayers.filter(p => p.fantasyTier === 'TIER1'),
            TIER2: sortedPlayers.filter(p => p.fantasyTier === 'TIER2')
        };

        let report = `# 🏈 NFL FANTASY ROCK STARS - ${new Date().toLocaleDateString()}\\n\\n`;
        
        // Elite section
        if (tiers.ELITE.length > 0) {
            report += `## 💎 ELITE FANTASY PERFORMERS (${tiers.ELITE.length})\\n\\n`;
            tiers.ELITE.forEach((p, i) => {
                report += `${i + 1}. **${p.name}** (${p.team}) - ${p.position}\\n`;
                report += `   💎 **${p.yards} yards** | ${p.stats}\\n\\n`;
            });
        }

        // Tier 1 section  
        if (tiers.TIER1.length > 0) {
            report += `## 🥇 TIER 1 PERFORMERS (${tiers.TIER1.length})\\n\\n`;
            tiers.TIER1.forEach((p, i) => {
                report += `${i + 1}. **${p.name}** (${p.team}) - ${p.position}\\n`;
                report += `   🥇 **${p.yards} yards** | ${p.stats}\\n\\n`;
            });
        }

        // Top 20 overall
        report += `## 🔥 TOP 20 FANTASY PERFORMERS\\n\\n`;
        sortedPlayers.slice(0, 20).forEach((p, i) => {
            const emoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
            report += `${i + 1}. ${emoji} **${p.name}** (${p.team}): **${p.yards} yards**\\n`;
        });

        // Category leaders
        const receivers = sortedPlayers.filter(p => p.category === 'Receiving');
        const rushers = sortedPlayers.filter(p => p.category === 'Rushing');

        report += `\\n## 🎯 RECEIVING LEADERS\\n`;
        receivers.slice(0, 10).forEach((p, i) => {
            const emoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
            report += `${i + 1}. ${emoji} ${p.name} (${p.team}): ${p.yards} yards, ${p.catches} catches\\n`;
        });

        report += `\\n## 🏃 RUSHING LEADERS\\n`;
        rushers.slice(0, 10).forEach((p, i) => {
            const emoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
            report += `${i + 1}. ${emoji} ${p.name} (${p.team}): ${p.yards} yards, ${p.carries} carries\\n`;
        });

        // Summary
        report += `\\n## 📊 SUMMARY\\n\\n`;
        report += `- **Games Analyzed:** ${this.gameResults.length}\\n`;
        report += `- **Total Players:** ${this.allPlayers.length}\\n`;
        report += `- 💎 **Elite Performers:** ${tiers.ELITE.length}\\n`;
        report += `- 🥇 **Tier 1 Performers:** ${tiers.TIER1.length}\\n`;
        report += `- 🥈 **Tier 2 Performers:** ${tiers.TIER2.length}\\n\\n`;

        if (sortedPlayers.length > 0) {
            report += `### 🏆 FANTASY MVP: ${sortedPlayers[0].name} (${sortedPlayers[0].team})\\n`;
            report += `**${sortedPlayers[0].yards} yards** - ${sortedPlayers[0].stats}\\n`;
        }

        const filename = `NFL-Fantasy-Rock-Stars-FINAL.md`;
        writeFileSync(filename, report);
        
        console.log(`\\n🎉 REPORT COMPLETE: ${filename}`);
        console.log(`\\n🏆 RESULTS SUMMARY:`);
        console.log(`- Games: ${this.gameResults.length}`);
        console.log(`- Players: ${this.allPlayers.length}`);
        console.log(`- 💎 Elite: ${tiers.ELITE.length}`);
        console.log(`- 🥇 Tier 1: ${tiers.TIER1.length}`);
        
        if (tiers.ELITE.length > 0) {
            console.log(`\\n💎 ELITE ROCK STARS:`);
            tiers.ELITE.forEach(p => console.log(`- ${p.name} (${p.team}): ${p.yards} yards`));
        }
        
        if (tiers.TIER1.length > 0) {
            console.log(`\\n🥇 TIER 1 PERFORMERS:`);
            tiers.TIER1.forEach(p => console.log(`- ${p.name} (${p.team}): ${p.yards} yards`));
        }

        console.log(`\\n🔥 TOP 5:`);
        sortedPlayers.slice(0, 5).forEach((p, i) => {
            const emoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
            console.log(`${i + 1}. ${emoji} ${p.name}: ${p.yards} yards`);
        });
    }
}

const analyzer = new CorrectedNFLAnalyzer();
analyzer.analyzeAllGames();