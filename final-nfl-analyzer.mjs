#!/usr/bin/env node

/**
 * FINAL NFL Fantasy Analyzer - Correct Regex Parsing
 */

import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

class FinalNFLAnalyzer {
    constructor() {
        this.allPlayers = [];
        this.gameResults = [];
        this.timestamp = new Date().toISOString();
    }

    async analyzeAllGames() {
        console.log('🏈 FINAL NFL Fantasy Analysis Starting...');
        
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
            
            const jsonMatch = gamesOutput.match(/{"result".*}/);
            const gamesResponse = JSON.parse(jsonMatch[0]);
            const games = gamesResponse.result?.structuredContent?.sports?.nfl?.games || [];
            const completedGames = games.filter(game => game.status === 'final');
            
            console.log(`Found ${completedGames.length} completed games`);
            
            for (let i = 0; i < completedGames.length; i++) {
                const game = completedGames[i];
                console.log(`🔍 Analyzing Game ${i + 1}/${completedGames.length}: ${game.awayTeam} @ ${game.homeTeam}`);
                await this.analyzeGame(game);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.generateFinalReport();
            
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
                        players: gameData.keyPlayers.map(player => {
                            const parsed = this.parsePlayerStats(player);
                            return {
                                ...player,
                                ...parsed,
                                fantasyTier: this.getFantasyTier(parsed, player.category)
                            };
                        })
                    };
                    
                    this.gameResults.push(gameResult);
                    this.allPlayers.push(...gameResult.players);
                    
                    // Debug first player stats parsing
                    if (gameResult.players.length > 0) {
                        const first = gameResult.players[0];
                        console.log(`  Sample: ${first.name} - ${first.stats} -> ${first.yards} yards (${first.fantasyTier})`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`  ⚠️ Error: ${error.message}`);
        } finally {
            try { unlinkSync(filename); } catch (e) {}
        }
    }

    parsePlayerStats(player) {
        const stats = player.stats;
        
        // Parse yards - look for "XXX yards" pattern
        const yardMatch = stats.match(/(\\d+)\\s+yards/);
        const yards = yardMatch ? parseInt(yardMatch[1]) : 0;
        
        // Parse catches
        const catchMatch = stats.match(/(\\d+)\\s+catches/);
        const catches = catchMatch ? parseInt(catchMatch[1]) : 0;
        
        // Parse carries
        const carryMatch = stats.match(/(\\d+)\\s+carries/);
        const carries = carryMatch ? parseInt(carryMatch[1]) : 0;
        
        // Parse completions for QBs
        const compMatch = stats.match(/(\\d+)\\s+completions/);
        const completions = compMatch ? parseInt(compMatch[1]) : 0;

        return {
            yards,
            catches,
            carries,
            completions
        };
    }

