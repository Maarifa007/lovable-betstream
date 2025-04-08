import { toast } from "@/hooks/use-toast";

// Define market data interface
export interface ScrapedMarket {
  sport: string;
  marketName: string;
  match: string;
  buyPrice: number;
  sellPrice: number;
  matchTime: string;
}

// Define match data interface
export interface MatchData {
  home: string;
  away: string;
  sportType: 'football' | 'basketball' | 'golf' | 'tennis' | 'baseball';
  date?: string; // Optional date in YYYY-MM-DD format
}

// Mapping of supported sports to URLs
const SPREADEX_URLS = {
  football: 'https://www.spreadex.com/sports/football',
  basketball: 'https://www.spreadex.com/sports/basketball',
  golf: 'https://www.spreadex.com/sports/golf',
  tennis: 'https://www.spreadex.com/sports/tennis',
  baseball: 'https://www.spreadex.com/sports/baseball/spr/c24'
};

/**
 * Market scraper service for fetching odds from Spreadex
 * 
 * In a real implementation, this would be a backend service using
 * Puppeteer or Playwright. Here we simulate the response for demo purposes.
 */
export class MarketScraperService {
  private cachedResults: Record<string, { data: ScrapedMarket[], timestamp: number }> = {};
  private isRunning = false;
  private intervals: Record<string, number> = {};
  
  constructor() {
    this.initializeCacheWithDemoData();
  }
  
  /**
   * Initialize cache with demo data
   * In a real app, this would be populated from backend API
   */
  private initializeCacheWithDemoData() {
    const now = Date.now();
    
    // Football demo data
    this.cachedResults['football'] = {
      timestamp: now,
      data: [
        {
          sport: 'football',
          marketName: 'Premier League Spread',
          match: 'West Ham vs Leicester',
          buyPrice: 3.2,
          sellPrice: 2.8,
          matchTime: '2025-04-12T15:00:00Z'
        },
        {
          sport: 'football',
          marketName: 'La Liga Spread',
          match: 'Barcelona vs Real Madrid',
          buyPrice: 10.8,
          sellPrice: 10.2,
          matchTime: '2025-04-13T19:45:00Z'
        }
      ]
    };
    
    // Basketball demo data
    this.cachedResults['basketball'] = {
      timestamp: now,
      data: [
        {
          sport: 'basketball',
          marketName: 'NBA Spread',
          match: 'Lakers vs Warriors',
          buyPrice: 8.5,
          sellPrice: 8.0,
          matchTime: '2025-04-08T00:00:00Z'
        },
        {
          sport: 'basketball',
          marketName: 'NBA Spread',
          match: 'Bulls vs Celtics',
          buyPrice: 5.2,
          sellPrice: 4.7,
          matchTime: '2025-04-09T00:30:00Z'
        }
      ]
    };
  }
  
