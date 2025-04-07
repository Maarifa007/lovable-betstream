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

// Mapping of supported sports to URLs
const SPREADEX_URLS = {
  football: 'https://www.spreadex.com/sports/football',
  basketball: 'https://www.spreadex.com/sports/basketball',
  golf: 'https://www.spreadex.com/sports/golf',
  tennis: 'https://www.spreadex.com/sports/tennis'
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
    sport: 'football' | 'basketball' | 'golf' | 'tennis',
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
}

// Create a singleton instance
const marketScraper = new MarketScraperService();

// Start scheduled scraping on app initialization (demo uses 5 minutes instead of 3 hours)
marketScraper.startScheduledScraping(5/60); // 5 minutes in hours

export default marketScraper;
