interface Bet {
  id: string;
  matchId: number | string;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  makeupLimit?: number;
  status: 'open' | 'settled' | 'cancelled' | 'partially_closed';
  finalResult?: number;
  profitLoss?: number;
  timestamp: number;
  collateralHeld?: number;
  userId?: string;
  matchName?: string;
  stakeOpen?: number;  // Amount still live
  stakeClosed?: number; // Amount already settled
  currentPrice?: number; // Last known price for the market
  accountType?: 'free' | 'cash'; // Track bet account type
}

// User account type
export type AccountType = 'free' | 'cash';

// User account interface to store account information
export interface UserAccount {
  userId: string;
  accountType: AccountType;
  virtualBalance: number;  // For Free accounts
  walletBalance: number;   // For Cash accounts (USDC)
  walletAddress?: string;  // Only for Cash accounts
  betsPlaced: number;
  walletConnectedAt?: number;
  conversionDate?: number;
  isSweepstakesEligible: boolean;
  lastPromptDate?: number; // To track when we last prompted for conversion
}

// Get user account from localStorage or create a new one with default values
export const getUserAccount = (userId: string): UserAccount => {
  const account = localStorage.getItem(`userAccount_${userId}`);
  if (account) {
    return JSON.parse(account);
  }
  
  // Default to free account with 1000 virtual points
  return {
    userId,
    accountType: 'free',
    virtualBalance: 1000,
    walletBalance: 0,
    betsPlaced: 0,
    isSweepstakesEligible: true
  };
};

// Save user account to localStorage
export const saveUserAccount = (account: UserAccount): void => {
  localStorage.setItem(`userAccount_${account.userId}`, JSON.stringify(account));
};

// Check if user should be prompted to upgrade to cash account
export const shouldPromptUpgrade = (account: UserAccount): { should: boolean, message?: string } => {
  if (account.accountType === 'cash') {
    return { should: false };
  }
  
  // Don't prompt too frequently (once per 24 hours)
  const lastPrompt = account.lastPromptDate || 0;
  const hoursSinceLastPrompt = (Date.now() - lastPrompt) / (1000 * 60 * 60);
  if (hoursSinceLastPrompt < 24) {
    return { should: false };
  }
  
  // Trigger: 3+ bets placed
  if (account.betsPlaced >= 3) {
    return { 
      should: true,
      message: "Ready to go pro? Connect a wallet and play for real!"
    };
  }
  
  // Trigger: Win 100+ virtual points (check if virtual balance > initial 1000)
  if (account.virtualBalance > 1100) {
    return { 
      should: true,
      message: "You've earned a bonus! Unlock real cash play by upgrading."
    };
  }
  
  // Trigger: Time-based - if account exists for over 2 days
  const accountCreatedTime = account.conversionDate || 0;
  const daysSinceCreation = (Date.now() - accountCreatedTime) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > 2) {
    return { 
      should: true,
      message: "Free mode is fun, but real payouts await in cash mode. Switch now!"
    };
  }
  
  return { should: false };
};

// Update user account when prompted about upgrade (to avoid prompting too often)
export const markUpgradePrompt = (account: UserAccount): UserAccount => {
  const updatedAccount = { 
    ...account,
    lastPromptDate: Date.now()
  };
  saveUserAccount(updatedAccount);
  return updatedAccount;
};

// Convert free account to cash account
export const convertToCashAccount = (account: UserAccount, walletAddress: string): UserAccount => {
  if (account.accountType === 'cash') {
    return account;
  }
  
  const updatedAccount = {
    ...account,
    accountType: 'cash' as AccountType,
    walletAddress,
    walletConnectedAt: Date.now(),
    conversionDate: Date.now()
  };
  
  saveUserAccount(updatedAccount);
  return updatedAccount;
};

