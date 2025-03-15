
import { toast } from "@/hooks/use-toast";

/**
 * Fetch market data with fallback support
 * @param sport The sport to fetch market data for
 * @returns Promise that resolves to market data array
 */
export const fetchMarketData = async (sport: string) => {
  try {
    // Try primary API first
    console.log(`🔄 Fetching market data for ${sport} from primary API...`);
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
      console.log(`🔄 Trying backup API for ${sport}...`);
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

/**
 * Send email to admin about high exposure
 * @param marketId The market ID with high exposure
 * @param exposureAmount The current exposure amount
 * @param market Details about the market for context
 */
export const notifyAdminOfHighExposure = async (marketId: number, exposureAmount: number, market: any) => {
  try {
    console.log(`🚨 Sending high exposure alert to admin for market ID ${marketId}`);
    
    // In a real implementation, this would call an API endpoint to send an email
    const response = await fetch('/api/admin/notify-exposure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        exposureAmount,
        marketDetails: market,
        timestamp: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send admin notification');
    }
    
    console.log(`✅ Admin notification sent successfully for market ID ${marketId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to notify admin:", error);
    
    // In case of failure, we still want the app to continue working
    // This is a non-critical operation
    return false;
  }
};

/**
 * Calculate the appropriate spread multiplier based on exposure level
 * @param exposureAmount The current exposure amount
 * @param baseThreshold The base threshold for medium exposure
 * @param highThreshold The threshold for high exposure
 * @returns Spread multiplier (1.0, 1.25, or 1.5)
 */
export const calculateSpreadMultiplier = (
  exposureAmount: number, 
  baseThreshold = 50000, 
  highThreshold = 75000
): { multiplier: number, level: 'normal' | 'medium' | 'high' } => {
  if (exposureAmount <= baseThreshold) {
    return { multiplier: 1.0, level: 'normal' };
  } else if (exposureAmount <= highThreshold) {
    return { multiplier: 1.25, level: 'medium' }; // 25% increase
  } else {
    return { multiplier: 1.5, level: 'high' }; // 50% increase
  }
};
