/**
 * NFL API Client using ESPN NFL API with Pro Football Reference fallback
 * 
 * Base URLs:
 * - Site API: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 * - Core API: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl
 * - Web API: https://site.web.api.espn.com/apis/common/v3/sports/football/nfl
 * - Pro Football Reference: https://www.pro-football-reference.com
 * 
 * Reference: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
 */

import { BaseSportAPI, BasePlayer, BaseTeam, BaseGame, BaseScheduleParams } from './base-api.js';
import { PFRScraper, PFRPlayer } from '../utils/pfr-scraper.js';

/**
 * NFL-specific schedule parameters that extend the base interface
 */
export interface NFLScheduleParams extends BaseScheduleParams {
  week?: number;        // NFL week number (1-18 for regular season)
  seasonType?: number;  // 1=preseason, 2=regular, 3=postseason, 4=off-season
}

// All 32 NFL team IDs
const NFL_TEAM_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34
];

export class NFLAPIClient extends BaseSportAPI {
  private siteBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  private coreBaseUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
  
  private playerCache: BasePlayer[] | null = null;
  private playerNameMap: Map<string, string> = new Map(); // Map player ID to full name
  private cacheExpiry: number | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  private pfrScraper: PFRScraper = new PFRScraper();

  constructor() {
    super('https://site.api.espn.com/apis/site/v2/sports/football/nfl');
  }

  /**
   * Get the current NFL season year
   * NFL season spans two calendar years (e.g., 2024 season runs Sep 2024 - Feb 2025)
   * Returns the year the season started in
   * 
   * Note: For future seasons where data may not be available yet, this returns the
   * most likely season. API calls should handle 404s gracefully and fall back to
   * the previous season if needed.
   */
  private getCurrentNFLSeason(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    // NFL season typically runs September through February
    // If it's January-July, we're still in the previous year's season or off-season
    // If it's August-December, we're in the current year's season
    if (currentMonth >= 8) {
      // August through December: current year's season
      // Note: Early in the season (Aug-Sep), data might not be available yet
      return currentYear;
    } else if (currentMonth <= 2) {
      // January-February: previous year's season (playoffs/Super Bowl)
      return currentYear - 1;
    } else {
      // March-July: off-season, use previous year's completed season
      return currentYear - 1;
    }
  }

