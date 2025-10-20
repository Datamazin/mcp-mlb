/**
 * Multi-Sport Types
 * 
 * Type definitions for cross-sport data structures
 */

export interface SportDataSource {
  sport: 'MLB' | 'NBA' | 'NFL';
  name: string;
  baseUrl: string;
  reliability: number;
  rateLimitMs: number;
  priority: number;
  dataTypes: string[];
}

export interface UniversalPlayer {
  sport: 'MLB' | 'NBA' | 'NFL';
  name: string;
  team: string;
  position: string;
  stats: PlayerStats;
  profile: PlayerProfile;
  injuryStatus: InjuryStatus;
  sources: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface PlayerStats {
  [key: string]: any;
  season?: SeasonStats;
  career?: CareerStats;
  advanced?: AdvancedStats;
}

export interface SeasonStats {
  [key: string]: number | string;
}

export interface CareerStats {
  [key: string]: number | string;
}

export interface AdvancedStats {
  [key: string]: number | string;
}

export interface PlayerProfile {
  name: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  birthPlace?: string;
  draftYear?: number;
  draftRound?: number;
  draftPick?: number;
  experience?: number;
  awards?: Award[];
  achievements?: string[];
}

export interface Award {
  name: string;
  year: number;
  details?: string;
}

export interface InjuryStatus {
  status: 'Healthy' | 'Questionable' | 'Doubtful' | 'Out' | 'IR' | 'Day-to-Day' | 'Unknown';
  injury?: string;
  timeline?: string;
  lastUpdated?: Date;
}

export interface LiveGame {
  sport: 'MLB' | 'NBA' | 'NFL';
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  inning?: number;
  quarter?: number;
  timeRemaining?: string;
  lastUpdated: Date;
}

export interface InjuryReport {
  sport: 'MLB' | 'NBA' | 'NFL';
  player: string;
  team: string;
  position: string;
  injury: string;
  status: string;
  timeline?: string;
  impact: 'Minor' | 'Moderate' | 'Severe';
  lastUpdated: Date;
}

export interface CrossSportComparisonResult {
  players: string[];
  sports: string[];
  dominanceScores: { [playerName: string]: DominanceScore };
  relativePeerRanking: { [playerName: string]: PeerRanking };
  winner: string;
  analysis: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface DominanceScore {
  overall: number;
  offensive?: number;
  defensive?: number;
  clutch?: number;
  durability?: number;
  tier: 'Elite' | 'All-Star' | 'Above Average' | 'Average' | 'Below Average';
  context: string;
}

export interface PeerRanking {
  percentile: number;
  rank: number;
  totalPlayers: number;
  context: string;
}

// MLB-specific types
export interface MLBPlayerStats extends PlayerStats {
  batting?: {
    avg?: number;
    obp?: number;
    slg?: number;
    ops?: number;
    hr?: number;
    rbi?: number;
    sb?: number;
    war?: number;
  };
  pitching?: {
    era?: number;
    whip?: number;
    k9?: number;
    bb9?: number;
    fip?: number;
    war?: number;
  };
  fielding?: {
    errors?: number;
    drs?: number;
    uzr?: number;
    fpct?: number;
  };
}

// NBA-specific types
export interface NBAPlayerStats extends PlayerStats {
  traditional?: {
    ppg?: number;
    rpg?: number;
    apg?: number;
    fg_pct?: number;
    three_p_pct?: number;
    ft_pct?: number;
  };
  advanced?: {
    per?: number;
    bpm?: number;
    vorp?: number;
    ts_pct?: number;
    usg_pct?: number;
    win_shares?: number;
  };
}

// NFL-specific types
export interface NFLPlayerStats extends PlayerStats {
  passing?: {
    completions?: number;
    attempts?: number;
    yards?: number;
    touchdowns?: number;
    interceptions?: number;
    rating?: number;
  };
  rushing?: {
    attempts?: number;
    yards?: number;
    touchdowns?: number;
    ypc?: number;
  };
  receiving?: {
    receptions?: number;
    yards?: number;
    touchdowns?: number;
    ypr?: number;
  };
  defense?: {
    tackles?: number;
    sacks?: number;
    interceptions?: number;
    pbu?: number;
  };
}

export interface SearchResult {
  sport: 'MLB' | 'NBA' | 'NFL';
  players: PlayerSearchResult[];
  confidence: number;
  source: string;
}

export interface PlayerSearchResult {
  name: string;
  team: string;
  position: string;
  id: string;
  confidence: number;
}

export interface WebScrapingConfig {
  userAgent: string;
  rateLimitMs: number;
  maxRetries: number;
  timeout: number;
  respectRobotsTxt: boolean;
}

export interface DataConsolidationResult {
  consolidated: any;
  sources: string[];
  confidence: number;
  conflicts: DataConflict[];
  lastUpdated: Date;
}

export interface DataConflict {
  field: string;
  values: { source: string; value: any }[];
  resolved: boolean;
  resolution?: any;
}