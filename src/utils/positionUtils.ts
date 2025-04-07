
import { getUserAccount, getUserBets, saveUserAccount, saveBets, AccountType } from "@/utils/betUtils";

interface PositionCloseResult {
  success: boolean;
  positionId?: string;
  profitLoss?: number;
  message?: string;
  collateralReleased?: number;
  newStatus?: 'open' | 'partially_closed' | 'settled';
  remainingStake?: number;
  closedStake?: number;
}

/**
 * Close a position fully or partially
 */
export const closePosition = (
  userId: string,
  matchNameOrId: string,
  percentage: number,
  currentPrice: number
): PositionCloseResult => {
  try {
    // Get user bets
    const bets = getUserBets();
    
    // Find matching bet by match name or ID
    const bet = bets.find(b => {
      if (b.matchId.toString() === matchNameOrId.toString()) return true;
      if (b.matchName?.toLowerCase().includes(matchNameOrId.toLowerCase())) return true;
      return false;
    });
    
    if (!bet) {
      return { 
        success: false,
        message: `No position found matching "${matchNameOrId}"`
      };
    }
    
    if (bet.status !== 'open' && bet.status !== 'partially_closed') {
      return {
        success: false,
        message: `Position for "${matchNameOrId}" is already ${bet.status}`
      };
    }
    
    // Calculate what portion of the stake is being closed
    const closingRatio = percentage / 100;
    const stakeOpen = bet.stakeOpen || bet.stakePerPoint;
    const stakeToBeClosed = stakeOpen * closingRatio;
    const stakeRemaining = stakeOpen - stakeToBeClosed;
    
    // Calculate P/L for the closed portion
    let profitLoss = 0;
    if (bet.betType === 'buy') {
      profitLoss = (currentPrice - bet.betPrice) * stakeToBeClosed;
    } else { // sell
      profitLoss = (bet.betPrice - currentPrice) * stakeToBeClosed;
    }
    
    // If there's a makeup limit, cap the loss
    if (bet.makeupLimit && profitLoss < 0) {
      const maxLoss = stakeToBeClosed * bet.makeupLimit;
      profitLoss = Math.max(profitLoss, -maxLoss);
    }
    
    // Calculate collateral to release
    const collateralPerPoint = bet.makeupLimit || 0;
    const collateralToRelease = stakeToBeClosed * collateralPerPoint;
    
    // Calculate new collateral based on remaining stake
    const newCollateralHeld = stakeRemaining * collateralPerPoint;
    
    // Update the position
    const updatedBet = {
      ...bet,
      status: stakeRemaining > 0 ? 'partially_closed' as const : 'settled' as const,
      stakeOpen: stakeRemaining,
      stakeClosed: (bet.stakeClosed || 0) + stakeToBeClosed,
      profitLoss: (bet.profitLoss || 0) + profitLoss,
      collateralHeld: newCollateralHeld,
      currentPrice
    };
    
    // Update the position in storage
    const updatedBets = bets.map(b => b.id === bet.id ? updatedBet : b);
    saveBets(updatedBets);
    
    // Update user account balance
    const account = getUserAccount(userId);
    const totalAmountToReturn = profitLoss + collateralToRelease;
    
    if (account.accountType === 'free') {
      account.virtualBalance += totalAmountToReturn;
    } else {
      account.walletBalance += totalAmountToReturn;
    }
    
    saveUserAccount(account);
    
    return {
      success: true,
      positionId: bet.id,
      profitLoss,
      collateralReleased: collateralToRelease,
      newStatus: updatedBet.status,
      remainingStake: stakeRemaining,
      closedStake: stakeToBeClosed,
      message: `Position ${percentage === 100 ? 'fully' : `${percentage}%`} closed successfully`
    };
  } catch (error) {
    console.error("Error closing position:", error);
    return {
      success: false,
      message: `Error closing position: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Place a new bet and update user account
 */
export const placeBet = (
  userId: string,
  match: string,
  betType: 'buy' | 'sell',
  price: number,
  stakePerPoint: number,
  makeupLimit: number = 20
): { success: boolean; betId?: string; message?: string } => {
  try {
    // Get user account
    const account = getUserAccount(userId);
    
    // Calculate collateral required
    const collateralRequired = stakePerPoint * makeupLimit;
    
    // Check if user has enough balance
    const userBalance = account.accountType === 'free' ? account.virtualBalance : account.walletBalance;
    
    if (userBalance < collateralRequired) {
      return {
        success: false,
        message: `Insufficient balance. Required: ${collateralRequired}, Available: ${userBalance}`
      };
    }
    
    // Create new bet
    const newBet = {
      id: `bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      matchId: Math.floor(Math.random() * 10000),
      matchName: match,
      market: `${match} Spread`,
      betType,
      betPrice: price,
      stakePerPoint,
      makeupLimit,
      status: 'open' as const,
      timestamp: Date.now(),
      collateralHeld: collateralRequired,
      userId,
      accountType: account.accountType
    };
    
    // Update user balance
    if (account.accountType === 'free') {
      account.virtualBalance -= collateralRequired;
    } else {
      account.walletBalance -= collateralRequired;
    }
    
    // Increment bets placed
    account.betsPlaced += 1;
    
    // Save account
    saveUserAccount(account);
    
    // Add bet to storage
    const bets = getUserBets();
    saveBets([...bets, newBet]);
    
    return {
      success: true,
      betId: newBet.id,
      message: `${betType === 'buy' ? 'Buy' : 'Sell'} position opened successfully`
    };
  } catch (error) {
    console.error("Error placing bet:", error);
    return {
      success: false,
      message: `Error placing bet: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Check if user should be prompted to upgrade to cash account
 */
export const shouldPromptUpgrade = (userId: string): boolean => {
  const account = getUserAccount(userId);
  
  // Already using cash account
  if (account.accountType === 'cash') {
    return false;
  }
  
  // Check if they've placed enough bets
  if (account.betsPlaced >= 3) {
    return true;
  }
  
  // Check if they've won enough virtual points
  if (account.virtualBalance > 1500) { // Starting balance is 1000
    return true;
  }
  
  return false;
};

/**
 * Convert a free account to a cash account
 */
export const upgradeToRealMoneyAccount = (
  userId: string,
  walletAddress: string
): { success: boolean; message?: string } => {
  try {
    const account = getUserAccount(userId);
    
    if (account.accountType === 'cash') {
      return {
        success: false,
        message: 'Account is already in cash mode'
      };
    }
    
    // Update account type
    account.accountType = 'cash';
    account.walletAddress = walletAddress;
    account.walletConnectedAt = Date.now();
    
    // Add bonus for upgrading (in a real app)
    account.walletBalance = 50; // $50 bonus for demo
    
    // Save updated account
    saveUserAccount(account);
    
    return {
      success: true,
      message: 'Account upgraded to cash mode with $50 bonus'
    };
  } catch (error) {
    console.error("Error upgrading account:", error);
    return {
      success: false,
      message: `Error upgrading account: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