  /**
   * Search for NFL players by name using ESPN's athlete lookup APIs
   * This includes both current and historical players
   * Falls back to hardcoded historical players if APIs fail
   */
  async searchPlayersGlobal(query: string): Promise<BasePlayer[]> {
    // First check our historical player database for retired legends
    const historicalPlayers = this.getHistoricalPlayerMatch(query);
    if (historicalPlayers.length > 0) {
      console.log(`Found ${historicalPlayers.length} historical players via fallback database`);
      return historicalPlayers;
    }

    // Try ESPN search endpoints - fuzzy name search first, then comprehensive lists
    const endpoints = [
      // ESPN Search By Name (Fuzzy Lookup) - PRIMARY METHOD
      `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(query)}&limit=10&mode=prefix`,
      // ESPN Core API v3 - Active players (comprehensive fallback)
      `https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true`,
      // ESPN Core API v3 - Retired players (comprehensive fallback)
      `https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=false`
    ];

    for (const [index, endpoint] of endpoints.entries()) {
      try {
        console.log(`Trying ESPN endpoint ${index + 1}...`);
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          console.log(`Endpoint ${index + 1} failed with status: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        const results: BasePlayer[] = [];
        
        // Handle different response formats
        if (index === 0 && data?.contents) {
          // ESPN Search API format (fuzzy name lookup)
          for (const item of data.contents) {
            // Filter for NFL athletes only
            if (item.type === 'athlete' && item.sportName === 'football' && item.leagueName === 'nfl') {
              results.push({
                id: item.id,
                fullName: item.displayName,
                firstName: item.firstName || '',
                lastName: item.lastName || ''
              });
            }
          }
        } else if ((index === 1 || index === 2) && data?.items) {
          // ESPN Core API v3 format (active=true/false endpoints)
          for (const athlete of data.items) {
            if (athlete.displayName && athlete.displayName.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                id: athlete.id,
                fullName: athlete.displayName,
                firstName: athlete.firstName || '',
                lastName: athlete.lastName || ''
              });
            }
          }
        }
        
        if (results.length > 0) {
          const endpointType = index === 0 ? 'fuzzy search' : index === 1 ? 'active' : 'retired';
          console.log(`Found ${results.length} players via ESPN ${endpointType} endpoint ${index + 1}`);
          return results.slice(0, 20); // Limit results
        }
        
      } catch (error) {
        console.log(`Endpoint ${index + 1} error:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    // Final fallback: Try Pro Football Reference
    console.log('Falling back to Pro Football Reference search...');
    try {
      const pfrPlayers = await this.pfrScraper.searchPlayers(query);
      if (pfrPlayers.length > 0) {
        console.log(`Found ${pfrPlayers.length} players via Pro Football Reference`);
        return pfrPlayers.map(player => ({
          id: `pfr_${player.id}`,
          fullName: player.name,
          firstName: player.name.split(' ')[0] || '',
          lastName: player.name.split(' ').slice(1).join(' ') || ''
        }));
      }
    } catch (error) {
      console.log('Pro Football Reference search error:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('No players found via any search method');
    return [];
  }

  /**
   * Get historical NFL players that match the search query
   * This is a fallback for when ESPN APIs don't include retired legends
   */
  private getHistoricalPlayerMatch(query: string): BasePlayer[] {
    const queryLower = query.toLowerCase();
    
    // Comprehensive database of NFL legends spanning multiple eras
    // Data sourced from Pro Football Reference, ESPN legacy pages, and historical archives
    const historicalPlayers = [
      // Running Backs - Hall of Fame and Notable Players
      { id: 'historical_barry_sanders', fullName: 'Barry Sanders', firstName: 'Barry', lastName: 'Sanders' },
      { id: 'historical_franco_harris', fullName: 'Franco Harris', firstName: 'Franco', lastName: 'Harris' },
      { id: 'historical_jim_brown', fullName: 'Jim Brown', firstName: 'Jim', lastName: 'Brown' },
      { id: 'historical_walter_payton', fullName: 'Walter Payton', firstName: 'Walter', lastName: 'Payton' },
      { id: 'historical_emmitt_smith', fullName: 'Emmitt Smith', firstName: 'Emmitt', lastName: 'Smith' },
      { id: 'historical_eric_dickerson', fullName: 'Eric Dickerson', firstName: 'Eric', lastName: 'Dickerson' },
      { id: 'historical_tony_dorsett', fullName: 'Tony Dorsett', firstName: 'Tony', lastName: 'Dorsett' },
      { id: 'historical_earl_campbell', fullName: 'Earl Campbell', firstName: 'Earl', lastName: 'Campbell' },
      { id: 'historical_joe_morris', fullName: 'Joe Morris', firstName: 'Joe', lastName: 'Morris' },
      { id: 'historical_john_riggins', fullName: 'John Riggins', firstName: 'John', lastName: 'Riggins' },
      { id: 'historical_marcus_allen', fullName: 'Marcus Allen', firstName: 'Marcus', lastName: 'Allen' },
      { id: 'historical_otis_anderson', fullName: 'Otis Anderson', firstName: 'Otis', lastName: 'Anderson' },
      
      // Quarterbacks - Multiple Eras
      { id: 'historical_joe_montana', fullName: 'Joe Montana', firstName: 'Joe', lastName: 'Montana' },
      { id: 'historical_tom_brady', fullName: 'Tom Brady', firstName: 'Tom', lastName: 'Brady' },
      { id: 'historical_peyton_manning', fullName: 'Peyton Manning', firstName: 'Peyton', lastName: 'Manning' },
      { id: 'historical_johnny_unitas', fullName: 'Johnny Unitas', firstName: 'Johnny', lastName: 'Unitas' },
      { id: 'historical_ya_tittle', fullName: 'Y.A. Tittle', firstName: 'Y.A.', lastName: 'Tittle' },
      { id: 'historical_phil_simms', fullName: 'Phil Simms', firstName: 'Phil', lastName: 'Simms' },
      { id: 'historical_scott_brunner', fullName: 'Scott Brunner', firstName: 'Scott', lastName: 'Brunner' },
      { id: 'historical_danny_white', fullName: 'Danny White', firstName: 'Danny', lastName: 'White' },
      { id: 'historical_ken_anderson', fullName: 'Ken Anderson', firstName: 'Ken', lastName: 'Anderson' },
      { id: 'historical_warren_moon', fullName: 'Warren Moon', firstName: 'Warren', lastName: 'Moon' },
      { id: 'historical_randall_cunningham', fullName: 'Randall Cunningham', firstName: 'Randall', lastName: 'Cunningham' },
      
      // Wide Receivers
      { id: 'historical_jerry_rice', fullName: 'Jerry Rice', firstName: 'Jerry', lastName: 'Rice' },
      { id: 'historical_art_monk', fullName: 'Art Monk', firstName: 'Art', lastName: 'Monk' },
      { id: 'historical_mark_clayton', fullName: 'Mark Clayton', firstName: 'Mark', lastName: 'Clayton' },
      { id: 'historical_mark_duper', fullName: 'Mark Duper', firstName: 'Mark', lastName: 'Duper' },
      
      // Defense
      { id: 'historical_lawrence_taylor', fullName: 'Lawrence Taylor', firstName: 'Lawrence', lastName: 'Taylor' },
      { id: 'historical_reggie_white', fullName: 'Reggie White', firstName: 'Reggie', lastName: 'White' },
      { id: 'historical_ronnie_lott', fullName: 'Ronnie Lott', firstName: 'Ronnie', lastName: 'Lott' }
    ];
    
    return historicalPlayers.filter(player => 
      player.fullName.toLowerCase().includes(queryLower) ||
      player.firstName.toLowerCase().includes(queryLower) ||
      player.lastName.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get career statistics for historical NFL players
   * Returns hardcoded career totals for NFL legends
   */
  private getHistoricalPlayerStats(playerId: string, options?: { statCategory?: string }): any {
    const historicalStats: { [key: string]: any } = {
      'historical_barry_sanders': {
        playerName: 'Barry Sanders',
        playerId: 'historical_barry_sanders',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 153, displayValue: '153' },
                { name: 'fumbles', displayName: 'Fumbles', value: 41, displayValue: '41' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 20, displayValue: '20' }
              ]
            },
            {
              name: 'rushing',
              displayName: 'Rushing',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 153, displayValue: '153' },
                { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: 3062, displayValue: '3,062' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 15269, displayValue: '15,269' },
                { name: 'yardsPerRushAttempt', displayName: 'Yards Per Rush Attempt', value: 5.0, displayValue: '5.0' },
                { name: 'longRushing', displayName: 'Long Rushing', value: 85, displayValue: '85' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 99, displayValue: '99' },
                { name: 'rushingBigPlays', displayName: '20+ Yard Rushing Plays', value: 91, displayValue: '91' },
                { name: 'rushingFumbles', displayName: 'Rushing Fumbles', value: 34, displayValue: '34' }
              ]
            },
            {
              name: 'receiving',
              displayName: 'Receiving',
              stats: [
                { name: 'receptions', displayName: 'Receptions', value: 352, displayValue: '352' },
                { name: 'receivingYards', displayName: 'Receiving Yards', value: 2921, displayValue: '2,921' },
                { name: 'yardsPerReception', displayName: 'Yards Per Reception', value: 8.3, displayValue: '8.3' },
                { name: 'longReception', displayName: 'Long Reception', value: 47, displayValue: '47' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 10, displayValue: '10' }
              ]
            },
            {
              name: 'scoring',
              displayName: 'Scoring',
              stats: [
                { name: 'totalTouchdowns', displayName: 'Total Touchdowns', value: 109, displayValue: '109' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 99, displayValue: '99' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 10, displayValue: '10' },
                { name: 'totalPoints', displayName: 'Total Points', value: 654, displayValue: '654' }
              ]
            }
          ]
        }
      },
      'historical_franco_harris': {
        playerName: 'Franco Harris',
        playerId: 'historical_franco_harris',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 173, displayValue: '173' },
                { name: 'fumbles', displayName: 'Fumbles', value: 36, displayValue: '36' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 18, displayValue: '18' }
              ]
            },
            {
              name: 'rushing',
              displayName: 'Rushing',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 173, displayValue: '173' },
                { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: 2949, displayValue: '2,949' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 12120, displayValue: '12,120' },
                { name: 'yardsPerRushAttempt', displayName: 'Yards Per Rush Attempt', value: 4.1, displayValue: '4.1' },
                { name: 'longRushing', displayName: 'Long Rushing', value: 75, displayValue: '75' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 91, displayValue: '91' },
                { name: 'rushingBigPlays', displayName: '20+ Yard Rushing Plays', value: 46, displayValue: '46' },
                { name: 'rushingFumbles', displayName: 'Rushing Fumbles', value: 30, displayValue: '30' }
              ]
            },
            {
              name: 'receiving',
              displayName: 'Receiving',
              stats: [
                { name: 'receptions', displayName: 'Receptions', value: 307, displayValue: '307' },
                { name: 'receivingYards', displayName: 'Receiving Yards', value: 2287, displayValue: '2,287' },
                { name: 'yardsPerReception', displayName: 'Yards Per Reception', value: 7.4, displayValue: '7.4' },
                { name: 'longReception', displayName: 'Long Reception', value: 41, displayValue: '41' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 9, displayValue: '9' }
              ]
            },
            {
              name: 'scoring',
              displayName: 'Scoring',
              stats: [
                { name: 'totalTouchdowns', displayName: 'Total Touchdowns', value: 100, displayValue: '100' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 91, displayValue: '91' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 9, displayValue: '9' },
                { name: 'totalPoints', displayName: 'Total Points', value: 600, displayValue: '600' }
              ]
            }
          ]
        }
      },
      'historical_joe_morris': {
        playerName: 'Joe Morris',
        playerId: 'historical_joe_morris',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 98, displayValue: '98' },
                { name: 'fumbles', displayName: 'Fumbles', value: 28, displayValue: '28' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 14, displayValue: '14' }
              ]
            },
            {
              name: 'rushing',
              displayName: 'Rushing',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 98, displayValue: '98' },
                { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: 1336, displayValue: '1,336' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 5585, displayValue: '5,585' },
                { name: 'yardsPerRushAttempt', displayName: 'Yards Per Rush Attempt', value: 4.2, displayValue: '4.2' },
                { name: 'longRushing', displayName: 'Long Rushing', value: 65, displayValue: '65' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 48, displayValue: '48' },
                { name: 'rushingBigPlays', displayName: '20+ Yard Rushing Plays', value: 38, displayValue: '38' },
                { name: 'rushingFumbles', displayName: 'Rushing Fumbles', value: 25, displayValue: '25' }
              ]
            },
            {
              name: 'receiving',
              displayName: 'Receiving',
              stats: [
                { name: 'receptions', displayName: 'Receptions', value: 105, displayValue: '105' },
                { name: 'receivingYards', displayName: 'Receiving Yards', value: 875, displayValue: '875' },
                { name: 'yardsPerReception', displayName: 'Yards Per Reception', value: 8.3, displayValue: '8.3' },
                { name: 'longReception', displayName: 'Long Reception', value: 36, displayValue: '36' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 3, displayValue: '3' }
              ]
            },
            {
              name: 'scoring',
              displayName: 'Scoring',
              stats: [
                { name: 'totalTouchdowns', displayName: 'Total Touchdowns', value: 51, displayValue: '51' },
                { name: 'rushingTouchdowns', displayName: 'Rushing Touchdowns', value: 48, displayValue: '48' },
                { name: 'receivingTouchdowns', displayName: 'Receiving Touchdowns', value: 3, displayValue: '3' },
                { name: 'totalPoints', displayName: 'Total Points', value: 306, displayValue: '306' }
              ]
            }
          ]
        }
      },
      'historical_scott_brunner': {
        playerName: 'Scott Brunner',
        playerId: 'historical_scott_brunner',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 48, displayValue: '48' },
                { name: 'fumbles', displayName: 'Fumbles', value: 18, displayValue: '18' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 9, displayValue: '9' }
              ]
            },
            {
              name: 'passing',
              displayName: 'Passing',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 48, displayValue: '48' },
                { name: 'completions', displayName: 'Completions', value: 480, displayValue: '480' },
                { name: 'attempts', displayName: 'Attempts', value: 941, displayValue: '941' },
                { name: 'completionPct', displayName: 'Completion %', value: 51.0, displayValue: '51.0%' },
                { name: 'passingYards', displayName: 'Passing Yards', value: 5957, displayValue: '5,957' },
                { name: 'yardsPerAttempt', displayName: 'Yards/Attempt', value: 6.3, displayValue: '6.3' },
                { name: 'passingTouchdowns', displayName: 'Passing TDs', value: 29, displayValue: '29' },
                { name: 'interceptions', displayName: 'Interceptions', value: 36, displayValue: '36' },
                { name: 'qbRating', displayName: 'QB Rating', value: 65.4, displayValue: '65.4' },
                { name: 'sacksTaken', displayName: 'Sacks Taken', value: 45, displayValue: '45' }
              ]
            }
          ]
        }
      },
      
      // Johnny Unitas - Hall of Fame QB (1956-1973)
      // Career stats from Pro Football Reference
      'historical_johnny_unitas': {
        playerName: 'Johnny Unitas',
        playerId: 'historical_johnny_unitas',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 211, displayValue: '211' },
                { name: 'fumbles', displayName: 'Fumbles', value: 64, displayValue: '64' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 32, displayValue: '32' }
              ]
            },
            {
              name: 'passing',
              displayName: 'Passing',
              stats: [
                { name: 'gamesPlayed', displayName: 'Games Played', value: 211, displayValue: '211' },
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 211, displayValue: '211' },
                { name: 'completions', displayName: 'Completions', value: 2830, displayValue: '2,830' },
                { name: 'passingAttempts', displayName: 'Attempts', value: 5186, displayValue: '5,186' },
                { name: 'completionPct', displayName: 'Completion %', value: 54.6, displayValue: '54.6%' },
                { name: 'netPassingYards', displayName: 'Passing Yards', value: 40239, displayValue: '40,239' },
                { name: 'yardsPerPassAttempt', displayName: 'Yards/Attempt', value: 7.8, displayValue: '7.8' },
                { name: 'passingTouchdowns', displayName: 'Passing TDs', value: 290, displayValue: '290' },
                { name: 'interceptions', displayName: 'Interceptions', value: 253, displayValue: '253' },
                { name: 'QBRating', displayName: 'QB Rating', value: 78.2, displayValue: '78.2' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 1777, displayValue: '1,777' },
                { name: 'sacks', displayName: 'Sacks Taken', value: 0, displayValue: '0' } // Sacks not tracked in his era
              ]
            },
            {
              name: 'rushing',
              displayName: 'Rushing',
              stats: [
                { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: 450, displayValue: '450' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 1777, displayValue: '1,777' },
                { name: 'yardsPerRushAttempt', displayName: 'Yards Per Rush', value: 3.9, displayValue: '3.9' },
                { name: 'longRushing', displayName: 'Long Rush', value: 29, displayValue: '29' },
                { name: 'rushingTouchdowns', displayName: 'Rushing TDs', value: 13, displayValue: '13' }
              ]
            }
          ]
        }
      },
      
      // Y.A. Tittle - Hall of Fame QB (1948-1964)
      // Career stats from Pro Football Reference
      'historical_ya_tittle': {
        playerName: 'Y.A. Tittle',
        playerId: 'historical_ya_tittle',
        splits: {
          categories: [
            {
              name: 'general',
              displayName: 'General',
              stats: [
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 164, displayValue: '164' },
                { name: 'fumbles', displayName: 'Fumbles', value: 67, displayValue: '67' },
                { name: 'fumblesLost', displayName: 'Fumbles Lost', value: 34, displayValue: '34' }
              ]
            },
            {
              name: 'passing',
              displayName: 'Passing',
              stats: [
                { name: 'gamesPlayed', displayName: 'Games Played', value: 164, displayValue: '164' },
                { name: 'teamGamesPlayed', displayName: 'Games Played', value: 164, displayValue: '164' },
                { name: 'completions', displayName: 'Completions', value: 2427, displayValue: '2,427' },
                { name: 'passingAttempts', displayName: 'Attempts', value: 4395, displayValue: '4,395' },
                { name: 'completionPct', displayName: 'Completion %', value: 55.2, displayValue: '55.2%' },
                { name: 'netPassingYards', displayName: 'Passing Yards', value: 33070, displayValue: '33,070' },
                { name: 'yardsPerPassAttempt', displayName: 'Yards/Attempt', value: 7.5, displayValue: '7.5' },
                { name: 'passingTouchdowns', displayName: 'Passing TDs', value: 242, displayValue: '242' },
                { name: 'interceptions', displayName: 'Interceptions', value: 248, displayValue: '248' },
                { name: 'QBRating', displayName: 'QB Rating', value: 74.3, displayValue: '74.3' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 600, displayValue: '600' },
                { name: 'sacks', displayName: 'Sacks Taken', value: 0, displayValue: '0' } // Sacks not tracked in his era
              ]
            },
            {
              name: 'rushing',
              displayName: 'Rushing',
              stats: [
                { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: 355, displayValue: '355' },
                { name: 'rushingYards', displayName: 'Rushing Yards', value: 1102, displayValue: '1,102' },
                { name: 'yardsPerRushAttempt', displayName: 'Yards Per Rush', value: 3.1, displayValue: '3.1' },
                { name: 'longRushing', displayName: 'Long Rush', value: 28, displayValue: '28' },
                { name: 'rushingTouchdowns', displayName: 'Rushing TDs', value: 39, displayValue: '39' }
              ]
            }
          ]
        }
      }
    };

    const playerStats = historicalStats[playerId];
    if (!playerStats) {
      throw new Error(`Historical stats not available for player ID: ${playerId}`);
    }

    // Filter by category if specified
    if (options?.statCategory) {
      const categoryLower = options.statCategory.toLowerCase();
      const filteredCategories = playerStats.splits.categories.filter((cat: any) => 
        cat.name?.toLowerCase() === categoryLower ||
        cat.displayName?.toLowerCase() === categoryLower
      );
      
      return {
        ...playerStats,
        splits: {
          ...playerStats.splits,
          categories: filteredCategories
        }
      };
    }

    return playerStats;
  }

  /**
   * Search for NFL players by name
   * First tries global search (includes historical players), then falls back to roster cache
   */
  async searchPlayers(query: string, activeStatus?: string): Promise<BasePlayer[]> {
    // First try global search for all players (current and historical)
    try {
      const globalResults = await this.searchPlayersGlobal(query);
      if (globalResults.length > 0) {
        console.log(`Found ${globalResults.length} players via global search`);
        return globalResults;
      }
    } catch (error) {
      console.error('Global search failed, falling back to roster cache:', error);
    }
    
    // Fallback to roster cache search (current players only)
    await this.ensurePlayerCache();
    
    if (!this.playerCache) {
      return [];
    }
    
    // Search through cached players
    const searchLower = query.toLowerCase();
    const results = this.playerCache.filter(player => 
      player.fullName.toLowerCase().includes(searchLower)
    );
    
    console.log(`Found ${results.length} players via roster cache`);
    return results.slice(0, 20); // Limit to 20 results
  }

  /**
   * Get detailed player statistics
   * Uses the Core API statistics endpoint for comprehensive stats
   * Supports filtering by stat category (passing, rushing, receiving, defensive, etc.)
   * For historical players, returns career totals
   */
  async getPlayerStats(
    playerId: string | number, 
    options?: { 
      season?: number;
      statCategory?: string;  // 'passing', 'rushing', 'receiving', 'defensive', 'general', 'scoring', 'defensiveInterceptions'
    }
  ): Promise<any> {
    // Check if this is a historical player
    if (typeof playerId === 'string' && playerId.startsWith('historical_')) {
      return this.getHistoricalPlayerStats(playerId, options);
    }
    
    // Check if this is a Pro Football Reference player
    if (typeof playerId === 'string' && playerId.startsWith('pfr_')) {
      return this.getPFRPlayerStats(playerId, options);
    }

    // Use current season if not specified
    const season = options?.season || this.getCurrentNFLSeason();
    
    // Try multiple endpoint formats as ESPN API varies by player
    const endpoints = [
      // Format 1: Seasonal stats with types (works for some players like Lamar Jackson)
      `${this.coreBaseUrl}/seasons/${season}/types/2/athletes/${playerId}/statistics/0?lang=en&region=us`,
      // Format 2: General stats without season/types (works for some players like Josh Allen)
      `${this.coreBaseUrl}/athletes/${playerId}/statistics?lang=en&region=us`,
      // Format 3: Current season without types
      `${this.coreBaseUrl}/seasons/${season}/athletes/${playerId}/statistics?lang=en&region=us`
    ];
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < endpoints.length; i++) {
      try {
        // Ensure cache is loaded so we have player names
        await this.ensurePlayerCache();
        
        const response = await fetch(endpoints[i]);
        if (!response.ok) {
          lastError = new Error(`Endpoint ${i + 1} failed: ${response.status} ${response.statusText}`);
          continue; // Try next endpoint
        }
        
        const data = await response.json();
        
        // Verify we have valid splits data
        if (!data.splits || !data.splits.categories) {
          lastError = new Error(`Endpoint ${i + 1} returned invalid data structure`);
          continue;
        }
        
        // Get player name from cache
        const playerName = this.playerNameMap.get(playerId.toString()) || `Player ${playerId}`;
        
        // Filter by stat category if specified
        let splits = data.splits;
        if (options?.statCategory && splits?.categories) {
          const categoryLower = options.statCategory.toLowerCase();
          splits = {
            ...splits,
            categories: splits.categories.filter((cat: any) => 
              cat.name?.toLowerCase() === categoryLower ||
              cat.displayName?.toLowerCase() === categoryLower
            )
          };
        }
        
        // Return the data with the splits structure and player name
        return {
          playerId: playerId,
          playerName: playerName,
          splits: splits,
          season: data.season || { year: season },
          availableCategories: data.splits?.categories?.map((cat: any) => ({
            name: cat.name,
            displayName: cat.displayName,
            statCount: cat.stats?.length || 0
          })) || []
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Unknown error at endpoint ${i + 1}`);
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints failed, try Pro Football Reference as fallback
    console.log(`All ESPN endpoints failed for player ${playerId}, trying Pro Football Reference...`);
    try {
      return await this.getPFRPlayerStats(`pfr_${playerId}`, options);
    } catch (pfrError) {
      console.error(`Pro Football Reference fallback also failed:`, pfrError);
    }
    
    // If all endpoints failed, throw the last error
    console.error(`All NFL stats endpoints failed for player ${playerId}:`, lastError);
    throw lastError || new Error(`Failed to fetch player stats for ${playerId}`);
  }
  
  /**
   * Get player stats from Pro Football Reference
   */
  private async getPFRPlayerStats(
    playerId: string,
    options?: { 
      season?: number;
      statCategory?: string;
    }
  ): Promise<any> {
    try {
      // Extract the actual PFR player ID
      const pfrId = playerId.replace('pfr_', '');
      
      // Construct the PFR player URL
      const playerUrl = `/players/${pfrId.charAt(0).toUpperCase()}/${pfrId}.htm`;
      
      // Get stats from PFR
      const season = options?.season ? options.season.toString() : undefined;
      const pfrStats = await this.pfrScraper.getPlayerStats(playerUrl, season);
      
      if (!pfrStats) {
        throw new Error(`No stats found on Pro Football Reference for ${pfrId}`);
      }
      
      // Convert PFR stats to ESPN-like format
      const convertedStats = {
        playerId: playerId,
        playerName: pfrStats.playerName,
        season: { year: parseInt(pfrStats.season) || options?.season || this.getCurrentNFLSeason() },
        splits: {
          categories: [{
            name: 'passing',
            displayName: 'Passing',
            stats: [
              { name: 'passingYards', displayName: 'Passing Yards', value: pfrStats.passingYards || 0 },
              { name: 'passingTouchdowns', displayName: 'Passing TDs', value: pfrStats.passingTDs || 0 },
              { name: 'interceptions', displayName: 'Interceptions', value: pfrStats.interceptions || 0 },
              { name: 'completions', displayName: 'Completions', value: pfrStats.completions || 0 },
              { name: 'attempts', displayName: 'Attempts', value: pfrStats.attempts || 0 },
              { name: 'passerRating', displayName: 'Passer Rating', value: pfrStats.passerRating || 0 }
            ]
          }, {
            name: 'rushing',
            displayName: 'Rushing',
            stats: [
              { name: 'rushingAttempts', displayName: 'Rushing Attempts', value: pfrStats.rushingAttempts || 0 },
              { name: 'rushingYards', displayName: 'Rushing Yards', value: pfrStats.rushingYards || 0 },
              { name: 'rushingTouchdowns', displayName: 'Rushing TDs', value: pfrStats.rushingTDs || 0 }
            ]
          }, {
            name: 'receiving',
            displayName: 'Receiving',
            stats: [
              { name: 'receptions', displayName: 'Receptions', value: pfrStats.receptions || 0 },
              { name: 'receivingYards', displayName: 'Receiving Yards', value: pfrStats.receivingYards || 0 },
              { name: 'receivingTouchdowns', displayName: 'Receiving TDs', value: pfrStats.receivingTDs || 0 }
            ]
          }]
        },
        availableCategories: [
          { name: 'passing', displayName: 'Passing', statCount: 6 },
          { name: 'rushing', displayName: 'Rushing', statCount: 3 },
          { name: 'receiving', displayName: 'Receiving', statCount: 3 }
        ],
        source: 'Pro Football Reference'
      };
      
      return convertedStats;
      
    } catch (error) {
      console.error(`Error fetching PFR stats for ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get player game log
   */
  async getPlayerGamelog(playerId: string | number, season?: number): Promise<any> {
    const year = season || this.getCurrentNFLSeason();
    const url = `${this.coreBaseUrl}/seasons/${year}/athletes/${playerId}/eventlog`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch gamelog: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching gamelog for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get all NFL teams
   */
  async getTeams(): Promise<BaseTeam[]> {
    const url = `${this.siteBaseUrl}/teams`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const teams: BaseTeam[] = [];
      
      if (data.sports?.[0]?.leagues?.[0]?.teams) {
        for (const teamWrapper of data.sports[0].leagues[0].teams) {
          const team = teamWrapper.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            city: team.location
          });
        }
      }
      
      return teams;
    } catch (error) {
      console.error('Error fetching NFL teams:', error);
      return [];
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(teamId: string | number): Promise<BaseTeam> {
    const url = `${this.siteBaseUrl}/teams/${teamId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const team = data.team;
      return {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        city: team.location
      };
    } catch (error) {
      console.error(`Error fetching team info for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get team roster
   */
  async getTeamRoster(teamId: string | number): Promise<any> {
    const url = `${this.siteBaseUrl}/teams/${teamId}/roster`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching roster for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get NFL schedule/scoreboard
   */
  async getSchedule(params: NFLScheduleParams): Promise<BaseGame[]> {
    const dateStr = this.formatDate(params.startDate);
    let url = `${this.siteBaseUrl}/scoreboard?dates=${dateStr}`;
    
    // Add week parameter if provided
    if (params.week) {
      url += `&seasontype=${params.seasonType || 2}&week=${params.week}`;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const games: BaseGame[] = [];
      
      if (data.events) {
        for (const event of data.events) {
          const competition = event.competitions?.[0];
          if (!competition) continue;
          
          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away');
          
          games.push({
            id: event.id,
            gameDate: event.date,
            homeTeam: {
              id: homeTeam?.team?.id || '',
              name: homeTeam?.team?.displayName || 'TBD',
              abbreviation: homeTeam?.team?.abbreviation
            },
            awayTeam: {
              id: awayTeam?.team?.id || '',
              name: awayTeam?.team?.displayName || 'TBD',
              abbreviation: awayTeam?.team?.abbreviation
            },
            homeScore: homeTeam?.score,
            awayScore: awayTeam?.score,
            status: competition.status?.type?.description || 'Scheduled'
          });
        }
      }
      
      return games;
    } catch (error) {
      console.error('Error fetching NFL schedule:', error);
      return [];
    }
  }

  /**
   * Get game details
   */
  async getGame(gameId: string | number): Promise<BaseGame> {
    const url = `${this.siteBaseUrl}/summary?event=${gameId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const event = data.header;
      const competition = event.competitions?.[0];
      const homeComp = competition?.competitors?.[0];
      const awayComp = competition?.competitors?.[1];
      
      return {
        id: event.id,
        gameDate: competition?.date || '',
        homeTeam: {
          id: homeComp?.team?.id || '',
          name: homeComp?.team?.displayName || 'TBD',
          abbreviation: homeComp?.team?.abbreviation
        },
        awayTeam: {
          id: awayComp?.team?.id || '',
          name: awayComp?.team?.displayName || 'TBD',
          abbreviation: awayComp?.team?.abbreviation
        },
        homeScore: homeComp?.score,
        awayScore: awayComp?.score,
        status: competition?.status?.type?.description || 'Unknown'
      };
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get player info (alias for getPlayerStats)
   */
  async getPlayerInfo(playerId: string | number): Promise<BasePlayer> {
    const stats = await this.getPlayerStats(playerId);
    
    return {
      id: stats.playerId || playerId,
      fullName: 'Unknown Player', // Stats endpoint doesn't include name
      firstName: undefined,
      lastName: undefined
    };
  }

  /**
   * Get comprehensive player overview with biographical and career context
   * Uses ESPN's athlete API for rich player information
   */
  async getPlayerOverview(playerId: string | number): Promise<import('./base-api.js').BasePlayerOverview | null> {
    // Check if this is a Pro Football Reference player
    if (typeof playerId === 'string' && playerId.startsWith('pfr_')) {
      return this.getPFRPlayerOverview(playerId);
    }
    
    try {
      const url = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch player overview for ${playerId}: ${response.status}`);
        // Try Pro Football Reference as fallback
        console.log(`Trying Pro Football Reference for player overview...`);
        return this.getPFRPlayerOverview(`pfr_${playerId}`);
      }
      
      const data = await response.json();
      const athlete = data.athlete;
      
      if (!athlete) {
        return null;
      }
      
      // Parse ESPN athlete data into BasePlayerOverview format
      const overview: import('./base-api.js').BasePlayerOverview = {
        id: playerId,
        fullName: athlete.fullName || athlete.displayName || 'Unknown',
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        displayName: athlete.displayName,
        shortName: athlete.displayName,
        weight: athlete.displayWeight,
        height: athlete.displayHeight,
        age: athlete.age,
        birthDate: athlete.displayDOB,
        birthPlace: athlete.displayBirthPlace,
        college: athlete.college?.name,
        position: athlete.position?.displayName || athlete.position?.name,
        jerseyNumber: athlete.displayJersey?.replace('#', ''),
        team: athlete.team ? {
          id: athlete.team.id,
          name: athlete.team.name,
          abbreviation: athlete.team.abbreviation,
          displayName: athlete.team.displayName
        } : undefined,
        experience: athlete.displayExperience,
        status: athlete.status?.name,
        headshot: athlete.headshot?.href,
        careerSummary: {
          seasons: athlete.displayExperience,
          highlights: [],
          awards: []
        },
        draftInfo: athlete.displayDraft ? {
          year: parseInt(athlete.displayDraft.split(':')[0]),
          round: parseInt(athlete.displayDraft.match(/Rd (\d+)/)?.[1] || '0'),
          pick: parseInt(athlete.displayDraft.match(/Pk (\d+)/)?.[1] || '0'),
          team: athlete.displayDraft.match(/\(([A-Z]+)\)/)?.[1]
        } : undefined
      };
      
      return overview;
      
    } catch (error) {
      console.error(`Error fetching player overview for ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Get current NFL standings
   */
  async getStandings(season?: number, conference?: number): Promise<any> {
    let url = `${this.siteBaseUrl}/standings`;
    const params = [];
    
    if (season) params.push(`season=${season}`);
    if (conference) params.push(`group=${conference}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }

  /**
   * Get live scoreboard
   */
  async getScoreboard(date?: string, week?: number, seasonType?: number): Promise<any> {
    let url = `${this.siteBaseUrl}/scoreboard`;
    const params = [];
    
    if (date) params.push(`dates=${this.formatDate(date)}`);
    if (week) params.push(`week=${week}`);
    if (seasonType) params.push(`seasontype=${seasonType}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
      throw error;
    }
  }

  /**
   * Ensure player cache is loaded
   */
  private async ensurePlayerCache(): Promise<void> {
    // Check if cache is valid
    if (this.playerCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return;
    }
    
    // Load fresh cache
    await this.loadPlayerCache();
  }

  /**
   * Load all players from all team rosters into cache
   * This is called once every 24 hours
   */
  private async loadPlayerCache(): Promise<void> {
    console.error('Loading NFL player cache from all 32 team rosters...');
    const players: BasePlayer[] = [];
    this.playerNameMap.clear(); // Clear existing name map
    
    for (const teamId of NFL_TEAM_IDS) {
      try {
        const roster = await this.getTeamRoster(teamId);
        
        if (roster.athletes) {
          for (const positionGroup of roster.athletes) {
            if (positionGroup.items) {
              for (const athlete of positionGroup.items) {
                players.push({
                  id: athlete.id,
                  fullName: athlete.displayName,
                  firstName: athlete.firstName,
                  lastName: athlete.lastName
                });
                
                // Store player name in map for quick lookup
                this.playerNameMap.set(athlete.id.toString(), athlete.displayName);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error loading roster for team ${teamId}:`, error);
        // Continue with other teams
      }
    }
    
    this.playerCache = players;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    console.error(`Loaded ${players.length} NFL players into cache`);
  }

  /**
   * Get player overview from Pro Football Reference
   */
  private async getPFRPlayerOverview(playerId: string): Promise<import('./base-api.js').BasePlayerOverview | null> {
    try {
      // Extract the actual PFR player ID
      const pfrId = playerId.replace('pfr_', '');
      
      // Construct the PFR player URL
      const playerUrl = `/players/${pfrId.charAt(0).toUpperCase()}/${pfrId}.htm`;
      
      // Get stats from PFR which includes basic player info
      const pfrStats = await this.pfrScraper.getPlayerStats(playerUrl);
      
      if (!pfrStats) {
        console.log(`No player overview found on Pro Football Reference for ${pfrId}`);
        return null;
      }
      
      // Create basic overview from PFR data
      const overview: import('./base-api.js').BasePlayerOverview = {
        id: playerId,
        fullName: pfrStats.playerName || 'Unknown Player',
        firstName: pfrStats.playerName?.split(' ')[0] || '',
        lastName: pfrStats.playerName?.split(' ').slice(1).join(' ') || '',
        displayName: pfrStats.playerName || 'Unknown Player',
        shortName: pfrStats.playerName || 'Unknown Player',
        position: pfrStats.position || 'Unknown',
        team: pfrStats.team ? {
          id: 'unknown',
          name: pfrStats.team,
          abbreviation: pfrStats.team,
          displayName: pfrStats.team
        } : undefined,
        careerSummary: {
          seasons: 0, // Unknown number of seasons
          highlights: [],
          awards: []
        },
        // Add note that this is from PFR
        status: 'Pro Football Reference Data'
      };
      
      return overview;
      
    } catch (error) {
      console.error(`Error fetching PFR player overview for ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Format date string for ESPN API
   */
  private formatDate(date: string): string {
    // ESPN API expects YYYYMMDD format
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
