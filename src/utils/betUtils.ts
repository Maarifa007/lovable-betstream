
interface Bet {
  id: string;
  matchId: number | string;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  makeupLimit?: number;
  status: 'open' | 'settled' | 'cancelled';
  finalResult?: number;
  profitLoss?: number;
  timestamp: number;
  collateralHeld?: number;
  userId?: string;
  matchName?: string;
}

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
  return bets.filter(bet => bet.status === 'open');
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
export const getTotalProfitLoss = (): number => {
  const settledBets = getSettledBets();
  return settledBets.reduce((total, bet) => total + (bet.profitLoss || 0), 0);
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
      ? { ...bet, status: 'cancelled' } 
      : bet
  );
  saveBets(updatedBets);
  return updatedBets;
};
