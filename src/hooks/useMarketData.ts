
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

export interface MarketData {
  sport: string;
  marketName: string;
  match: string;
  buyPrice: number;
  sellPrice: number;
  matchTime: string;
  homeTeam?: string;
  awayTeam?: string;
  odds?: {
    home: number;
    away: number;
    draw?: number;
  };
}

// Simulated market data for different sports
const simulatedMarkets: Record<string, MarketData[]> = {
  football: [
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
  ],
  basketball: [
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
  ],
  tennis: [
    {
      sport: 'tennis',
      marketName: 'ATP Rome Games Spread',
      match: 'Djokovic vs Nadal',
      buyPrice: 2.5,
      sellPrice: 2.2,
      matchTime: '2025-04-15T13:00:00Z'
    }
  ],
  golf: [
    {
      sport: 'golf',
      marketName: 'US Open Finishing Position',
      match: 'Tiger Woods',
      buyPrice: 45.5,
      sellPrice: 42.0,
      matchTime: '2025-04-18T16:00:00Z'
    }
  ]
};

/**
 * Hook to fetch market data for a specific sport
 */
export function useMarketData(sport: string = 'football') {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch data for a specific sport
  const fetchMarketData = async (sportType: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch from OddsAPI via edge function first
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log(`Fetching live odds for ${sportType} from OddsAPI`);
      
      const { data: liveData, error: apiError } = await supabase.functions.invoke('odds-api', {
        body: { sport: sportType }
      });

      if (!apiError && liveData && Array.isArray(liveData)) {
        console.log(`Successfully fetched ${liveData.length} live matches for ${sportType}`);
        setMarkets(liveData);
        return liveData;
      } else {
        console.warn('OddsAPI failed, falling back to simulated data:', apiError);
      }
      
      // Fallback to simulated data if API fails
      const data = simulatedMarkets[sportType] || [];
      
      // Add slight random variations to prices to simulate live updates
      const updatedData = data.map(market => ({
        ...market,
        buyPrice: +(market.buyPrice + (Math.random() * 0.4 - 0.2)).toFixed(2),
        sellPrice: +(market.sellPrice + (Math.random() * 0.4 - 0.2)).toFixed(2)
      }));
      
      setMarkets(updatedData);
      return updatedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching market data');
      setError(error);
      toast({
        title: "Error fetching market data",
        description: error.message,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMarketData(sport);
    
    // Set up refresh interval (every 60 seconds for live odds)
    const intervalId = setInterval(() => {
      fetchMarketData(sport);
    }, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [sport]);

  return {
    markets,
    isLoading,
    error,
    refetch: (sportType: string = sport) => fetchMarketData(sportType)
  };
}

/**
 * Fetch live price for a specific match
 */
export async function fetchLivePrice(matchName: string): Promise<{ buyPrice: number, sellPrice: number } | null> {
  try {
    // Combine all simulated markets
    const allMarkets = Object.values(simulatedMarkets).flat();
    
    // Find the match by name (case insensitive partial match)
    const match = allMarkets.find(market => 
      market.match.toLowerCase().includes(matchName.toLowerCase())
    );
    
    if (!match) return null;
    
    // Add slight variations to simulate "live" prices
    return {
      buyPrice: +(match.buyPrice + (Math.random() * 0.3 - 0.15)).toFixed(2),
      sellPrice: +(match.sellPrice + (Math.random() * 0.3 - 0.15)).toFixed(2)
    };
  } catch (error) {
    console.error("Error fetching live price:", error);
    return null;
  }
}
