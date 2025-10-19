#!/usr/bin/env node

/**
 * Enhanced Player Comparison Script
 * 
 * Uses the new comparison utilities from the MCP server architecture
 * Demonstrates improved code reusability and maintainability
 * 
 * Usage: node compare-players-enhanced.cjs "Player 1 Name" "Player 2 Name" [season] [statGroup]
 * Example: node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso" career hitting
 */

// Use native fetch (requires Node.js 18+)
const fetch = globalThis.fetch;

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// ============================================================================
// MLB API Client (Simplified version matching server architecture)
// ============================================================================

class MLBAPIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    console.error(`Making request to: ${url.toString()}`);

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`MLB API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from MLB API: ${error.message}`);
    }
  }

  async searchPlayers(name, activeStatus = 'Y') {
    const currentYear = new Date().getFullYear();
    const params = {
      sportId: 1,
      season: currentYear
    };

    const data = await this.makeRequest('/sports/1/players', params);
    
    if (!data.people) {
      return { people: [] };
    }

    // Client-side filtering
    const searchTerms = name.toLowerCase().split(' ');
    const filteredPlayers = data.people.filter(player => {
      return searchTerms.every(term => {
        return Object.values(player).some(value => {
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    });

    return { people: filteredPlayers };
  }

  async getPlayerStats(playerId, season, gameType = 'R', stats = 'season', group = 'hitting') {
    const currentYear = new Date().getFullYear();
    const params = {
      stats,
      season: season || currentYear,
      gameType,
      group  // Dynamic group parameter for hitting/pitching/fielding
    };

    const data = await this.makeRequest(`/people/${playerId}/stats`, params);
    
    if (!data.stats || data.stats.length === 0) {
      throw new Error(`No stats found for player with ID ${playerId}`);
    }

    // Find the stats for the requested group
    const requestedStats = data.stats.find(stat => 
      stat.group && stat.group.displayName && 
      stat.group.displayName.toLowerCase().includes(group.toLowerCase()) &&
      stat.splits && stat.splits.length > 0
    );

    if (!requestedStats) {
      throw new Error(`No ${group} stats found for player with ID ${playerId}`);
    }

    const split = requestedStats.splits[0];
    const player = split.player;
    
    const transformedStats = data.stats.map(stat => ({
      type: {
        displayName: stat.type?.displayName || 'Unknown'
      },
      group: {
        displayName: stat.group?.displayName || 'Unknown'
      },
      stats: stat.splits && stat.splits.length > 0 ? stat.splits[0].stat : {}
    }));
    
    return {
      player: {
        id: player.id,
        fullName: player.fullName,
        primaryPosition: {
          code: player.primaryPosition?.code || '',
          name: player.primaryPosition?.name || '',
          type: player.primaryPosition?.type || ''
        }
      },
      stats: transformedStats
    };
  }
}

// ============================================================================
// Comparison Utilities (Matching server architecture)
// ============================================================================

function extractStats(playerData, statGroup) {
  const statObj = playerData.stats?.find(s => 
    s.group?.displayName?.toLowerCase().includes(statGroup.toLowerCase())
  );
  
  return statObj?.stats || {};
}

function getKeyMetrics(statGroup) {
  switch (statGroup) {
    case 'hitting':
      return [
        { key: 'avg', name: 'Batting Average', higherIsBetter: true },
        { key: 'ops', name: 'OPS', higherIsBetter: true },
        { key: 'homeRuns', name: 'Home Runs', higherIsBetter: true },
        { key: 'rbi', name: 'RBIs', higherIsBetter: true },
        { key: 'hits', name: 'Hits', higherIsBetter: true }
      ];
    
    case 'pitching':
      return [
        { key: 'era', name: 'ERA', higherIsBetter: false },
        { key: 'whip', name: 'WHIP', higherIsBetter: false },
        { key: 'wins', name: 'Wins', higherIsBetter: true },
        { key: 'strikeOuts', name: 'Strikeouts', higherIsBetter: true },
        { key: 'inningsPitched', name: 'Innings Pitched', higherIsBetter: true }
      ];
    
    case 'fielding':
      return [
        { key: 'fielding', name: 'Fielding %', higherIsBetter: true },
        { key: 'assists', name: 'Assists', higherIsBetter: true },
        { key: 'putOuts', name: 'Putouts', higherIsBetter: true },
        { key: 'errors', name: 'Errors', higherIsBetter: false },
        { key: 'doublePlays', name: 'Double Plays', higherIsBetter: true }
      ];
    
    default:
      return [];
  }
}

async function comparePlayers(mlbClient, player1Id, player2Id, season = 'career', statGroup = 'hitting') {
  // Fetch stats for both players with the appropriate group parameter
  const [player1Data, player2Data] = await Promise.all([
    mlbClient.getPlayerStats(
      player1Id,
      typeof season === 'string' && season === 'career' ? undefined : Number(season),
      'R',
      typeof season === 'string' && season === 'career' ? 'career' : 'season',
      statGroup  // Pass the stat group (hitting/pitching/fielding)
    ),
    mlbClient.getPlayerStats(
      player2Id,
      typeof season === 'string' && season === 'career' ? undefined : Number(season),
      'R',
      typeof season === 'string' && season === 'career' ? 'career' : 'season',
      statGroup  // Pass the stat group (hitting/pitching/fielding)
    )
  ]);

  const stats1 = extractStats(player1Data, statGroup);
  const stats2 = extractStats(player2Data, statGroup);

  const metrics = getKeyMetrics(statGroup);

  const comparison = metrics.map(metric => {
    const value1 = stats1[metric.key] || 0;
    const value2 = stats2[metric.key] || 0;
    
    let winner;
    if (value1 > value2) {
      winner = metric.higherIsBetter ? 'player1' : 'player2';
    } else if (value2 > value1) {
      winner = metric.higherIsBetter ? 'player2' : 'player1';
    } else {
      winner = 'tie';
    }

    return {
      category: metric.name,
      player1Value: value1,
      player2Value: value2,
      winner,
      difference: Math.abs(value1 - value2)
    };
  });

  const player1Wins = comparison.filter(c => c.winner === 'player1').length;
  const player2Wins = comparison.filter(c => c.winner === 'player2').length;
  
  const overallWinner = player1Wins > player2Wins ? 'player1' : 
                       player2Wins > player1Wins ? 'player2' : 'tie';

  const summary = player1Wins > player2Wins
    ? `${player1Data.player.fullName} leads in ${player1Wins} out of ${player1Wins + player2Wins} key ${statGroup} categories.`
    : player2Wins > player1Wins
    ? `${player2Data.player.fullName} leads in ${player2Wins} out of ${player1Wins + player2Wins} key ${statGroup} categories.`
    : `${player1Data.player.fullName} and ${player2Data.player.fullName} are tied in key ${statGroup} categories.`;

  return {
    player1: {
      id: player1Id,
      name: player1Data.player.fullName,
      stats: stats1
    },
    player2: {
      id: player2Id,
      name: player2Data.player.fullName,
      stats: stats2
    },
    comparison,
    overallWinner,
    summary
  };
}

function formatComparisonResult(result) {
  let output = `\n${'='.repeat(80)}\n`;
  output += `PLAYER COMPARISON: ${result.player1.name} vs ${result.player2.name}\n`;
  output += `${'='.repeat(80)}\n\n`;

  result.comparison.forEach(comp => {
    const winner = comp.winner === 'player1' ? result.player1.name : 
                  comp.winner === 'player2' ? result.player2.name : 'TIE';
    
    output += `${comp.category}:\n`;
    output += `  ${result.player1.name}: ${comp.player1Value}\n`;
    output += `  ${result.player2.name}: ${comp.player2Value}\n`;
    output += `  Winner: ${winner}\n\n`;
  });

  output += `${'='.repeat(80)}\n`;
  output += `SUMMARY: ${result.summary}\n`;
  output += `${'='.repeat(80)}\n`;

  return output;
}

async function searchPlayerWithPrompt(mlbClient, playerName) {
  const results = await mlbClient.searchPlayers(playerName);
  
  if (!results.people || results.people.length === 0) {
    throw new Error(`No players found matching: ${playerName}`);
  }

  if (results.people.length === 1) {
    return results.people[0].id;
  }

  console.error(`\nFound ${results.people.length} players matching "${playerName}":`);
  results.people.forEach((player, index) => {
    console.error(`  ${index + 1}. ${player.fullName} (ID: ${player.id})`);
  });
  
  console.error('\nUsing first match by default.');
  return results.people[0].id;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node compare-players-enhanced.cjs "Player 1 Name" "Player 2 Name" [season] [statGroup]');
    console.error('Example: node compare-players-enhanced.cjs "Aaron Judge" "Pete Alonso" career hitting');
    process.exit(1);
  }

  const player1Name = args[0];
  const player2Name = args[1];
  const season = args[2] || 'career';
  const statGroup = args[3] || 'hitting';

  console.log('\n🔍 Enhanced Player Comparison Tool');
  console.log('━'.repeat(80));
  console.log(`\nSearching for: ${player1Name} vs ${player2Name}`);
  console.log(`Season: ${season}`);
  console.log(`Stat Group: ${statGroup}\n`);

  try {
    const mlbClient = new MLBAPIClient(MLB_API_BASE);

    // Search for both players
    console.error('Searching for Player 1...');
    const player1Id = await searchPlayerWithPrompt(mlbClient, player1Name);
    
    console.error('\nSearching for Player 2...');
    const player2Id = await searchPlayerWithPrompt(mlbClient, player2Name);

    console.error('\n━'.repeat(80));
    console.error('Fetching player statistics...\n');

    // Compare the players
    const result = await comparePlayers(mlbClient, player1Id, player2Id, season, statGroup);

    // Display results
    console.log(formatComparisonResult(result));

    console.log('\n✅ Comparison complete!\n');
    console.log('💡 This script uses the enhanced architecture from the MCP server.');
    console.log('   Code is modular, reusable, and follows best practices.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
