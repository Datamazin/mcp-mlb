#!/usr/bin/env node

/**
 * ESPN Highlight Capture for NFL (Daily)
 *
 * - Fetches ESPN Scoreboard for a given date (defaults to today)
 * - For each event, fetches Summary and Boxscore
 * - Extracts player stats (QB/RB/WR/TE), computes PPR fantasy points
 * - Builds per-game highlights: top fantasy players, leaders, scoring plays
 * - Writes JSON and Markdown reports
 *
 * Scoring (PPR default):
 * - Rushing yards: 0.1/yd, TD: 6
 * - Receiving yards: 0.1/yd, Receptions: 1, TD: 6
 * - Passing yards: 0.04/yd, TD: 4, INT: -2
 * - Fumbles lost: -2 (if available)
 */

import fs from 'fs';

const ESPN = {
  scoreboard: (yyyymmdd) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${yyyymmdd}`,
  summary: (eventId) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`,
  boxscore: (gameId) => `https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=${gameId}`,
  pbp: (gameId) => `https://cdn.espn.com/core/nfl/playbyplay?xhr=1&gameId=${gameId}`,
  fantasyLeaders: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders`,
};

// Node 18+ global fetch. If not available, you can uncomment to use node-fetch.
// import fetch from 'node-fetch';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, { retries = 3, backoffMs = 500 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      if (attempt === retries) throw new Error(`Failed to fetch ${url}: ${err.message}`);
      await sleep(backoffMs * attempt);
    }
  }
}

function toYYYYMMDD(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function safeNum(x) {
  if (x == null) return 0;
  const n = Number(String(x).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function computePPRPoints(stats) {
  // stats: { passYds, passTD, passINT, rushYds, rushTD, recYds, recTD, rec }
  let pts = 0;
  pts += (stats.rushYds || 0) * 0.1;
  pts += (stats.recYds || 0) * 0.1;
  pts += (stats.rec || 0) * 1;
  pts += (stats.rushTD || 0) * 6;
  pts += (stats.recTD || 0) * 6;
  // Passing
  pts += (stats.passYds || 0) * 0.04;
  pts += (stats.passTD || 0) * 4;
  pts += (stats.passINT || 0) * -2;
  // Fumbles lost (if present)
  pts += (stats.fumblesLost || 0) * -2;
  return Math.round(pts * 10) / 10;
}

function mergePlayerStats(a = {}, b = {}) {
  const merged = { ...a };
  for (const k of Object.keys(b)) merged[k] = (merged[k] || 0) + (b[k] || 0);
  return merged;
}

function normalizeName(athlete) {
  if (!athlete) return 'Unknown';
  if (typeof athlete === 'string') return athlete;
  return athlete.displayName || athlete.name || athlete.fullName || 'Unknown';
}

function pickTeamId(team) {
  if (!team) return null;
  if (team.id) return team.id;
  if (team.team && team.team.id) return team.team.id;
  return null;
}

// ESPN boxscore parser (summary endpoint -> boxscore.players)
function extractPlayersFromSummaryBoxscore(summaryJson) {
  const players = new Map(); // key: athleteId or name
  const box = summaryJson?.boxscore;
  const teams = box?.teams || [];
  const playerBlocks = box?.players || [];

  for (const teamBlock of playerBlocks) {
    const teamName = teamBlock?.team?.displayName || teamBlock?.team?.name || 'Unknown Team';
    const statsGroups = teamBlock?.statistics || [];

    for (const group of statsGroups) {
      const statType = (group?.name || group?.type || '').toLowerCase(); // passing, rushing, receiving
      const athletes = group?.athletes || [];
      for (const a of athletes) {
        const name = normalizeName(a?.athlete);
        const key = a?.athlete?.id || name;
        const base = players.get(key) || { name, team: teamName, stats: {} };
        let add = {};
        if (statType.includes('passing')) {
          add = {
            passYds: safeNum(a?.stats?.yards || a?.yards || a?.statValues?.yards),
            passTD: safeNum(a?.stats?.touchdowns || a?.touchdowns),
            passINT: safeNum(a?.stats?.interceptions || a?.interceptions),
          };
        } else if (statType.includes('rushing')) {
          add = {
            rushYds: safeNum(a?.stats?.yards || a?.yards),
            rushTD: safeNum(a?.stats?.touchdowns || a?.touchdowns),
            carries: safeNum(a?.stats?.attempts || a?.attempts),
          };
        } else if (statType.includes('receiving')) {
          add = {
            recYds: safeNum(a?.stats?.yards || a?.yards),
            recTD: safeNum(a?.stats?.touchdowns || a?.touchdowns),
            rec: safeNum(a?.stats?.receptions || a?.receptions),
          };
        }
        base.stats = mergePlayerStats(base.stats, add);
        players.set(key, base);
      }
    }
  }

  return Array.from(players.values());
}

// ESPN core boxscore parser (core endpoint -> gamepackageJSON.boxscore.players[*].statistics)
function extractPlayersFromCoreBoxscore(coreJson) {
  const gp = coreJson?.gamepackageJSON;
  const blocks = gp?.boxscore?.players || [];
  const players = new Map();

  for (const teamBlock of blocks) {
    const teamName = teamBlock?.team?.displayName || teamBlock?.team?.name || 'Unknown Team';
    const statistics = teamBlock?.statistics || [];
    for (const group of statistics) {
      const statType = (group?.name || group?.type || '').toLowerCase();
      const athletes = group?.athletes || [];
      for (const a of athletes) {
        const name = normalizeName(a?.athlete);
        const key = a?.athlete?.id || name;
        const base = players.get(key) || { name, team: teamName, stats: {} };
        const headers = group?.labels || group?.labelsMap || group?.labelsNames || [];
        const values = a?.stats || a?.athlete?.stats || [];
        // Common mappings
        const map = {};
        headers.forEach((h, i) => { map[h] = values[i]; });

        let add = {};
        if (statType.includes('passing')) {
          add = {
            passYds: safeNum(map['YDS'] || map['YDS\n'] || map['YDS ']),
            passTD: safeNum(map['TD']),
            passINT: safeNum(map['INT']),
          };
        } else if (statType.includes('rushing')) {
          add = {
            rushYds: safeNum(map['YDS']),
            rushTD: safeNum(map['TD']),
            carries: safeNum(map['CAR'] || map['ATT']),
          };
        } else if (statType.includes('receiving')) {
          add = {
            recYds: safeNum(map['YDS']),
            recTD: safeNum(map['TD']),
            rec: safeNum(map['REC'] || map['RECEIVING']),
          };
        }
        base.stats = mergePlayerStats(base.stats, add);
        players.set(key, base);
      }
    }
  }

  return Array.from(players.values());
}

function summarizeScoringPlays(summaryJson) {
  const list = [];
  const scoring = summaryJson?.scoringPlays || [];
  for (const p of scoring) {
    list.push({
      clock: p?.clock?.displayValue || '',
      period: p?.period?.number != null ? `Q${p.period.number}` : '',
      text: p?.text || p?.type?.text || '',
      team: p?.team?.displayName || p?.team?.name || '',
      score: p?.scoreValue != null && p?.awayScore != null && p?.homeScore != null
        ? `${p.awayScore}-${p.homeScore}`
        : undefined,
    });
  }
  return list;
}

function buildGameHighlights(event, players, scoringPlays) {
  // Compute PPR points and rank
  const withPoints = players.map(p => ({
    ...p,
    fantasyPoints: computePPRPoints(p.stats || {}),
  })).sort((a, b) => b.fantasyPoints - a.fantasyPoints);

  const top5 = withPoints.slice(0, 5);

  const qbLeader = withPoints
    .filter(p => (p.stats?.passYds || 0) > 0)
    .sort((a, b) => (b.stats.passYds || 0) - (a.stats.passYds || 0))[0];

  const rushLeader = withPoints
    .filter(p => (p.stats?.rushYds || 0) > 0)
    .sort((a, b) => (b.stats.rushYds || 0) - (a.stats.rushYds || 0))[0];

  const recLeader = withPoints
    .filter(p => (p.stats?.recYds || 0) > 0)
    .sort((a, b) => (b.stats.recYds || 0) - (a.stats.recYds || 0))[0];

  return {
    gameId: event?.id,
    status: event?.status?.type?.name,
    name: event?.name,
    shortName: event?.shortName,
    venue: event?.competitions?.[0]?.venue?.fullName,
    competitors: event?.competitions?.[0]?.competitors?.map(c => ({
      id: c?.id,
      team: c?.team?.displayName,
      abbreviation: c?.team?.abbreviation,
      score: c?.score,
      homeAway: c?.homeAway,
    })),
    top5,
    qbLeader,
    rushLeader,
    recLeader,
    scoringPlays,
  };
}

function toMarkdownReport(dateStr, gameHighlights) {
  let md = `# 🏈 ESPN NFL Highlights - ${dateStr}\n\n`;
  for (const g of gameHighlights) {
    const away = g.competitors?.find(c => c.homeAway === 'away');
    const home = g.competitors?.find(c => c.homeAway === 'home');
    const title = away && home ? `${away.team} ${away.score} @ ${home.team} ${home.score}` : g.shortName || g.name;
    md += `## ${title}\n`;
    if (g.venue) md += `**Venue:** ${g.venue}\n\n`;

    // Top fantasy performers
    md += `### 🔥 Top Fantasy Performers (PPR)\n`;
    g.top5.forEach((p, i) => {
      const s = p.stats || {};
      const parts = [];
      if (s.passYds) parts.push(`${s.passYds} pass yds${s.passTD ? ", " + s.passTD + " pass TDs" : ''}${s.passINT ? ", " + s.passINT + " INT" : ''}`);
      if (s.rushYds) parts.push(`${s.rushYds} rush yds${s.rushTD ? ", " + s.rushTD + " TD" : ''}`);
      if (s.recYds || s.rec) parts.push(`${s.rec || 0} rec, ${s.recYds || 0} yds${s.recTD ? ", " + s.recTD + " TD" : ''}`);
      md += `${i + 1}. **${p.name}** (${p.team}) — ${p.fantasyPoints} pts — ${parts.join(' | ')}\n`;
    });

    // Leaders
    md += `\n### 🏆 Leaders\n`;
    if (g.qbLeader) md += `- Passing: **${g.qbLeader.name}** (${g.qbLeader.team}) — ${g.qbLeader.stats.passYds} yds, ${g.qbLeader.stats.passTD || 0} TD, ${g.qbLeader.stats.passINT || 0} INT\n`;
    if (g.rushLeader) md += `- Rushing: **${g.rushLeader.name}** (${g.rushLeader.team}) — ${g.rushLeader.stats.rushYds} yds, ${g.rushLeader.stats.rushTD || 0} TD\n`;
    if (g.recLeader) md += `- Receiving: **${g.recLeader.name}** (${g.recLeader.team}) — ${g.recLeader.stats.recYds} yds, ${g.recLeader.stats.rec || 0} rec, ${g.recLeader.stats.recTD || 0} TD\n`;

    // Scoring plays
    if (g.scoringPlays?.length) {
      md += `\n### 🧨 Scoring Plays\n`;
      g.scoringPlays.forEach(sp => {
        md += `- ${sp.period} ${sp.clock} — ${sp.text}\n`;
      });
    }
    md += `\n`;
  }
  return md;
}

