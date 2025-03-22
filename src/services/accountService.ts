
import { toast } from "@/hooks/use-toast";
import WebSocketService from "@/services/webSocketService";

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
 * Lock collateral when a user places a bet
 * @param userId The user's ID
 * @param amount The amount to lock
 * @param positionId The ID of the position
 * @returns Promise resolving to boolean indicating success
 */
export const lockCollateral = async (
  userId: string,
  amount: number,
  positionId: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Locking ${amount} collateral for user ${userId} on position ${positionId}`);
    
    // Call the API to lock collateral
    const response = await fetch(`${API_BASE_URL}/api/lock-collateral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        positionId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error locking collateral');
    }
    
    console.log(`✅ Successfully locked ${amount} collateral for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to lock collateral for user ${userId}:`, error);
    
    // Show error toast
    toast({
      title: "Collateral Error",
      description: "Failed to lock collateral for your position.",
      variant: "destructive",
    });
    
    return false;
  }
};

/**
 * Release collateral when a position is settled or cancelled
 * @param userId The user's ID
 * @param amount The amount to release
 * @param positionId The ID of the position
 * @returns Promise resolving to boolean indicating success
 */
export const releaseCollateral = async (
  userId: string,
  amount: number,
  positionId: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Releasing ${amount} collateral for user ${userId} on position ${positionId}`);
    
    // Call the API to release collateral
    const response = await fetch(`${API_BASE_URL}/api/release-collateral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        positionId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error releasing collateral');
    }
    
    console.log(`✅ Successfully released ${amount} collateral for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to release collateral for user ${userId}:`, error);
    return false;
  }
};

/**
 * Update user balance after position settlement
 * @param userId The user's ID
 * @param amount The amount to add to the user's balance (can be negative)
 * @param positionId The ID of the position
 * @param webSocketService Optional WebSocketService instance for live balance updates
 * @returns Promise resolving to boolean indicating success
 */
export const updateUserBalance = async (
  userId: string,
  amount: number,
  positionId: string,
  webSocketService?: WebSocketService
): Promise<boolean> => {
  try {
    console.log(`🔄 Updating balance for user ${userId} by ${amount} from position ${positionId}`);
    
    // Call the API to update the user's balance
    const response = await fetch(`${API_BASE_URL}/api/update-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        positionId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error updating balance');
    }
    
    console.log(`✅ Successfully updated balance for user ${userId} by ${amount}`);
    
    // If WebSocketService is provided, simulate a balance update to refresh the UI
    if (webSocketService && result.newBalance) {
      webSocketService.simulateBalanceUpdate(userId, result.newBalance);
    }
    
    // Show a toast notification for significant balance changes
    if (Math.abs(amount) >= 100) {
      toast({
        title: amount >= 0 ? "Balance Increased" : "Balance Decreased",
        description: `Your account ${amount >= 0 ? 'gained' : 'lost'} $${Math.abs(amount).toLocaleString()} from a settled position.`,
        variant: amount >= 0 ? "default" : "destructive",
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to update balance for user ${userId}:`, error);
    
    // Show error toast
    toast({
      title: "Balance Update Error",
      description: "Failed to update your balance. Please contact support.",
      variant: "destructive",
    });
    
    return false;
  }
};

/**
 * Calculate the required collateral for a position based on stake and multiplier
 * @param stakePerPoint The stake per point
 * @param multiplier The risk multiplier
 * @returns The required collateral amount
 */
export const calculateRequiredCollateral = (
  stakePerPoint: number,
  multiplier: number
): number => {
  return stakePerPoint * multiplier;
};

/**
 * Check if a user has sufficient balance for a position
 * @param userId The user's ID
 * @param requiredAmount The required balance amount
 * @returns Promise resolving to boolean indicating if user has sufficient balance
 */
export const hasSufficientBalance = async (
  userId: string,
  requiredAmount: number
): Promise<boolean> => {
  try {
    // Call the API to check the user's balance
    const response = await fetch(`${API_BASE_URL}/api/check-balance?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error checking balance');
    }
    
    const hasEnough = result.balance >= requiredAmount;
    console.log(`User ${userId} balance check: ${result.balance} >= ${requiredAmount} = ${hasEnough}`);
    
    return hasEnough;
  } catch (error) {
    console.error(`❌ Failed to check balance for user ${userId}:`, error);
    
    // Assume insufficient balance on error to be safe
    return false;
  }
};
