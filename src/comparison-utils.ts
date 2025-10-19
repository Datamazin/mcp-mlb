/**
 * Player Comparison Utilities
 * 
 * Utilities for comparing player statistics inspired by MCP server best practices.
 * These utilities can be used by both the MCP server and standalone scripts.
 */

import { MLBAPIClient } from './mlb-api.js';

export interface PlayerComparisonResult {
  [x: string]: unknown;
  player1: {
    id: number;
    name: string;
    stats: any;
  };
  player2: {
    id: number;
    name: string;
    stats: any;
  };
  comparison: {
    category: string;
    player1Value: number;
    player2Value: number;
    winner: 'player1' | 'player2' | 'tie';
    difference: number;
  }[];
  overallWinner?: 'player1' | 'player2' | 'tie';
  summary: string;
}

/**
 * Compare two players' statistics
 */
export async function comparePlayers(
  mlbClient: MLBAPIClient,
  player1Id: number,
  player2Id: number,
  season: string | number = 'career',
  statGroup: 'hitting' | 'pitching' | 'fielding' = 'hitting'
): Promise<PlayerComparisonResult> {
  // Determine the stats type based on season
  const statsType = typeof season === 'string' && season === 'career' ? 'career' : 'season';
  const seasonYear = typeof season === 'string' && season === 'career' ? undefined : Number(season);

  // Fetch stats for both players
  const [player1Data, player2Data] = await Promise.all([
    mlbClient.getPlayerStats(player1Id, seasonYear, 'R', statsType),
    mlbClient.getPlayerStats(player2Id, seasonYear, 'R', statsType)
  ]);

  // Extract relevant stats based on stat group
  const stats1 = extractStats(player1Data, statGroup);
  const stats2 = extractStats(player2Data, statGroup);

  // Define key metrics for comparison based on stat group
  const metrics = getKeyMetrics(statGroup);

  // Perform comparison
  const comparison = metrics.map(metric => {
    const value1 = stats1[metric.key] || 0;
    const value2 = stats2[metric.key] || 0;
    
    let winner: 'player1' | 'player2' | 'tie';
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

  // Determine overall winner
  const player1Wins = comparison.filter(c => c.winner === 'player1').length;
  const player2Wins = comparison.filter(c => c.winner === 'player2').length;
  
  const overallWinner = player1Wins > player2Wins ? 'player1' : 
                       player2Wins > player1Wins ? 'player2' : 'tie';

  // Generate summary
  const summary = generateComparisonSummary(
    player1Data.player.fullName,
    player2Data.player.fullName,
    player1Wins,
    player2Wins,
    statGroup
  );

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

/**
 * Extract stats from player data based on stat group
 */
function extractStats(playerData: any, statGroup: string): Record<string, any> {
  const statObj = playerData.stats?.find((s: any) => 
    s.group?.displayName?.toLowerCase().includes(statGroup.toLowerCase())
  );
  
  return statObj?.stats || {};
}

/**
 * Get key metrics for comparison based on stat group
 */
function getKeyMetrics(statGroup: string): Array<{ key: string; name: string; higherIsBetter: boolean }> {
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

/**
 * Generate a human-readable comparison summary
 */
function generateComparisonSummary(
  player1Name: string,
  player2Name: string,
  player1Wins: number,
  player2Wins: number,
  statGroup: string
): string {
  if (player1Wins > player2Wins) {
    return `${player1Name} leads in ${player1Wins} out of ${player1Wins + player2Wins} key ${statGroup} categories.`;
  } else if (player2Wins > player1Wins) {
    return `${player2Name} leads in ${player2Wins} out of ${player1Wins + player2Wins} key ${statGroup} categories.`;
  } else {
    return `${player1Name} and ${player2Name} are tied in key ${statGroup} categories.`;
  }
}

/**
 * Format comparison result as a readable string
 */
export function formatComparisonResult(result: PlayerComparisonResult): string {
  let output = `\n${'='.repeat(80)}\n`;
  output += `PLAYER COMPARISON: ${result.player1.name} vs ${result.player2.name}\n`;
  output += `${'='.repeat(80)}\n\n`;

  // Category breakdown
  result.comparison.forEach(comp => {
    const winner = comp.winner === 'player1' ? result.player1.name : 
                  comp.winner === 'player2' ? result.player2.name : 'TIE';
    
    output += `${comp.category}:\n`;
    output += `  ${result.player1.name}: ${comp.player1Value}\n`;
    output += `  ${result.player2.name}: ${comp.player2Value}\n`;
    output += `  Winner: ${winner}\n\n`;
  });

  // Overall summary
  output += `${'='.repeat(80)}\n`;
  output += `SUMMARY: ${result.summary}\n`;
  output += `${'='.repeat(80)}\n`;

  return output;
}

/**
 * Search for players by name with better error handling
 */
export async function searchPlayerWithPrompt(
  mlbClient: MLBAPIClient,
  playerName: string
): Promise<number | null> {
  try {
    const results = await mlbClient.searchPlayers(playerName);
    
    if (!results.people || results.people.length === 0) {
      console.error(`No players found matching: ${playerName}`);
      return null;
    }

    // If exact match, return immediately
    if (results.people.length === 1) {
      return results.people[0].id;
    }

    // Multiple matches - return first (or implement selection logic)
    console.error(`Found ${results.people.length} players matching "${playerName}"`);
    console.error('Using first match:', results.people[0].fullName);
    
    return results.people[0].id;
  } catch (error) {
    console.error('Error searching for player:', error);
    return null;
  }
}
