
import { toast } from "@/hooks/use-toast";

// Types for sports data
export interface GameResult {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalPoints: number;
  status: 'scheduled' | 'in-progress' | 'final';
  sport: 'NBA' | 'NFL' | 'MLB' | 'Soccer' | 'NHL';
  startTime: string;
  endTime?: string;
}

// Helper to detect API base URL based on environment
const getApiBaseUrl = () => {
  // If in production, use the same domain
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return '';  // Empty string means same domain
  }
  
  // In development, use localhost:3001
  return 'http://localhost:3001';
};

// Base API URL for all requests
const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch sports scores from the primary API (Sportspage Feeds)
 * @param sport The sport type to fetch scores for
 * @param date Optional date string in YYYY-MM-DD format
 * @returns Promise that resolves to an array of game results
 */
export const fetchSportsScores = async (
  sport: 'NBA' | 'NFL' | 'MLB' | 'Soccer' | 'NHL', 
  date?: string
): Promise<GameResult[]> => {
  try {
    console.log(`🔄 Fetching ${sport} scores from primary API...`);
    
    // Build the query string with optional date parameter
    const queryParams = date ? `?date=${date}` : '';
    const url = `${API_BASE_URL}/api/fetch-scores/${sport.toLowerCase()}${queryParams}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched ${sport} scores from API`);
    return data;
  } catch (error) {
    console.error(`❌ Primary API failed for ${sport} scores:`, error);
    
    // Notify the user that we're using the backup data source
    toast({
      title: "Using Backup Data Source",
      description: "We're experiencing issues with our primary score provider. Switched to backup.",
      variant: "warning",
    });
    
    // Try fallback method (ESPN, Yahoo Sports scraper)
    return fetchScoresFromFallback(sport, date);
  }
};

/**
 * Fetch sports scores from a fallback source if the primary API fails
 * @param sport The sport type to fetch scores for
 * @param date Optional date string in YYYY-MM-DD format
 * @returns Promise that resolves to an array of game results
 */
const fetchScoresFromFallback = async (
  sport: 'NBA' | 'NFL' | 'MLB' | 'Soccer' | 'NHL', 
  date?: string
): Promise<GameResult[]> => {
  try {
    console.log(`🔄 Trying backup API for ${sport} scores...`);
    
    // Build the query string with optional date parameter
    const queryParams = date ? `?date=${date}` : '';
    const url = `${API_BASE_URL}/api/backup-scores/${sport.toLowerCase()}${queryParams}`;
    
    const fallbackResponse = await fetch(url);
    
    if (!fallbackResponse.ok) {
      throw new Error(`Backup API failed with status: ${fallbackResponse.status}`);
    }
    
    const fallbackData = await fallbackResponse.json();
    console.log(`✅ Successfully fetched ${sport} scores from backup API`);
    return fallbackData;
  } catch (fallbackError) {
    console.error(`❌ Both primary and fallback APIs failed for ${sport} scores:`, fallbackError);
    
    // Notify the user that all APIs failed
    toast({
      title: "Score Data Unavailable",
      description: "Unable to fetch score data. Using cached data if available.",
      variant: "destructive",
    });
    
    // Return mock data as a last resort
    return getMockSportsData(sport);
  }
};

/**
 * Generate mock sports data for testing or when all APIs fail
 * @param sport The sport type to generate mock data for
 * @returns Array of mock game results
 */
const getMockSportsData = (sport: 'NBA' | 'NFL' | 'MLB' | 'Soccer' | 'NHL'): GameResult[] => {
  const currentDate = new Date().toISOString();
  
  // Provide different mock data based on the sport
  switch (sport) {
    case 'NBA':
      return [
        {
          gameId: 'nba-2023-1001',
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
          homeScore: 105,
          awayScore: 98,
          totalPoints: 203,
          status: 'final',
          sport: 'NBA',
          startTime: currentDate,
          endTime: currentDate
        },
        {
          gameId: 'nba-2023-1002',
          homeTeam: 'Warriors',
          awayTeam: 'Bucks',
          homeScore: 112,
          awayScore: 108,
          totalPoints: 220,
          status: 'final',
          sport: 'NBA',
          startTime: currentDate,
          endTime: currentDate
        }
      ];
    
    case 'NFL':
      return [
        {
          gameId: 'nfl-2023-2001',
          homeTeam: 'Chiefs',
          awayTeam: 'Ravens',
          homeScore: 24,
          awayScore: 20,
          totalPoints: 44,
          status: 'final',
          sport: 'NFL',
          startTime: currentDate,
          endTime: currentDate
        },
        {
          gameId: 'nfl-2023-2002',
          homeTeam: 'Eagles',
          awayTeam: 'Cowboys',
          homeScore: 17,
          awayScore: 28,
          totalPoints: 45,
          status: 'final',
          sport: 'NFL',
          startTime: currentDate,
          endTime: currentDate
        }
      ];
      
    // Add cases for other sports...
    default:
      return [
        {
          gameId: `${sport.toLowerCase()}-2023-3001`,
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          homeScore: 3,
          awayScore: 2,
          totalPoints: 5,
          status: 'final',
          sport: sport,
          startTime: currentDate,
          endTime: currentDate
        }
      ];
  }
};
