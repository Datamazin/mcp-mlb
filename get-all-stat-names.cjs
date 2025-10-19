/**
 * Get all stat names for each category
 */

const { SportAPIFactory } = require('./build/api/sport-api-factory.js');

async function getAllStatNames() {
  console.log('📋 ESPN Stat Names by Category\n');

  const nflAPI = SportAPIFactory.getClient('nfl');

  // Passing
  console.log('=' .repeat(80));
  console.log('PASSING CATEGORY (Patrick Mahomes)');
  console.log('='.repeat(80));
  const passing = await nflAPI.getPlayerStats(3139477, { season: 2025, statCategory: 'passing' });
  if (passing?.splits?.categories?.[0]?.stats) {
    passing.splits.categories[0].stats.forEach(stat => {
      console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
    });
  }

  // Rushing
  console.log('\n' + '='.repeat(80));
  console.log('RUSHING CATEGORY (Derrick Henry)');
  console.log('='.repeat(80));
  const rushing = await nflAPI.getPlayerStats(3043078, { season: 2025, statCategory: 'rushing' });
  if (rushing?.splits?.categories?.[0]?.stats) {
    rushing.splits.categories[0].stats.forEach(stat => {
      console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
    });
  }

  // Receiving
  console.log('\n' + '='.repeat(80));
  console.log('RECEIVING CATEGORY (Rome Odunze)');
  console.log('='.repeat(80));
  const receiving = await nflAPI.getPlayerStats(4431299, { season: 2025, statCategory: 'receiving' });
  if (receiving?.splits?.categories?.[0]?.stats) {
    receiving.splits.categories[0].stats.forEach(stat => {
      console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
    });
  }

  // Defensive
  console.log('\n' + '='.repeat(80));
  console.log('DEFENSIVE CATEGORY (sample player)');
  console.log('='.repeat(80));
  // Search for a defensive player
  const defPlayers = await nflAPI.searchPlayers('Nick Bosa');
  if (defPlayers.length > 0) {
    const defensive = await nflAPI.getPlayerStats(defPlayers[0].id, { season: 2025, statCategory: 'defensive' });
    if (defensive?.splits?.categories?.[0]?.stats) {
      defensive.splits.categories[0].stats.forEach(stat => {
        console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
      });
    }
  }

  // General
  console.log('\n' + '='.repeat(80));
  console.log('GENERAL CATEGORY (Patrick Mahomes)');
  console.log('='.repeat(80));
  const general = await nflAPI.getPlayerStats(3139477, { season: 2025, statCategory: 'general' });
  if (general?.splits?.categories?.[0]?.stats) {
    general.splits.categories[0].stats.forEach(stat => {
      console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
    });
  }

  // Scoring
  console.log('\n' + '='.repeat(80));
  console.log('SCORING CATEGORY (Patrick Mahomes)');
  console.log('='.repeat(80));
  const scoring = await nflAPI.getPlayerStats(3139477, { season: 2025, statCategory: 'scoring' });
  if (scoring?.splits?.categories?.[0]?.stats) {
    scoring.splits.categories[0].stats.forEach(stat => {
      console.log(`  ${stat.name.padEnd(30)} - ${stat.displayName}`);
    });
  }
}

getAllStatNames().catch(console.error);
