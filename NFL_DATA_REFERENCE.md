# NFL Data Reference - nflverse

## Overview
This document provides a quick reference for using nflverse-data in the multi-sport MCP server.

**Source:** [nflverse-data](https://github.com/nflverse/nflverse-data)  
**Documentation:** [nflreadr](https://nflreadr.nflverse.com/)

## Key Differences from MLB/NBA APIs

| Aspect | MLB/NBA | NFL (nflverse) |
|--------|---------|----------------|
| **API Type** | REST API | Static files (GitHub releases) |
| **Authentication** | None (MLB) / API Key (NBA) | None |
| **Data Format** | JSON | CSV, Parquet, RDS |
| **Updates** | Real-time | GitHub Actions (periodic) |
| **File Size** | Small responses | Large files (50-200MB) |
| **Caching** | Optional | Highly recommended |

## Available Datasets

### Core Data Files

#### 1. Players
**URL:** `https://github.com/nflverse/nflverse-data/releases/download/players/players.csv`

**Fields:**
```typescript
{
  gsis_id: string;           // Primary ID (e.g., "00-0033537")
  short_name: string;        // "P.Mahomes"
  full_name: string;         // "Patrick Mahomes"
  first_name: string;
  last_name: string;
  position: string;          // "QB", "RB", "WR", etc.
  height: string;            // "6-3"
  weight: number;            // 230
  college: string;
  status: string;            // "ACT" (Active), "RES" (Reserve), etc.
  entry_year: number;        // Year entered NFL
  rookie_year: number;
  draft_club: string;        // Team that drafted player
  draft_number: number;
}
```

**Usage:**
- Player search by name
- Current roster information
- Player profile data

---

#### 2. Rosters (Season-specific)
**URL Pattern:** `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{YEAR}.parquet`

**Example:** `roster_2024.parquet`

**Fields:**
```typescript
{
  season: number;
  team: string;              // Team abbreviation
  position: string;
  depth_chart_position: string;
  jersey_number: number;
  status: string;
  full_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  height: string;
  weight: number;
  college: string;
  gsis_id: string;           // Links to players.csv
  espn_id: string;
  sportradar_id: string;
  yahoo_id: string;
  rotowire_id: string;
  pff_id: string;
  pfr_id: string;            // Pro Football Reference ID
  fantasy_data_id: string;
  sleeper_id: string;
  years_exp: number;
  headshot_url: string;
}
```

**Usage:**
- Team rosters by season
- Player team history
- Cross-platform ID mapping

---

#### 3. Player Stats (Weekly)
**URL Pattern:** `https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_{YEAR}.parquet`

**Example:** `player_stats_2024.parquet`

**Fields (Passing):**
```typescript
{
  player_id: string;
  player_name: string;
  player_display_name: string;
  position: string;
  position_group: string;    // "QB", "RB", "WR", "TE"
  headshot_url: string;
  
  // Game Context
  season: number;
  season_type: string;       // "REG", "POST"
  week: number;
  game_id: string;
  opponent_team: string;
  
  // Passing Stats
  completions: number;
  attempts: number;
  passing_yards: number;
  passing_tds: number;
  interceptions: number;
  sacks: number;
  sack_yards: number;
  sack_fumbles: number;
  sack_fumbles_lost: number;
  passing_air_yards: number;
  passing_yards_after_catch: number;
  passing_first_downs: number;
  passing_epa: number;       // Expected Points Added
  passing_2pt_conversions: number;
  pacr: number;              // Passing Air Conversion Ratio
  dakota: number;            // Adjusted completion percentage
}
```

**Fields (Rushing):**
```typescript
{
  carries: number;
  rushing_yards: number;
  rushing_tds: number;
  rushing_fumbles: number;
  rushing_fumbles_lost: number;
  rushing_first_downs: number;
  rushing_epa: number;
  rushing_2pt_conversions: number;
}
```

**Fields (Receiving):**
```typescript
{
  receptions: number;
  targets: number;
  receiving_yards: number;
  receiving_tds: number;
  receiving_fumbles: number;
  receiving_fumbles_lost: number;
  receiving_air_yards: number;
  receiving_yards_after_catch: number;
  receiving_first_downs: number;
  receiving_epa: number;
  receiving_2pt_conversions: number;
  racr: number;              // Receiver Air Conversion Ratio
  target_share: number;
  air_yards_share: number;
  wopr: number;              // Weighted Opportunity Rating
}
```

**Fields (Fantasy):**
```typescript
{
  fantasy_points: number;            // Standard scoring
  fantasy_points_ppr: number;        // PPR scoring
}
```

**Usage:**
- Player stats by game/week
- Season aggregation (sum weekly stats)
- Career totals (load multiple years)

---

#### 4. Teams
**URL:** `https://github.com/nflverse/nflverse-data/releases/download/teams/teams.csv`

**Fields:**
```typescript
{
  team_abbr: string;         // "KC", "BUF", etc.
  team_name: string;         // "Kansas City Chiefs"
  team_id: string;
  team_nick: string;         // "Chiefs"
  team_conf: string;         // "AFC" or "NFC"
  team_division: string;     // "AFC West", "NFC North", etc.
  team_color: string;        // Hex color
  team_color2: string;
  team_color3: string;
  team_color4: string;
  team_logo_wikipedia: string;
  team_logo_espn: string;
  team_wordmark: string;
  team_conference_logo: string;
  team_league_logo: string;
}
```

**Usage:**
- Team information
- Team colors and logos
- Division/conference structure

---

#### 5. Schedule
**URL Pattern:** `https://github.com/nflverse/nflverse-data/releases/download/schedules/schedules_{YEAR}.csv`

**Example:** `schedules_2024.csv`

**Fields:**
```typescript
{
  game_id: string;           // "2024_01_KC_BAL"
  season: number;
  game_type: string;         // "REG", "WC", "DIV", "CON", "SB"
  week: number;
  gameday: string;           // "2024-09-05"
  weekday: string;           // "Thursday"
  gametime: string;          // "20:20"
  away_team: string;
  away_score: number;
  home_team: string;
  home_score: number;
  location: string;          // "Home" or neutral site
  result: number;            // Home team margin
  total: number;             // Total points
  overtime: number;          // 0 or 1
  old_game_id: string;
  gsis: string;
  nfl_detail_id: string;
  pfr: string;
  pff: string;
  espn: string;
  ftn: string;
  away_rest: number;
  home_rest: number;
  away_moneyline: number;
  home_moneyline: number;
  spread_line: number;
  away_spread_odds: number;
  home_spread_odds: number;
  total_line: number;
  under_odds: number;
  over_odds: number;
  div_game: number;          // Division game flag
  roof: string;              // "outdoors", "dome", "closed", "open"
  surface: string;           // "grass", "fieldturf", etc.
  temp: number;
  wind: number;
  stadium: string;
  stadium_id: string;
}
```

**Usage:**
- Game schedules
- Score lookups
- Betting lines and weather data

---

#### 6. Play-by-Play
**URL Pattern:** `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{YEAR}.parquet`

**Warning:** Very large files (200+ MB)

**Key Fields:**
```typescript
{
  play_id: number;
  game_id: string;
  home_team: string;
  away_team: string;
  season_type: string;
  week: number;
  posteam: string;           // Possession team
  defteam: string;           // Defense team
  side_of_field: string;
  yardline_100: number;      // Yards to endzone
  game_date: string;
  quarter_seconds_remaining: number;
  half_seconds_remaining: number;
  game_seconds_remaining: number;
  game_half: string;
  quarter_end: number;
  drive: number;
  sp: number;                // Scoring play
  qtr: number;
  down: number;
  goal_to_go: number;
  time: string;
  yrdln: string;
  ydstogo: number;
  ydsnet: number;
  desc: string;              // Play description
  play_type: string;         // "pass", "run", "punt", "field_goal", etc.
  yards_gained: number;
  shotgun: number;
  no_huddle: number;
  qb_dropback: number;
  qb_kneel: number;
  qb_spike: number;
  qb_scramble: number;
  
  // Passing
  pass_length: string;       // "short", "deep"
  pass_location: string;     // "left", "middle", "right"
  air_yards: number;
  yards_after_catch: number;
  run_location: string;
  run_gap: string;
  
  // Players
  passer_player_id: string;
  passer_player_name: string;
  receiver_player_id: string;
  receiver_player_name: string;
  rusher_player_id: string;
  rusher_player_name: string;
  
  // EPA (Expected Points Added)
  epa: number;
  ep: number;
  total_home_epa: number;
  total_away_epa: number;
  
  // WP (Win Probability)
  wp: number;
  def_wp: number;
  home_wp: number;
  away_wp: number;
  wpa: number;
  
  // Scores
  total_home_score: number;
  total_away_score: number;
  posteam_score: number;
  defteam_score: number;
}
```

**Usage:**
- Detailed game analysis
- Play-by-play reconstruction
- Advanced metrics (EPA, WP)
- Real-time game data (requires latest pull)

---

## Data Loading Strategies

### 1. CSV Files (Small datasets)
```typescript
// Best for: players, teams, schedules
async loadCSV(url: string): Promise<any[]> {
  const response = await fetch(url);
  const text = await response.text();
  return parseCSV(text);
}
```

**Pros:**
- Easy to parse
- No special libraries needed
- Good for small files (<10MB)

**Cons:**
- Slower for large files
- Higher bandwidth

---

### 2. Parquet Files (Large datasets)
```typescript
// Best for: player_stats, rosters, pbp
import { readParquet } from 'parquetjs-lite';
// OR
import { tableFromIPC } from 'apache-arrow';

async loadParquet(url: string): Promise<any[]> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // Parse with chosen library
  const table = await readParquet(buffer);
  return table.toArray();
}
```

**Pros:**
- Much smaller file size (10x compression)
- Faster parsing
- Columnar format (efficient filtering)

**Cons:**
- Requires library dependency
- More complex parsing

---

### 3. Caching Strategy
```typescript
class NFLDataCache {
  private cache = new Map<string, any>();
  private expiry = new Map<string, number>();
  
  async get(key: string, loader: () => Promise<any>, ttl = 3600000): Promise<any> {
    if (this.cache.has(key) && this.expiry.get(key)! > Date.now()) {
      return this.cache.get(key);
    }
    
    const data = await loader();
    this.cache.set(key, data);
    this.expiry.set(key, Date.now() + ttl);
    return data;
  }
}
```

**Recommended TTLs:**
- Players: 24 hours (rarely changes)
- Teams: 24 hours (rarely changes)
- Rosters: 1 week (changes during season)
- Schedules: 1 day (scores update daily)
- Player Stats: 1 hour (updates after games)
- Play-by-Play: 15 minutes (real-time during games)

---

## Implementation Examples

### Player Search
```typescript
async searchPlayers(name: string): Promise<NFLPlayer[]> {
  const playersUrl = `${this.baseUrl}players/players.csv`;
  const players = await this.cache.get(playersUrl, () => this.loadCSV(playersUrl));
  
  const searchTerms = name.toLowerCase().split(' ');
  return players.filter(player => 
    searchTerms.every(term => 
      player.full_name?.toLowerCase().includes(term) ||
      player.short_name?.toLowerCase().includes(term)
    )
  );
}
```

### Player Stats (Season Total)
```typescript
async getPlayerSeasonStats(playerId: string, season: number): Promise<NFLSeasonStats> {
  const statsUrl = `${this.baseUrl}player_stats/player_stats_${season}.parquet`;
  const weeklyStats = await this.cache.get(
    statsUrl, 
    () => this.loadParquet(statsUrl),
    3600000 // 1 hour cache
  );
  
  // Filter to player
  const playerWeeks = weeklyStats.filter(stat => 
    stat.player_id === playerId && 
    stat.season_type === 'REG'
  );
  
  // Aggregate
  return this.aggregateWeeklyStats(playerWeeks);
}

private aggregateWeeklyStats(weeks: any[]): NFLSeasonStats {
  const totals: any = {
    player_id: weeks[0]?.player_id,
    player_name: weeks[0]?.player_name,
    position: weeks[0]?.position,
    games: weeks.length
  };
  
  // Sum all numeric stats
  const numericFields = [
    'completions', 'attempts', 'passing_yards', 'passing_tds', 'interceptions',
    'carries', 'rushing_yards', 'rushing_tds',
    'receptions', 'targets', 'receiving_yards', 'receiving_tds',
    'fantasy_points', 'fantasy_points_ppr'
  ];
  
  weeks.forEach(week => {
    numericFields.forEach(field => {
      if (typeof week[field] === 'number') {
        totals[field] = (totals[field] || 0) + week[field];
      }
    });
  });
  
  // Calculate averages
  totals.completion_pct = (totals.completions / totals.attempts) * 100;
  totals.yards_per_carry = totals.rushing_yards / totals.carries;
  totals.yards_per_reception = totals.receiving_yards / totals.receptions;
  
  return totals;
}
```

### Get Game Schedule
```typescript
async getSchedule(season: number, week?: number, team?: string): Promise<NFLGame[]> {
  const scheduleUrl = `${this.baseUrl}schedules/schedules_${season}.csv`;
  let schedule = await this.cache.get(scheduleUrl, () => this.loadCSV(scheduleUrl));
  
  // Filter by week
  if (week) {
    schedule = schedule.filter(game => game.week === week);
  }
  
  // Filter by team
  if (team) {
    schedule = schedule.filter(game => 
      game.home_team === team || game.away_team === team
    );
  }
  
  return schedule;
}
```

---

## Comparison Metrics

### Quarterback Stats
```typescript
const qbMetrics = [
  { key: 'passing_yards', name: 'Passing Yards', higherIsBetter: true },
  { key: 'passing_tds', name: 'Passing TDs', higherIsBetter: true },
  { key: 'interceptions', name: 'Interceptions', higherIsBetter: false },
  { key: 'completion_pct', name: 'Completion %', higherIsBetter: true },
  { key: 'passing_epa', name: 'EPA', higherIsBetter: true }
];
```

### Running Back Stats
```typescript
const rbMetrics = [
  { key: 'rushing_yards', name: 'Rushing Yards', higherIsBetter: true },
  { key: 'rushing_tds', name: 'Rushing TDs', higherIsBetter: true },
  { key: 'yards_per_carry', name: 'Yards/Carry', higherIsBetter: true },
  { key: 'receptions', name: 'Receptions', higherIsBetter: true },
  { key: 'fantasy_points_ppr', name: 'Fantasy Points', higherIsBetter: true }
];
```

### Wide Receiver Stats
```typescript
const wrMetrics = [
  { key: 'receptions', name: 'Receptions', higherIsBetter: true },
  { key: 'receiving_yards', name: 'Receiving Yards', higherIsBetter: true },
  { key: 'receiving_tds', name: 'Receiving TDs', higherIsBetter: true },
  { key: 'yards_per_reception', name: 'Yards/Reception', higherIsBetter: true },
  { key: 'target_share', name: 'Target Share', higherIsBetter: true }
];
```

---

## Update Schedule

nflverse-data updates via GitHub Actions:

- **During Season:**
  - Player stats: Updated after each game day (usually next morning)
  - Play-by-play: Updated after games complete
  - Rosters: Updated weekly
  
- **Off-Season:**
  - Players: Updated as changes occur
  - Draft picks: Updated after draft
  - Combine: Updated after combine

**Check for updates:**
```bash
# View latest release
https://github.com/nflverse/nflverse-data/releases/latest

# Check file timestamps
curl -I https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_2024.parquet
```

---

## Performance Tips

1. **Cache Aggressively:** Files are large, download once
2. **Use Parquet:** 10x smaller than CSV for large datasets
3. **Filter Early:** Don't load all data if you only need subset
4. **Lazy Load:** Only load data when needed
5. **Background Updates:** Refresh cache in background
6. **Compression:** Use gzip for transport if fetching CSV

---

## Data Quality Notes

- Historical data available back to 1999
- Play-by-play data most complete from 2009+
- Some advanced metrics (EPA, WP) only available 2009+
- Player IDs (gsis_id) are stable and reliable
- Team abbreviations standardized (see teams.csv)
- Missing data handled as NULL/NA in source

---

## Resources

- **GitHub Repository:** https://github.com/nflverse/nflverse-data
- **Documentation:** https://nflreadr.nflverse.com/
- **Data Dictionary:** https://nflreadr.nflverse.com/articles/dictionary.html
- **R Package (reference):** https://github.com/nflverse/nflreadr
- **Discord Community:** https://discord.gg/5Er2FBnnQa