async function main() {
  const argDate = process.argv.find(a => a.startsWith('--date='))?.split('=')[1];
  const yyyymmdd = argDate || toYYYYMMDD(new Date());
  const dateNice = `${yyyymmdd.slice(0,4)}-${yyyymmdd.slice(4,6)}-${yyyymmdd.slice(6,8)}`;

  console.log(`🗓️  Fetching ESPN NFL highlights for ${dateNice}...`);

  const scoreboard = await fetchJSON(ESPN.scoreboard(yyyymmdd));
  const events = scoreboard?.events || [];
  console.log(`📅 Found ${events.length} events`);

  const gameHighlights = [];

  for (const [idx, event] of events.entries()) {
    const eventId = event?.id || event?.uid?.split('~')?.pop();
    const comp = event?.competitions?.[0];
    const gameId = comp?.id || eventId;
    const status = event?.status?.type?.name || comp?.status?.type?.name;
    console.log(`\n[${idx + 1}/${events.length}] Processing game ${event?.shortName || event?.name} — status: ${status}`);

    // Fetch summary
    let summaryJson = null;
    try {
      summaryJson = await fetchJSON(ESPN.summary(eventId));
    } catch (e) {
      console.warn(`  ⚠️ Summary failed: ${e.message}`);
    }

    // Optional: fetch core boxscore
    let coreBoxJson = null;
    try {
      coreBoxJson = await fetchJSON(ESPN.boxscore(gameId));
    } catch (e) {
      console.warn(`  ⚠️ Boxscore failed: ${e.message}`);
    }

    // Extract players
    let players = [];
    try {
      const fromSummary = extractPlayersFromSummaryBoxscore(summaryJson) || [];
      const fromCore = extractPlayersFromCoreBoxscore(coreBoxJson) || [];

      // Merge by name+team
      const map = new Map();
      for (const p of [...fromSummary, ...fromCore]) {
        const key = `${p.name}|${p.team}`;
        const existing = map.get(key);
        if (existing) {
          existing.stats = mergePlayerStats(existing.stats, p.stats);
        } else {
          map.set(key, { ...p });
        }
      }
      players = Array.from(map.values());
    } catch (e) {
      console.warn(`  ⚠️ Player extraction failed: ${e.message}`);
    }

    // Scoring plays
    const scoringPlays = summarizeScoringPlays(summaryJson);

    const highlight = buildGameHighlights(event, players, scoringPlays);
    gameHighlights.push(highlight);

    // Be gentle to ESPN
    await sleep(300);
  }

  // Write JSON
  const jsonFile = `espn-highlights-${dateNice}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify({ date: dateNice, games: gameHighlights }, null, 2));

  // Write Markdown
  const md = toMarkdownReport(dateNice, gameHighlights);
  const mdFile = `ESPN-Highlights-${dateNice}.md`;
  fs.writeFileSync(mdFile, md);

  console.log(`\n✅ Wrote ${jsonFile} and ${mdFile}`);
}

main().catch(err => {
  console.error('❌ ESPN Highlight Capture failed:', err);
  process.exit(1);
});
