/**
 * Pro Football Reference (PFR) scraper utility
 * Provides fallback player data and statistics when ESPN APIs fail
 */

export interface PFRPlayer {
  id: string;
  name: string;
  position: string;
  team?: string;
  years?: string;
  birthDate?: string;
  college?: string;
  height?: string;
  weight?: string;
  url?: string;
}

export interface PFRPlayerStats {
  playerId: string;
  playerName: string;
  season: string;
  team: string;
  position: string;
  games: number;
  // Passing stats
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  completions?: number;
  attempts?: number;
  passerRating?: number;
  // Rushing stats
  rushingAttempts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  // Receiving stats
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
}

export class PFRScraper {
  private baseUrl = 'https://www.pro-football-reference.com';
  
  /**
   * Search for players by name on Pro Football Reference
   */
  async searchPlayers(query: string): Promise<PFRPlayer[]> {
    try {
      // PFR search URL format
      const searchUrl = `${this.baseUrl}/search/search.fcgi?search=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`PFR search failed with status: ${response.status}`);
        return [];
      }
      
      const html = await response.text();
      
      // Parse HTML to extract player search results
      // This is a simplified parser - in production, you'd use a proper HTML parser
      const players = this.parsePlayerSearchResults(html, query);
      
      return players;
      
    } catch (error) {
      console.log('PFR search error:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }
  
  /**
   * Get player statistics from Pro Football Reference
   */
  async getPlayerStats(playerUrl: string, season?: string): Promise<PFRPlayerStats | null> {
    try {
      const url = playerUrl.startsWith('http') ? playerUrl : `${this.baseUrl}${playerUrl}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`PFR player page failed with status: ${response.status}`);
        return null;
      }
      
      const html = await response.text();
      
      // Parse player stats from HTML
      const stats = this.parsePlayerStats(html, season);
      
      return stats;
      
    } catch (error) {
      console.log('PFR player stats error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }
  
  /**
   * Parse player search results from PFR HTML
   */
  private parsePlayerSearchResults(html: string, query: string): PFRPlayer[] {
    const players: PFRPlayer[] = [];
    
    try {
      // Look for player search results in the HTML
      // PFR typically shows results in a specific format
      
      // Match player links in search results
      const playerLinkRegex = /<a href="\/players\/[A-Z]\/([^"]+)\.htm">([^<]+)<\/a>/g;
      let match;
      
      while ((match = playerLinkRegex.exec(html)) !== null) {
        const playerId = match[1];
        const playerName = match[2].trim();
        
        // Basic relevance check
        if (this.isRelevantPlayer(playerName, query)) {
          players.push({
            id: playerId,
            name: playerName,
            position: 'Unknown',
            url: `/players/${playerId.charAt(0)}/${playerId}.htm`
          });
        }
      }
      
      // Also look for direct redirects to player pages
      if (players.length === 0 && html.includes('redirected')) {
        const redirectMatch = html.match(/window\.location\.href="([^"]+)"/);
        if (redirectMatch) {
          const playerUrl = redirectMatch[1];
          const playerIdMatch = playerUrl.match(/\/players\/[A-Z]\/([^.]+)\.htm/);
          if (playerIdMatch) {
            players.push({
              id: playerIdMatch[1],
              name: query, // Use the search query as name
              position: 'Unknown',
              url: playerUrl
            });
          }
        }
      }
      
    } catch (error) {
      console.log('Error parsing PFR search results:', error);
    }
    
    return players.slice(0, 10); // Limit results
  }
  
  /**
   * Parse player statistics from PFR player page HTML
   */
  private parsePlayerStats(html: string, season?: string): PFRPlayerStats | null {
    try {
      // Extract player name from page title
      const nameMatch = html.match(/<title>([^<]+) Stats/);
      const playerName = nameMatch ? nameMatch[1].trim() : 'Unknown Player';
      
      // Extract basic player info
      const positionMatch = html.match(/Position:\s*<\/strong>\s*([^<\n]+)/);
      const position = positionMatch ? positionMatch[1].trim() : 'Unknown';
      
      // For now, return basic structure - in production, you'd parse the full stats tables
      const stats: PFRPlayerStats = {
        playerId: 'pfr_player',
        playerName,
        season: season || 'Career',
        team: 'Multiple Teams',
        position,
        games: 0,
        // Add more stats parsing here
      };
      
      // Look for passing stats table
      const passingStatsMatch = html.match(/<table[^>]*id="[^"]*passing[^"]*"[^>]*>(.*?)<\/table>/s);
      if (passingStatsMatch) {
        // Parse passing stats - simplified version
        const passingYardsMatch = passingStatsMatch[1].match(/data-stat="pass_yds"[^>]*>(\d+)</);
        const passingTDsMatch = passingStatsMatch[1].match(/data-stat="pass_td"[^>]*>(\d+)</);
        const interceptionsMatch = passingStatsMatch[1].match(/data-stat="pass_int"[^>]*>(\d+)</);
        
        if (passingYardsMatch) stats.passingYards = parseInt(passingYardsMatch[1]);
        if (passingTDsMatch) stats.passingTDs = parseInt(passingTDsMatch[1]);
        if (interceptionsMatch) stats.interceptions = parseInt(interceptionsMatch[1]);
      }
      
      return stats;
      
    } catch (error) {
      console.log('Error parsing PFR player stats:', error);
      return null;
    }
  }
  
  /**
   * Check if a player name is relevant to the search query
   */
  private isRelevantPlayer(playerName: string, query: string): boolean {
    const normalizedPlayer = playerName.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // Check for exact matches or partial matches
    return normalizedPlayer.includes(normalizedQuery) || 
           normalizedQuery.includes(normalizedPlayer) ||
           this.calculateSimilarity(normalizedPlayer, normalizedQuery) > 0.6;
  }
  
  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}