// Update the bet placing logic to increment bets placed
export const placeBet = (bet: Omit<Bet, 'id' | 'status' | 'timestamp'>, userId: string): Bet => {
  const newBet: Bet = {
    ...bet,
    id: `bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'open',
    timestamp: Date.now(),
    userId
  };
  
  // Get user account
  const account = getUserAccount(userId);
  
  // Set the account type on the bet
  newBet.accountType = account.accountType;
  
  // Increment bets placed
  account.betsPlaced += 1;
  
  // Update user balance based on account type
  if (account.accountType === 'free') {
    account.virtualBalance -= (newBet.collateralHeld || 0);
  } else {
    account.walletBalance -= (newBet.collateralHeld || 0);
  }
  
  saveUserAccount(account);
  
  // Save the bet
  const bets = getUserBets();
  const updatedBets = [...bets, newBet];
  saveBets(updatedBets);
  
  return newBet;
};

// Modify settlement logic to handle both account types
export const settleAccountBet = (bet: Bet, finalResult: number, userId: string): { bet: Bet, account: UserAccount } => {
  const updatedBet = settleBet(bet, finalResult);
  const account = getUserAccount(userId);
  
  // Update user balance based on account type and bet result
  if (updatedBet.profitLoss) {
    if (account.accountType === 'free') {
      account.virtualBalance += updatedBet.profitLoss;
      // Also return collateral
      if (updatedBet.collateralHeld) {
        account.virtualBalance += updatedBet.collateralHeld;
      }
    } else {
      account.walletBalance += updatedBet.profitLoss;
      // Also return collateral
      if (updatedBet.collateralHeld) {
        account.walletBalance += updatedBet.collateralHeld;
      }
    }
    
    saveUserAccount(account);
  }
  
  return { bet: updatedBet, account };
};

/**
 * Calculate profit/loss based on bet type and final result
 * 
 * For Buy bets: (Actual Result - Bet Price) * Stake Per Point
 * For Sell bets: (Bet Price - Actual Result) * Stake Per Point
 */
export const calculateProfitLoss = (bet: Bet, finalResult: number): number => {
  if (bet.betType === 'buy') {
    return (finalResult - bet.betPrice) * bet.stakePerPoint;
  } else {
    return (bet.betPrice - finalResult) * bet.stakePerPoint;
  }
};

/**
 * Settle a bet with the final result
 */
export const settleBet = (bet: Bet, finalResult: number): Bet => {
  const profitLoss = calculateProfitLoss(bet, finalResult);
  
  // If bet has a makeup limit, cap the loss at the collateral held
  const cappedProfitLoss = bet.makeupLimit && bet.collateralHeld && profitLoss < 0
    ? Math.max(profitLoss, -(bet.collateralHeld))
    : profitLoss;
  
  return {
    ...bet,
    status: 'settled',
    finalResult,
    profitLoss: cappedProfitLoss
  };
};

/**
 * Get user bets from localStorage
 */
export const getUserBets = (): Bet[] => {
  return JSON.parse(localStorage.getItem('userBets') || '[]');
};

/**
 * Save bets to localStorage
 */
export const saveBets = (bets: Bet[]): void => {
  localStorage.setItem('userBets', JSON.stringify(bets));
};

/**
 * Update a specific bet
 */
export const updateBet = (betId: string, updatedBet: Partial<Bet>): Bet[] => {
  const bets = getUserBets();
  const updatedBets = bets.map(bet => 
    bet.id === betId ? { ...bet, ...updatedBet } : bet
  );
  saveBets(updatedBets);
  return updatedBets;
};

/**
 * Settle all open bets for a specific match
 */
export const settleMatchBets = (matchId: number | string, finalResult: number): Bet[] => {
  const bets = getUserBets();
  const updatedBets = bets.map(bet => {
    if (bet.matchId.toString() === matchId.toString() && bet.status === 'open') {
      return settleBet(bet, finalResult);
    }
    return bet;
  });
  saveBets(updatedBets);
  return updatedBets;
};

/**
 * Get collateral required for a bet based on stake and multiplier
 */
export const getRequiredCollateral = (stakePerPoint: number, multiplier: number): number => {
  return stakePerPoint * multiplier;
};

/**
 * Get all bets for a specific match
 */
export const getMatchBets = (matchId: number | string): Bet[] => {
  const bets = getUserBets();
  return bets.filter(bet => bet.matchId.toString() === matchId.toString());
};

/**
 * Get all open bets
 */
export const getOpenBets = (): Bet[] => {
  const bets = getUserBets();
  return bets.filter(bet => bet.status === 'open' || bet.status === 'partially_closed');
};

/**
 * Get all settled bets
 */
export const getSettledBets = (): Bet[] => {
  const bets = getUserBets();
  return bets.filter(bet => bet.status === 'settled');
};

/**
 * Calculate total collateral locked across all open bets
 */
export const getTotalLockedCollateral = (): number => {
  const openBets = getOpenBets();
  return openBets.reduce((total, bet) => total + (bet.collateralHeld || 0), 0);
};

/**
 * Calculate total profit/loss across all settled bets
 */
export const getTotalProfitLoss = (): Bet[] => {
  const settledBets = getSettledBets();
  return settledBets;
};

/**
 * Remove a bet from storage
 */
export const removeBet = (betId: string): void => {
  const bets = getUserBets();
  const updatedBets = bets.filter(bet => bet.id !== betId);
  saveBets(updatedBets);
};

/**
 * Cancel an open bet - this would release collateral in a real implementation
 */
export const cancelBet = (betId: string): Bet[] => {
  const bets = getUserBets();
  const updatedBets = bets.map(bet => 
    bet.id === betId && bet.status === 'open' 
      ? { ...bet, status: 'cancelled' as const } 
      : bet
  );
  saveBets(updatedBets);
  return updatedBets;
};

/**
 * Partially close a position - closes a portion of the stake and recalculates collateral
 * @param betId ID of the bet to partially close
 * @param percentToClose Percentage of the position to close (0-100)
 * @param currentPrice Current market price for settlement
 * @returns Updated bets array
 */
export const partiallyCloseBet = (
  betId: string, 
  percentToClose: number, 
  currentPrice: number
): Bet[] => {
  if (percentToClose <= 0 || percentToClose > 100) {
    throw new Error("Percentage to close must be between 1 and 100");
  }
  
  const bets = getUserBets();
  const betIndex = bets.findIndex(bet => bet.id === betId);
  
  if (betIndex === -1) {
    throw new Error(`Bet with ID ${betId} not found`);
  }
  
  const bet = bets[betIndex];
  
  if (bet.status !== 'open' && bet.status !== 'partially_closed') {
    throw new Error(`Cannot close a bet with status: ${bet.status}`);
  }
  
  // Calculate what portion of the stake is being closed
  const closingRatio = percentToClose / 100;
  const stakeToBeClosed = bet.stakeOpen ? bet.stakeOpen * closingRatio : bet.stakePerPoint * closingRatio;
  const stakeRemaining = bet.stakeOpen ? bet.stakeOpen - stakeToBeClosed : bet.stakePerPoint - stakeToBeClosed;
  
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
  
  // Calculate new collateral based on remaining stake
  const newCollateralHeld = bet.makeupLimit ? stakeRemaining * bet.makeupLimit : 0;
  
  // Update the bet
  const updatedBet: Bet = {
    ...bet,
    status: stakeRemaining > 0 ? 'partially_closed' : 'settled',
    stakeOpen: stakeRemaining,
    stakeClosed: (bet.stakeClosed || 0) + stakeToBeClosed,
    profitLoss: (bet.profitLoss || 0) + profitLoss,
    collateralHeld: newCollateralHeld,
    currentPrice
  };
  
  bets[betIndex] = updatedBet;
  saveBets(bets);
  
  return bets;
};

/**
 * Fully close a position at the current market price
 * @param betId ID of the bet to close
 * @param currentPrice Current market price for settlement
 * @returns Updated bets array
 */
export const fullyCloseBet = (betId: string, currentPrice: number): Bet[] => {
  return partiallyCloseBet(betId, 100, currentPrice);
};

/**
 * Find a bet by name or description
 * @param searchTerm Search term to match against bet name or market
 * @returns Array of matching bets
 */
export const findBetByName = (searchTerm: string): Bet[] => {
  const bets = getUserBets();
  const lowercaseSearch = searchTerm.toLowerCase();
  
  return bets.filter(bet => {
    const matchName = bet.matchName?.toLowerCase() || '';
    const market = bet.market.toLowerCase();
    
    return (
      matchName.includes(lowercaseSearch) || 
      market.includes(lowercaseSearch)
    );
  });
};

// Get user bets filtered by account type
export const getUserBetsByAccountType = (userId: string, accountType: AccountType): Bet[] => {
  const bets = getUserBets();
  return bets.filter(bet => 
    bet.userId === userId && 
    (bet.accountType === accountType || !bet.accountType) // Handle legacy bets with no accountType
  );
};

// Get account balance based on account type
export const getAccountBalance = (userId: string): { virtualBalance: number, walletBalance: number } => {
  const account = getUserAccount(userId);
  return {
    virtualBalance: account.virtualBalance,
    walletBalance: account.walletBalance
  };
};
