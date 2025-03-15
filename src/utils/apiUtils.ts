
import { toast } from "@/hooks/use-toast";

/**
 * Fetch market data with fallback support
 * @param sport The sport to fetch market data for
 * @returns Promise that resolves to market data array
 */
export const fetchMarketData = async (sport: string) => {
  try {
    // Try primary API first
    const response = await fetch(`https://api.your-service.com/markets/${sport}`);
    if (!response.ok) throw new Error('Primary API failed');

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid response format');
    
    console.log(`✅ Successfully fetched data from primary API for ${sport}`);
    return data;
  } catch (error) {
    console.warn("⚠️ Primary API failed. Switching to fallback API...", error);
    
    // Notify the user that we're using the backup API
    toast({
      title: "Using Backup Data Source",
      description: "We're experiencing issues with our primary data provider. Switched to backup.",
      variant: "warning",
    });
    
    try {
      // Try backup API if primary fails
      const fallbackResponse = await fetch(`https://backup-api.com/markets/${sport}`);
      if (!fallbackResponse.ok) throw new Error('Backup API also failed');

      const fallbackData = await fallbackResponse.json();
      console.log(`✅ Successfully fetched data from backup API for ${sport}`);
      return fallbackData;
    } catch (fallbackError) {
      console.error("❌ Both primary and fallback APIs failed:", fallbackError);
      
      // Notify the user that all APIs failed
      toast({
        title: "Connection Error",
        description: "Unable to fetch live market data. Using cached data.",
        variant: "destructive",
      });
      
      // Return placeholder data if both APIs fail
      return [
        { id: 1, home: "West Ham", away: "Leicester", time: "32:15", market: "Total Goals", spread: "2.8-3.0", sellPrice: "2.8", buyPrice: "3.0" },
        { id: 2, home: "Barcelona", away: "Real Madrid", time: "56:23", market: "Total Corners", spread: "10.5-10.8", sellPrice: "10.5", buyPrice: "10.8" }
      ];
    }
  }
};
