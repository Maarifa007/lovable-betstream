
import { toast } from "@/hooks/use-toast";

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
 * Fetch market data with fallback support
 * @param sport The sport to fetch market data for
 * @returns Promise that resolves to market data array
 */
export const fetchMarketData = async (sport: string) => {
  try {
    // Try primary API first
    console.log(`🔄 Fetching market data for ${sport} from primary API...`);
    const response = await fetch(`${API_BASE_URL}/api/markets/${sport}`);
    if (!response.ok) throw new Error(`Primary API failed with status: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid response format from primary API');
    
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
      const fallbackResponse = await fetch(`${API_BASE_URL}/api/backup-markets/${sport}`);
      if (!fallbackResponse.ok) throw new Error(`Backup API failed with status: ${fallbackResponse.status}`);

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
    
    // Define the admin notification endpoint with the proper API base URL
    const notificationEndpoint = `${API_BASE_URL}/api/admin/notify-exposure`;
    
    // In a real implementation, this would call an API endpoint to send an email
    const response = await fetch(notificationEndpoint, {
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
    
    // Show a toast notification when admin alert is sent
    toast({
      title: "Admin Alert Sent",
      description: `Notified administrators about high exposure (${exposureAmount.toLocaleString()}) on market ID ${marketId}`,
      variant: "default",
    });
    
    console.log(`✅ Admin notification sent successfully for market ID ${marketId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to notify admin:", error);
    
    // Show error toast
    toast({
      title: "Notification Failed",
      description: "Unable to send high exposure alert to administrators",
      variant: "destructive",
    });
    
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

/**
 * Adjust spreads for a market based on current exposure
 * @param marketId ID of the market to adjust
 * @param currentExposure Current exposure amount 
 * @returns Promise resolving to boolean indicating success
 */
export const adjustMarketSpreads = async (marketId: string | number, currentExposure: number) => {
  try {
    const { level } = calculateSpreadMultiplier(currentExposure);
    
    console.log(`🔄 Adjusting spreads for market ID ${marketId} with exposure level: ${level}`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin-adjust-spreads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        exposureLevel: level,
        exposureAmount: currentExposure
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully adjusted spreads for market ID ${marketId}`);
      
      // Show success toast
      toast({
        title: "Spreads Adjusted",
        description: `Market spreads updated based on ${level} exposure level`,
      });
      
      return true;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error("❌ Failed to adjust market spreads:", error);
    
    // Show error toast
    toast({
      title: "Spread Adjustment Failed",
      description: "Unable to adjust market spreads at this time",
      variant: "destructive",
    });
    
    return false;
  }
};

/**
 * Fetch historical exposure data for reporting
 * @param dateRange Time range for the report 
 * @returns Promise resolving to historical exposure data
 */
export const fetchHistoricalExposure = async (dateRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
  try {
    console.log(`🔄 Fetching historical exposure data for time range: ${dateRange}`);
    
    const response = await fetch(`${API_BASE_URL}/api/historical-exposure?range=${dateRange}`);
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched historical exposure data`);
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch historical exposure data:", error);
    
    // Show error toast
    toast({
      title: "Data Fetch Failed",
      description: "Unable to load historical exposure data. Using sample data.",
      variant: "destructive",
    });
    
    // Return placeholder data
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Football",
          data: [45000, 52000, 49000, 60000, 72000, 56000, 58000],
        },
        {
          label: "Basketball",
          data: [35000, 42000, 45000, 48000, 62000, 50000, 48000],
        }
      ]
    };
  }
};

/**
 * Send email alerts to admins about important events
 * @param subject Alert subject
 * @param message Alert message content
 * @param recipients Array of email addresses
 * @returns Promise resolving to boolean indicating success
 */
export const sendAdminAlert = async (
  subject: string,
  message: string, 
  recipients: string[] = ["admin@yourbettingapp.com"]
) => {
  try {
    console.log(`🔄 Sending admin alert: ${subject}`);
    
    const response = await fetch(`${API_BASE_URL}/api/send-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        message,
        recipients
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error sending alert');
    }
    
    console.log(`✅ Successfully sent admin alert`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send admin alert:", error);
    return false;
  }
};
