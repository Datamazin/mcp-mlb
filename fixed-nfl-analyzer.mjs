#!/usr/bin/env node

/**
 * Fixed NFL Fantasy Analyzer - Corrected Fantasy Tier Logic
 */

import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

class FixedNFLAnalyzer {
    constructor() {
        this.allPlayers = [];
        this.gameResults = [];
        this.timestamp = new Date().toISOString();
    }

    async analyzeAllGames() {
        console.log('🏈 Getting all NFL games...');
        
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
            if (!jsonMatch) {
                throw new Error('No valid JSON found in games response');
            }
            
            const gamesResponse = JSON.parse(jsonMatch[0]);
            const games = gamesResponse.result?.structuredContent?.sports?.nfl?.games || [];
            const completedGames = games.filter(game => game.status === 'final');
            
            console.log(`Found ${completedGames.length} completed games`);
            
            for (let i = 0; i < completedGames.length; i++) {
                const game = completedGames[i];
                console.log(`🔍 Game ${i + 1}/${completedGames.length}: ${game.awayTeam} @ ${game.homeTeam}`);
                await this.analyzeGame(game);
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            this.generateEnhancedReport();
            
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
                            ...this.parsePlayerStats(player),
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

    parsePlayerStats(player) {
        const stats = player.stats;
        let yards = 0;
        let carries = 0;
        let catches = 0;
        let attempts = 0;

        // Extract yards from various formats
        const yardMatches = [
            stats.match(/(\\d+) yards/),
            stats.match(/(\\d+) receiving yards/),
            stats.match(/(\\d+) rushing yards/),
            stats.match(/(\\d+) passing yards/)
        ];
        
        for (const match of yardMatches) {
            if (match) {
                yards = Math.max(yards, parseInt(match[1]));
            }
        }

        // Extract other stats
        const carryMatch = stats.match(/(\\d+) carries/);
        if (carryMatch) carries = parseInt(carryMatch[1]);
        
        const catchMatch = stats.match(/(\\d+) catches/);
        if (catchMatch) catches = parseInt(catchMatch[1]);
        
        const attemptMatch = stats.match(/(\\d+) attempts/);
        if (attemptMatch) attempts = parseInt(attemptMatch[1]);

        return {
            parsedYards: yards,
            parsedCarries: carries,
            parsedCatches: catches,
            parsedAttempts: attempts
        };
    }

    getFantasyTier(player) {
        const parsed = this.parsePlayerStats(player);
        const yards = parsed.parsedYards;
        const catches = parsed.parsedCatches;
        const carries = parsed.parsedCarries;

        if (player.category === 'Receiving') {
            if (yards >= 150 || catches >= 12) return 'ELITE';
            if (yards >= 100 || catches >= 8) return 'TIER1';
            if (yards >= 70 || catches >= 6) return 'TIER2';
            return 'TIER3';
        } else if (player.category === 'Rushing') {
            if (yards >= 120 || carries >= 20) return 'ELITE';
            if (yards >= 80 || carries >= 15) return 'TIER1';
            if (yards >= 60 || carries >= 10) return 'TIER2';
            return 'TIER3';
        } else if (player.category === 'Passing') {
            if (yards >= 300) return 'ELITE';
            if (yards >= 250) return 'TIER1';
            if (yards >= 200) return 'TIER2';
            return 'TIER3';
        }
        return 'TIER3';
    }

    generateEnhancedReport() {
        console.log('\\n📝 Generating Enhanced Fantasy Report...');
        
        // Sort by yards
        const sortedPlayers = this.allPlayers.sort((a, b) => {
            return (b.parsedYards || 0) - (a.parsedYards || 0);
        });

        // Create tiers
        const tiers = {
            ELITE: sortedPlayers.filter(p => p.fantasyTier === 'ELITE'),
            TIER1: sortedPlayers.filter(p => p.fantasyTier === 'TIER1'),
            TIER2: sortedPlayers.filter(p => p.fantasyTier === 'TIER2'),
            TIER3: sortedPlayers.filter(p => p.fantasyTier === 'TIER3')
        };

        let report = `# 🏈 COMPLETE NFL FANTASY ANALYSIS - ${new Date().toLocaleDateString()}\\n\\n`;
        report += `**Analysis Time:** ${this.timestamp}\\n`;
        report += `**Games Analyzed:** ${this.gameResults.length}\\n`;
        report += `**Total Players:** ${this.allPlayers.length}\\n\\n`;

        // Elite performers first
        if (tiers.ELITE.length > 0) {
            report += `## 💎 ELITE FANTASY PERFORMERS (${tiers.ELITE.length})\\n\\n`;
            tiers.ELITE.forEach((player, i) => {
                report += `${i + 1}. **${player.name}** (${player.team}) - ${player.position}\\n`;
                report += `   📊 **${player.parsedYards} yards** - ${player.stats}\\n\\n`;
            });
        }

        // Tier 1 performers
        if (tiers.TIER1.length > 0) {
            report += `## 🥇 TIER 1 PERFORMERS (${tiers.TIER1.length})\\n\\n`;
            tiers.TIER1.forEach((player, i) => {
                report += `${i + 1}. **${player.name}** (${player.team}) - ${player.position}\\n`;
                report += `   📊 **${player.parsedYards} yards** - ${player.stats}\\n\\n`;
            });
        }

        // Top 20 overall
        report += `\\n## 🔥 TOP 20 FANTASY PERFORMERS\\n\\n`;
        sortedPlayers.slice(0, 20).forEach((player, i) => {
            const tierEmoji = player.fantasyTier === 'ELITE' ? '💎' : 
                            player.fantasyTier === 'TIER1' ? '🥇' : 
                            player.fantasyTier === 'TIER2' ? '🥈' : '🥉';
            report += `${i + 1}. ${tierEmoji} **${player.name}** (${player.team}) - ${player.position}: **${player.parsedYards} yards**\\n`;
        });

        // Category leaders
        const receivers = sortedPlayers.filter(p => p.category === 'Receiving');
        const rushers = sortedPlayers.filter(p => p.category === 'Rushing');
        const passers = sortedPlayers.filter(p => p.category === 'Passing');

        report += `\\n## 🏆 CATEGORY LEADERS\\n\\n`;
        
        if (receivers.length > 0) {
            report += `### 🎯 Top Receivers\\n`;
            receivers.slice(0, 10).forEach((p, i) => {
                report += `${i + 1}. **${p.name}** (${p.team}): ${p.parsedYards} yards, ${p.parsedCatches} catches\\n`;
            });
            report += `\\n`;
        }

        if (rushers.length > 0) {
            report += `### 🏃 Top Rushers\\n`;
            rushers.slice(0, 10).forEach((p, i) => {
                report += `${i + 1}. **${p.name}** (${p.team}): ${p.parsedYards} yards, ${p.parsedCarries} carries\\n`;
            });
            report += `\\n`;
        }

        // Game highlights
        report += `## 🎮 GAME HIGHLIGHTS\\n\\n`;
        this.gameResults.forEach(game => {
            const topPlayer = game.players.sort((a, b) => (b.parsedYards || 0) - (a.parsedYards || 0))[0];
            if (topPlayer) {
                report += `### ${game.game}\\n`;
                report += `**Top Performer:** ${topPlayer.name} (${topPlayer.parsedYards} yards)\\n`;
                report += `**All Contributors:** ${game.players.length} players\\n\\n`;
            }
        });

        // Summary stats
        report += `## 📊 FINAL SUMMARY\\n\\n`;
        report += `- 💎 **Elite Performers:** ${tiers.ELITE.length}\\n`;
        report += `- 🥇 **Tier 1 Performers:** ${tiers.TIER1.length}\\n`;
        report += `- 🥈 **Tier 2 Performers:** ${tiers.TIER2.length}\\n`;
        report += `- **Total Fantasy Relevant:** ${this.allPlayers.length}\\n\\n`;

        if (sortedPlayers.length > 0) {
            report += `### 🏆 TODAY'S FANTASY MVP\\n`;
            report += `**${sortedPlayers[0].name}** (${sortedPlayers[0].team})\\n`;
            report += `📊 **${sortedPlayers[0].parsedYards} yards** - ${sortedPlayers[0].stats}\\n\\n`;
        }

        // Save enhanced report
        const filename = `COMPLETE-NFL-Fantasy-Analysis-${new Date().toISOString().split('T')[0]}.md`;
        writeFileSync(filename, report);
        
        console.log(`\\n🎉 Enhanced Report Generated: ${filename}`);
        console.log(`\\n📊 FINAL SUMMARY:`);
        console.log(`- Games Analyzed: ${this.gameResults.length}`);
        console.log(`- Total Players: ${this.allPlayers.length}`);
        console.log(`- 💎 Elite Performers: ${tiers.ELITE.length}`);
        console.log(`- 🥇 Tier 1 Performers: ${tiers.TIER1.length}`);
        console.log(`- 🥈 Tier 2 Performers: ${tiers.TIER2.length}`);
        
        if (sortedPlayers.length > 0) {
            console.log(`\\n🏆 TOP 5 FANTASY PERFORMERS:`);
            sortedPlayers.slice(0, 5).forEach((p, i) => {
                const tierEmoji = p.fantasyTier === 'ELITE' ? '💎' : 
                                p.fantasyTier === 'TIER1' ? '🥇' : 
                                p.fantasyTier === 'TIER2' ? '🥈' : '🥉';
                console.log(`${i + 1}. ${tierEmoji} ${p.name} (${p.team}): ${p.parsedYards} yards`);
            });
        }

        // Show elite performers specifically
        if (tiers.ELITE.length > 0) {
            console.log(`\\n💎 TODAY'S ELITE FANTASY PERFORMERS:`);
            tiers.ELITE.forEach(p => {
                console.log(`- ${p.name} (${p.team}): ${p.parsedYards} yards - ${p.category}`);
            });
        }
    }
}

// Run the fixed analyzer
const analyzer = new FixedNFLAnalyzer();
analyzer.analyzeAllGames();