  /**
   * Fetch markets for a specific sport
   * @param sport The sport to fetch markets for
   * @param forceRefresh Whether to force a refresh from the source
   * @returns Promise resolving to array of markets
   */
  public async fetchMarkets(
    sport: 'football' | 'basketball' | 'golf' | 'tennis' | 'baseball',
    forceRefresh = false
  ): Promise<ScrapedMarket[]> {
    // Check if we have cached data that's less than 3 hours old
    const cachedData = this.cachedResults[sport];
    const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
    const CACHE_EXPIRY = 3 * 60 * 60 * 1000; // 3 hours
    
    if (!forceRefresh && cachedData && cacheAge < CACHE_EXPIRY) {
      console.log(`Using cached market data for ${sport}, age: ${Math.round(cacheAge / 60000)} minutes`);
      return this.addRandomVariation(cachedData.data);
    }
    
    // In a real app, this would make a call to a backend API that uses Puppeteer
    // For demo, we'll simulate a network call and return demo data
    console.log(`Fetching fresh market data for ${sport} from ${SPREADEX_URLS[sport]}`);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate demo data with the current timestamp
      const freshData = this.generateDemoData(sport);
      
      // Cache the results
      this.cachedResults[sport] = {
        timestamp: Date.now(),
        data: freshData
      };
      
      return freshData;
    } catch (error) {
      console.error(`Error fetching ${sport} markets:`, error);
      
      // If we have cached data, return it with a toast notification
      if (cachedData) {
        toast({
          title: "Using cached data",
          description: `Could not fetch fresh ${sport} odds. Using cached data.`,
          variant: "warning"
        });
        return this.addRandomVariation(cachedData.data);
      }
      
      // Otherwise, throw the error
      throw new Error(`Failed to fetch ${sport} markets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Fetch markets for specific matches
   * @param matches List of matches to fetch markets for
   * @returns Promise resolving to array of markets for the specified matches
   */
  public async fetchMatchMarkets(matches: MatchData[]): Promise<ScrapedMarket[]> {
    console.log(`Fetching markets for ${matches.length} specific matches`);
    
    const results: ScrapedMarket[] = [];
    
    // Group matches by sport for efficiency
    const matchesByType: Record<string, MatchData[]> = {};
    matches.forEach(match => {
      if (!matchesByType[match.sportType]) {
        matchesByType[match.sportType] = [];
      }
      matchesByType[match.sportType].push(match);
    });
    
    // Process each sport group
    for (const [sport, sportMatches] of Object.entries(matchesByType)) {
      try {
        console.log(`Scraping ${sport} for ${sportMatches.length} matches`);
        
        // In a real implementation, this would use Puppeteer to:
        // 1. Visit the sport URL
        // 2. For each match:
        //    a. Find the match link by searching for innerText containing both team names
        //    b. Click into the match page
        //    c. Extract all spread markets and prices
        //    d. Navigate back to the sport page
        
        // Since we're simulating, we'll generate demo data based on the match info
        for (const match of sportMatches) {
          const matchName = `${match.home} vs ${match.away}`;
          console.log(`Finding markets for: ${matchName}`);
          
          // Generate spread markets for this match
          const spreadMarkets = this.generateSpreadMarketsForMatch(match);
          results.push(...spreadMarkets);
        }
        
        // Store in cache for future use
        this.cacheMatchResults(sport, results);
        
      } catch (error) {
        console.error(`Error fetching markets for ${sport}:`, error);
        toast({
          title: `Error scraping ${sport}`,
          description: `Could not fetch markets for ${sport} matches.`,
          variant: "destructive"
        });
      }
    }
    
    return results;
  }
  
  /**
   * Generate simulated spread markets for a specific match
   * @param match The match to generate markets for
   * @returns Array of spread markets
   */
  private generateSpreadMarketsForMatch(match: MatchData): ScrapedMarket[] {
    const matchName = `${match.home} vs ${match.away}`;
    const matchTime = match.date ? 
      `${match.date}T${14 + Math.floor(Math.random() * 8)}:${Math.floor(Math.random() * 6)}0:00Z` : 
      `2025-04-${10 + Math.floor(Math.random() * 20)}T${14 + Math.floor(Math.random() * 8)}:${Math.floor(Math.random() * 6)}0:00Z`;
    
    const markets: ScrapedMarket[] = [];
    
    // Add Total Points/Goals Spread
    const totalBase = match.sportType === 'basketball' ? 220 : match.sportType === 'baseball' ? 8.5 : 2.5;
    const totalSpread = totalBase + (Math.random() * 5 - 2.5);
    markets.push({
      sport: match.sportType,
      marketName: `${match.sportType === 'basketball' ? 'Total Points' : 'Total Goals'} Spread`,
      match: matchName,
      buyPrice: +(totalSpread + 0.2).toFixed(2),
      sellPrice: +(totalSpread - 0.2).toFixed(2),
      matchTime
    });
    
    // Add Handicap Spread
    const handicapBase = match.sportType === 'basketball' ? 7.5 : 1.5;
    const handicapSpread = handicapBase + (Math.random() * 3 - 1.5);
    markets.push({
      sport: match.sportType,
      marketName: `${match.home} Handicap Spread`,
      match: matchName,
      buyPrice: +(handicapSpread + 0.3).toFixed(2),
      sellPrice: +(handicapSpread - 0.3).toFixed(2),
      matchTime
    });
    
    // Add Player Props if it's basketball or baseball
    if (match.sportType === 'basketball' || match.sportType === 'baseball') {
      const playerName = match.sportType === 'basketball' ? 
        `${['L.', 'K.', 'J.', 'S.'][Math.floor(Math.random() * 4)]} ${['James', 'Durant', 'Curry', 'Doncic'][Math.floor(Math.random() * 4)]}` :
        `${['M.', 'A.', 'R.', 'S.'][Math.floor(Math.random() * 4)]} ${['Trout', 'Judge', 'Ohtani', 'Guerrero'][Math.floor(Math.random() * 4)]}`;
      
      const propBase = match.sportType === 'basketball' ? 25.5 : 1.5;
      const propSpread = propBase + (Math.random() * 4 - 2);
      markets.push({
        sport: match.sportType,
        marketName: `${playerName} ${match.sportType === 'basketball' ? 'Points' : 'Home Runs'} Spread`,
        match: matchName,
        buyPrice: +(propSpread + 0.25).toFixed(2),
        sellPrice: +(propSpread - 0.25).toFixed(2),
        matchTime
      });
    }
    
    return markets;
  }
  
  /**
   * Cache results for a sport
   */
  private cacheMatchResults(sport: string, markets: ScrapedMarket[]) {
    // Only cache if we have results
    if (markets.length > 0) {
      const newData = this.cachedResults[sport]?.data || [];
      const combinedData = [...newData];
      
      // Add new markets, avoiding duplicates by match name + market name
      markets.forEach(market => {
        const existingIndex = combinedData.findIndex(
          m => m.match === market.match && m.marketName === market.marketName
        );
        
        if (existingIndex >= 0) {
          combinedData[existingIndex] = market; // Replace with latest
        } else {
          combinedData.push(market); // Add new
        }
      });
      
      this.cachedResults[sport] = {
        timestamp: Date.now(),
        data: combinedData
      };
      
      console.log(`Cached ${markets.length} markets for ${sport}. Total cache: ${combinedData.length} markets`);
    }
  }
  
  /**
   * Add random variation to prices to simulate live updates
   */
  private addRandomVariation(markets: ScrapedMarket[]): ScrapedMarket[] {
    return markets.map(market => ({
      ...market,
      buyPrice: +(market.buyPrice + (Math.random() * 0.6 - 0.3)).toFixed(2),
      sellPrice: +(market.sellPrice + (Math.random() * 0.6 - 0.3)).toFixed(2)
    }));
  }
  
  /**
   * Generate demo data for a specific sport
   */
  private generateDemoData(sport: string): ScrapedMarket[] {
    switch (sport) {
      case 'football':
        return [
          {
            sport: 'football',
            marketName: 'Premier League Spread',
            match: 'West Ham vs Leicester',
            buyPrice: 3.2 + (Math.random() * 0.6 - 0.3),
            sellPrice: 2.8 + (Math.random() * 0.6 - 0.3),
            matchTime: '2025-04-12T15:00:00Z'
          },
          {
            sport: 'football',
            marketName: 'La Liga Spread',
            match: 'Barcelona vs Real Madrid',
            buyPrice: 10.8 + (Math.random() * 0.8 - 0.4),
            sellPrice: 10.2 + (Math.random() * 0.8 - 0.4),
            matchTime: '2025-04-13T19:45:00Z'
          },
          {
            sport: 'football',
            marketName: 'Bundesliga Spread',
            match: 'Bayern Munich vs Dortmund',
            buyPrice: 7.5 + (Math.random() * 0.7 - 0.35),
            sellPrice: 7.0 + (Math.random() * 0.7 - 0.35),
            matchTime: '2025-04-14T18:30:00Z'
          }
        ];
      case 'basketball':
        return [
          {
            sport: 'basketball',
            marketName: 'NBA Spread',
            match: 'Lakers vs Warriors',
            buyPrice: 8.5 + (Math.random() * 0.6 - 0.3),
            sellPrice: 8.0 + (Math.random() * 0.6 - 0.3),
            matchTime: '2025-04-08T00:00:00Z'
          },
          {
            sport: 'basketball',
            marketName: 'NBA Spread',
            match: 'Bulls vs Celtics',
            buyPrice: 5.2 + (Math.random() * 0.5 - 0.25),
            sellPrice: 4.7 + (Math.random() * 0.5 - 0.25),
            matchTime: '2025-04-09T00:30:00Z'
          }
        ];
      case 'tennis':
        return [
          {
            sport: 'tennis',
            marketName: 'ATP Rome Games Spread',
            match: 'Djokovic vs Nadal',
            buyPrice: 2.5 + (Math.random() * 0.4 - 0.2),
            sellPrice: 2.2 + (Math.random() * 0.4 - 0.2),
            matchTime: '2025-04-15T13:00:00Z'
          },
          {
            sport: 'tennis',
            marketName: 'WTA Madrid Games Spread',
            match: 'Swiatek vs Gauff',
            buyPrice: 3.1 + (Math.random() * 0.4 - 0.2),
            sellPrice: 2.7 + (Math.random() * 0.4 - 0.2),
            matchTime: '2025-04-16T11:00:00Z'
          }
        ];
      case 'golf':
        return [
          {
            sport: 'golf',
            marketName: 'US Open Finishing Position',
            match: 'Tiger Woods',
            buyPrice: 45.5 + (Math.random() * 3 - 1.5),
            sellPrice: 42.0 + (Math.random() * 3 - 1.5),
            matchTime: '2025-04-18T16:00:00Z'
          },
          {
            sport: 'golf',
            marketName: 'US Open Finishing Position',
            match: 'Rory McIlroy',
            buyPrice: 24.0 + (Math.random() * 2 - 1),
            sellPrice: 22.0 + (Math.random() * 2 - 1),
            matchTime: '2025-04-18T14:30:00Z'
          }
        ];
      case 'baseball':
        return [
          {
            sport: 'baseball',
            marketName: 'World Series Spread',
            match: 'Dodgers vs Yankees',
            buyPrice: 1.5 + (Math.random() * 0.5 - 0.25),
            sellPrice: 1.0 + (Math.random() * 0.5 - 0.25),
            matchTime: '2025-04-20T19:00:00Z'
          },
          {
            sport: 'baseball',
            marketName: 'World Series Spread',
            match: 'Red Sox vs Blue Jays',
            buyPrice: 2.0 + (Math.random() * 0.6 - 0.3),
            sellPrice: 1.5 + (Math.random() * 0.6 - 0.3),
            matchTime: '2025-04-21T18:30:00Z'
          }
        ];
      default:
        return [];
    }
  }
  
  /**
   * Start scheduled scraping at the specified interval
   * @param intervalHours How often to scrape in hours
   */
  public startScheduledScraping(intervalHours = 3) {
    if (this.isRunning) {
      console.warn('Scheduled scraping is already running');
      return;
    }
    
    this.isRunning = true;
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    // Schedule each sport
    Object.keys(SPREADEX_URLS).forEach(sport => {
      // Initial fetch
      this.fetchMarkets(sport as any).catch(console.error);
      
      // Set up interval
      this.intervals[sport] = window.setInterval(() => {
        this.fetchMarkets(sport as any, true).catch(console.error);
      }, intervalMs);
    });
    
    console.log(`Scheduled market scraping started. Running every ${intervalHours} hours`);
  }
  
  /**
   * Stop scheduled scraping
   */
  public stopScheduledScraping() {
    if (!this.isRunning) {
      return;
    }
    
    // Clear all intervals
    Object.values(this.intervals).forEach(intervalId => {
      clearInterval(intervalId);
    });
    
    this.intervals = {};
    this.isRunning = false;
    console.log('Scheduled market scraping stopped');
  }
  
  /**
   * Search for markets matching a query
   * @param query The search query
   * @returns Array of matching markets
   */
  public async searchMarkets(query: string): Promise<ScrapedMarket[]> {
    // Fetch all markets from all sports
    const allMarkets: ScrapedMarket[] = [];
    
    for (const sport of Object.keys(SPREADEX_URLS)) {
      try {
        const markets = await this.fetchMarkets(sport as any);
        allMarkets.push(...markets);
      } catch (error) {
        console.error(`Error fetching ${sport} markets for search:`, error);
      }
    }
    
    // Filter by query (case insensitive)
    const normalizedQuery = query.toLowerCase();
    return allMarkets.filter(market => {
      return (
        market.match.toLowerCase().includes(normalizedQuery) ||
        market.marketName.toLowerCase().includes(normalizedQuery) ||
        market.sport.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  /**
   * Backend simulation of Puppeteer-based scraping
   * In a real implementation, this would run on a Node.js backend
   * @param url The URL to scrape
   * @param matchData Optional match data to look for
   */
  private async simulatePuppeteerScrape(url: string, matchData?: MatchData): Promise<ScrapedMarket[]> {
    console.log(`🔍 Simulating Puppeteer scrape of ${url}`);
    
    // Simulate network and processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // If we're looking for a specific match, simulate finding it
    if (matchData) {
      console.log(`Looking for match: ${matchData.home} vs ${matchData.away}`);
      // In a real implementation, this would:
      // 1. Use page.evaluate to search the DOM for elements containing both team names
      // 2. If found, simulate clicking on the element to navigate to the match page
      // 3. Extract all spread markets and prices
      
      return this.generateSpreadMarketsForMatch(matchData);
    }
    
    // Otherwise, generate general data for the sport
    const sport = url.split('/').pop() as string;
    return this.generateDemoData(sport);
  }
  
  /**
   * Real-world implementation of this function would use Puppeteer to find and extract markets
   * Example of what the code would look like:
   */
  private async puppeteerImplementation(sportType: string, match: MatchData): Promise<ScrapedMarket[]> {
    // This is a commented-out example of how this would be implemented with Puppeteer
    /*
    import puppeteer from 'puppeteer';
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to sports page
      await page.goto(SPREADEX_URLS[sportType], { waitUntil: 'networkidle2' });
      
      // Look for match in the DOM
      const matchText = `${match.home}.*${match.away}|${match.away}.*${match.home}`;
      const matchPattern = new RegExp(matchText, 'i');
      
      // Find match links
      const matchLinks = await page.$$eval('a', (links, pattern) => {
        const regex = new RegExp(pattern);
        return links
          .filter(link => regex.test(link.innerText))
          .map(link => ({ text: link.innerText, href: link.href }));
      }, matchPattern.source);
      
      if (matchLinks.length === 0) {
        console.log(`No matches found for ${match.home} vs ${match.away}`);
        return [];
      }
      
      // Click on the first match link
      await page.goto(matchLinks[0].href, { waitUntil: 'networkidle2' });
      
      // Extract market data
      const markets = await page.$$eval('.market-container', (containers, sportType) => {
        return containers.map(container => {
          const marketName = container.querySelector('.market-name')?.textContent?.trim() || '';
          const match = document.querySelector('.event-header')?.textContent?.trim() || '';
          const buyPriceElement = container.querySelector('.buy-price');
          const sellPriceElement = container.querySelector('.sell-price');
          const timeElement = document.querySelector('.event-time');
          
          const buyPrice = parseFloat(buyPriceElement?.textContent?.trim() || '0');
          const sellPrice = parseFloat(sellPriceElement?.textContent?.trim() || '0');
          const matchTime = timeElement?.getAttribute('datetime') || new Date().toISOString();
          
          return {
            sport: sportType,
            marketName,
            match,
            buyPrice,
            sellPrice,
            matchTime
          };
        });
      }, sportType);
      
      return markets;
    } finally {
      await browser.close();
    }
    */
    
    // For now, return simulated data
    console.log(`Simulating Puppeteer implementation for ${match.home} vs ${match.away}`);
    return this.generateSpreadMarketsForMatch(match);
  }
}

// Create a singleton instance
const marketScraper = new MarketScraperService();

// Start scheduled scraping on app initialization (demo uses 5 minutes instead of 3 hours)
marketScraper.startScheduledScraping(5/60); // 5 minutes in hours

export default marketScraper;
