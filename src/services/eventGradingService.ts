
import { toast } from "@/hooks/use-toast";
import { getUserBets, updateBet } from "@/utils/betUtils";
import { GameResult } from "@/services/sportsDataService";
import { sendAdminAlert } from "@/utils/apiUtils";

// Types for position grading
export interface Position {
  id: string;
  matchId: number | string;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  makeupLimit: number;
  status: 'open' | 'settled' | 'cancelled';
  finalResult?: number;
  profitLoss?: number;
  collateralHeld: number;
  timestamp: number;
  userId: string;
}

export interface GradingResult {
  positionId: string;
  originalPosition: Position;
  updatedPosition: Position;
  profitLoss: number;
  collateralReleased: number;
  success: boolean;
  message?: string;
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
 * Grade a single position based on the final result
 * @param position The position to grade
 * @param finalResult The final result value
 * @returns Grading result with updated position and P/L
 */
export const gradePosition = (position: Position, finalResult: number): GradingResult => {
  // Skip if already settled
  if (position.status !== 'open') {
    return {
      positionId: position.id,
      originalPosition: position,
      updatedPosition: position,
      profitLoss: 0,
      collateralReleased: 0,
      success: false,
      message: 'Position already settled or cancelled'
    };
  }

  // Calculate profit/loss
  let profitLoss = 0;
  if (position.betType === 'buy') {
    profitLoss = (finalResult - position.betPrice) * position.stakePerPoint;
  } else { // sell
    profitLoss = (position.betPrice - finalResult) * position.stakePerPoint;
  }

  // Cap losses at the collateral held
  const cappedProfitLoss = Math.max(profitLoss, -position.collateralHeld);
  
  // Calculate collateral to release (held amount minus losses, or all if profitable)
  const collateralReleased = profitLoss >= 0 
    ? position.collateralHeld 
    : position.collateralHeld + cappedProfitLoss; // Add negative value

  // Create updated position
  const updatedPosition: Position = {
    ...position,
    status: 'settled',
    finalResult,
    profitLoss: cappedProfitLoss
  };

  return {
    positionId: position.id,
    originalPosition: position,
    updatedPosition,
    profitLoss: cappedProfitLoss,
    collateralReleased,
    success: true
  };
};

/**
 * Grade all open positions for a specific event
 * @param eventId The ID of the event to grade positions for
 * @param finalResult The final result value
 * @returns Array of grading results
 */
export const gradeEventPositions = async (
  eventId: number | string,
  finalResult: number
): Promise<GradingResult[]> => {
  try {
    console.log(`🔄 Grading positions for event ID ${eventId} with result ${finalResult}`);
    
    // Get all user bets from storage
    const allBets = getUserBets();
    
    // Filter for open positions matching this event
    const openPositions = allBets.filter(
      bet => bet.matchId.toString() === eventId.toString() && bet.status === 'open'
    ) as unknown as Position[];
    
    // Skip if no open positions found
    if (openPositions.length === 0) {
      console.log(`No open positions found for event ID ${eventId}`);
      return [];
    }
    
    // Grade each position
    const gradingResults: GradingResult[] = [];
    
    for (const position of openPositions) {
      const result = gradePosition(position, finalResult);
      gradingResults.push(result);
      
      // Save the updated position if successful
      if (result.success) {
        updateBet(result.positionId, result.updatedPosition);
      }
    }
    
    console.log(`✅ Successfully graded ${gradingResults.length} positions for event ID ${eventId}`);
    
    return gradingResults;
  } catch (error) {
    console.error(`❌ Failed to grade positions for event ID ${eventId}:`, error);
    
    // Report the error to administrators
    sendAdminAlert(
      'Position Grading Error',
      `Failed to grade positions for event ID ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
      ['admin@yourbettingapp.com']
    ).catch(console.error);
    
    return [];
  }
};

/**
 * Settle all positions from a specific event and update user balances
 * @param eventId The ID of the event to settle positions for
 * @param finalResult The final result value
 * @returns Promise resolving to boolean indicating success
 */
export const settleEventPositions = async (
  eventId: number | string,
  finalResult: number
): Promise<boolean> => {
  try {
    console.log(`🔄 Settling positions for event ID ${eventId}`);
    
    // Grade all positions for this event
    const gradingResults = await gradeEventPositions(eventId, finalResult);
    
    if (gradingResults.length === 0) {
      console.log(`No positions to settle for event ID ${eventId}`);
      return true;
    }
    
    // Call the API to settle positions and update user balances
    const response = await fetch(`${API_BASE_URL}/api/settle-positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        gradingResults,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error settling positions');
    }
    
    console.log(`✅ Successfully settled ${gradingResults.length} positions for event ID ${eventId}`);
    
    // Notify users of settlement
    toast({
      title: "Positions Settled",
      description: `Event ${eventId} has been graded and positions settled.`,
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to settle positions for event ID ${eventId}:`, error);
    
    // Report the error to administrators
    sendAdminAlert(
      'Position Settlement Error',
      `Failed to settle positions for event ID ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
      ['admin@yourbettingapp.com']
    ).catch(console.error);
    
    // Show error toast
    toast({
      title: "Settlement Error",
      description: "Failed to settle positions. Our team has been notified.",
      variant: "destructive",
    });
    
    return false;
  }
};

/**
 * Unlock collateral for a user position and update user balance
 * @param positionId The ID of the position to unlock collateral for
 * @param amount The amount of collateral to unlock
 * @returns Promise resolving to boolean indicating success
 */
export const unlockCollateral = async (
  positionId: string,
  amount: number
): Promise<boolean> => {
  try {
    console.log(`🔄 Unlocking ${amount} collateral for position ${positionId}`);
    
    // Call the API to unlock collateral and update user balance
    const response = await fetch(`${API_BASE_URL}/api/unlock-collateral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        positionId,
        amount,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error unlocking collateral');
    }
    
    console.log(`✅ Successfully unlocked ${amount} collateral for position ${positionId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to unlock collateral for position ${positionId}:`, error);
    return false;
  }
};

/**
 * Check for recently finished events and initiate the grading process
 * @returns Promise resolving to an array of events that were graded
 */
export const checkAndGradeFinishedEvents = async (): Promise<string[]> => {
  try {
    console.log('🔄 Checking for recently finished events...');
    
    // Call the API to fetch recently finished events
    const response = await fetch(`${API_BASE_URL}/api/finished-events`);
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const events = await response.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      console.log('No recently finished events found');
      return [];
    }
    
    console.log(`Found ${events.length} recently finished events`);
    
    // Grade each finished event
    const gradedEvents: string[] = [];
    
    for (const event of events) {
      const { eventId, finalResult } = event;
      
      // Grade and settle positions for this event
      const success = await settleEventPositions(eventId, finalResult);
      
      if (success) {
        gradedEvents.push(eventId);
      }
    }
    
    console.log(`✅ Successfully graded ${gradedEvents.length} events`);
    return gradedEvents;
  } catch (error) {
    console.error('❌ Failed to check and grade finished events:', error);
    
    // Report the error to administrators
    sendAdminAlert(
      'Event Grading Error',
      `Failed to check and grade finished events: ${error instanceof Error ? error.message : String(error)}`,
      ['admin@yourbettingapp.com']
    ).catch(console.error);
    
    return [];
  }
};

/**
 * Set up the scheduled grading task to run at intervals
 * @param intervalMinutes How often to run the task, in minutes
 * @returns The interval ID, which can be used to clear the interval
 */
export const setupScheduledGrading = (intervalMinutes: number = 15): number => {
  console.log(`Setting up scheduled grading task to run every ${intervalMinutes} minutes`);
  
  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Set up the interval
  const intervalId = window.setInterval(async () => {
    console.log('Running scheduled grading task...');
    await checkAndGradeFinishedEvents();
  }, intervalMs);
  
  // Run once immediately
  checkAndGradeFinishedEvents().catch(console.error);
  
  return intervalId;
};