    getFantasyTier(parsed, category) {
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
        } else if (category === 'Passing') {
            if (yards >= 300) return 'ELITE';
            if (yards >= 250) return 'TIER1';
            if (yards >= 200) return 'TIER2';
            return 'TIER3';
        }
        return 'TIER3';
    }

    generateFinalReport() {
        console.log('\\n📝 Generating FINAL Fantasy Report...');
        
        // Sort by yards
        const sortedPlayers = this.allPlayers.sort((a, b) => (b.yards || 0) - (a.yards || 0));

        // Create tiers
        const tiers = {
            ELITE: sortedPlayers.filter(p => p.fantasyTier === 'ELITE'),
            TIER1: sortedPlayers.filter(p => p.fantasyTier === 'TIER1'),
            TIER2: sortedPlayers.filter(p => p.fantasyTier === 'TIER2'),
            TIER3: sortedPlayers.filter(p => p.fantasyTier === 'TIER3')
        };

        let report = `# 🏈 COMPLETE NFL FANTASY ROCK STARS - ${new Date().toLocaleDateString()}\\n\\n`;
        report += `**Analysis Complete:** ${new Date().toLocaleTimeString()}\\n`;
        report += `**Games Analyzed:** ${this.gameResults.length}\\n`;
        report += `**Total Players:** ${this.allPlayers.length}\\n\\n`;

        // Elite performers section
        if (tiers.ELITE.length > 0) {
            report += `# 💎 ELITE FANTASY ROCK STARS (${tiers.ELITE.length})\\n\\n`;
            tiers.ELITE.forEach((player, i) => {
                report += `## ${i + 1}. ${player.name} (${player.team})\\n`;
                report += `**Position:** ${player.position} | **Category:** ${player.category}\\n`;
                report += `**Performance:** ${player.stats}\\n`;  
                report += `**Fantasy Impact:** 💎 ELITE (${player.yards} yards)\\n\\n`;
            });
        }

        // Tier 1 performers section
        if (tiers.TIER1.length > 0) {
            report += `# 🥇 TIER 1 FANTASY PERFORMERS (${tiers.TIER1.length})\\n\\n`;
            tiers.TIER1.forEach((player, i) => {
                report += `## ${i + 1}. ${player.name} (${player.team})\\n`;
                report += `**Position:** ${player.position} | **Category:** ${player.category}\\n`;
                report += `**Performance:** ${player.stats}\\n`;
                report += `**Fantasy Impact:** 🥇 TIER 1 (${player.yards} yards)\\n\\n`;
            });
        }

        // Top 15 overall performers
        report += `# 🔥 TOP 15 FANTASY PERFORMERS OF THE DAY\\n\\n`;
        sortedPlayers.slice(0, 15).forEach((player, i) => {
            const tierEmoji = player.fantasyTier === 'ELITE' ? '💎' : 
                            player.fantasyTier === 'TIER1' ? '🥇' : 
                            player.fantasyTier === 'TIER2' ? '🥈' : '🥉';
            report += `${i + 1}. ${tierEmoji} **${player.name}** (${player.team}) - ${player.position}\\n`;
            report += `   **${player.yards} yards** | ${player.stats}\\n\\n`;
        });

        // Category leaders
        const receivers = sortedPlayers.filter(p => p.category === 'Receiving');
        const rushers = sortedPlayers.filter(p => p.category === 'Rushing');

        if (receivers.length > 0) {
            report += `# 🎯 TOP RECEIVING PERFORMANCES\\n\\n`;
            receivers.slice(0, 10).forEach((p, i) => {
                const tierEmoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
                report += `${i + 1}. ${tierEmoji} **${p.name}** (${p.team}): **${p.yards} yards**, ${p.catches} catches\\n`;
            });
            report += `\\n`;
        }

        if (rushers.length > 0) {
            report += `# 🏃 TOP RUSHING PERFORMANCES\\n\\n`;
            rushers.slice(0, 10).forEach((p, i) => {
                const tierEmoji = p.fantasyTier === 'ELITE' ? '💎' : p.fantasyTier === 'TIER1' ? '🥇' : '🥈';
                report += `${i + 1}. ${tierEmoji} **${p.name}** (${p.team}): **${p.yards} yards**, ${p.carries} carries\\n`;
            });
            report += `\\n`;
        }

        // Game highlights
        report += `# 🎮 GAME-BY-GAME FANTASY HIGHLIGHTS\\n\\n`;
        this.gameResults.forEach(game => {
            const topPlayer = game.players.sort((a, b) => (b.yards || 0) - (a.yards || 0))[0];
            if (topPlayer) {
                report += `## ${game.game}\\n`;
                report += `**Venue:** ${game.venue}\\n`;
                report += `**Fantasy MVP:** ${topPlayer.name} (${topPlayer.yards} yards)\\n`;
                const eliteCount = game.players.filter(p => p.fantasyTier === 'ELITE').length;
                const tier1Count = game.players.filter(p => p.fantasyTier === 'TIER1').length;
                if (eliteCount > 0 || tier1Count > 0) {
                    report += `**Elite/Tier1 Players:** ${eliteCount + tier1Count}\\n`;
                }
                report += `\\n`;
            }
        });

        // Final summary
        report += `# 📊 FINAL FANTASY SUMMARY\\n\\n`;
        report += `- 💎 **Elite Performers (150+ rec yards, 120+ rush yards):** ${tiers.ELITE.length}\\n`;
        report += `- 🥇 **Tier 1 Performers (100+ rec yards, 80+ rush yards):** ${tiers.TIER1.length}\\n`;
        report += `- 🥈 **Tier 2 Performers (70+ rec yards, 60+ rush yards):** ${tiers.TIER2.length}\\n`;
        report += `- **Total Fantasy Contributors:** ${this.allPlayers.length}\\n\\n`;

        if (sortedPlayers.length > 0) {
            report += `## 🏆 TODAY'S FANTASY MVP\\n`;
            report += `### ${sortedPlayers[0].name} (${sortedPlayers[0].team})\\n`;
            report += `**Performance:** ${sortedPlayers[0].stats}\\n`;
            report += `**Fantasy Impact:** ${sortedPlayers[0].yards} yards - ${sortedPlayers[0].fantasyTier} tier\\n\\n`;
            
            report += `*This analysis covered all ${this.gameResults.length} completed NFL games from ${new Date().toLocaleDateString()}*\\n`;
        }

        // Save the final report
        const filename = `NFL-FANTASY-ROCKSTARS-${new Date().toISOString().split('T')[0]}.md`;
        writeFileSync(filename, report);
        
        console.log(`\\n🎉 FINAL REPORT GENERATED: ${filename}`);
        console.log(`\\n🏆 FANTASY ROCK STAR SUMMARY:`);
        console.log(`- Games Analyzed: ${this.gameResults.length}`);
        console.log(`- Total Players: ${this.allPlayers.length}`);
        console.log(`- 💎 Elite Performers: ${tiers.ELITE.length}`);
        console.log(`- 🥇 Tier 1 Performers: ${tiers.TIER1.length}`);
        console.log(`- 🥈 Tier 2 Performers: ${tiers.TIER2.length}`);
        
        if (sortedPlayers.length > 0) {
            console.log(`\\n🔥 TOP 5 FANTASY ROCK STARS:`);
            sortedPlayers.slice(0, 5).forEach((p, i) => {
                const tierEmoji = p.fantasyTier === 'ELITE' ? '💎' : 
                                p.fantasyTier === 'TIER1' ? '🥇' : 
                                p.fantasyTier === 'TIER2' ? '🥈' : '🥉';
                console.log(`${i + 1}. ${tierEmoji} ${p.name} (${p.team}): ${p.yards} yards`);
            });
        }

        if (tiers.ELITE.length > 0) {
            console.log(`\\n💎 ELITE PERFORMERS:`);
            tiers.ELITE.forEach(p => {
                console.log(`- ${p.name} (${p.team}): ${p.yards} yards, ${p.catches || p.carries || 0} ${p.category.toLowerCase()}`);
            });
        }

        if (tiers.TIER1.length > 0) {
            console.log(`\\n🥇 TIER 1 PERFORMERS:`);
            tiers.TIER1.forEach(p => {
                console.log(`- ${p.name} (${p.team}): ${p.yards} yards, ${p.catches || p.carries || 0} ${p.category.toLowerCase()}`);
            });
        }
    }
}

// Execute the final analyzer
const analyzer = new FinalNFLAnalyzer();
analyzer.analyzeAllGames();