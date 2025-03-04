
interface Bet {
  id: string;
  matchId: number;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  status: 'open' | 'settled';
  finalResult?: number;
  profitLoss?: number;
  timestamp: number;
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
  
  return {
    ...bet,
    status: 'settled',
    finalResult,
    profitLoss
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
export const settleMatchBets = (matchId: number, finalResult: number): Bet[] => {
  const bets = getUserBets();
  const updatedBets = bets.map(bet => {
    if (bet.matchId === matchId && bet.status === 'open') {
      return settleBet(bet, finalResult);
    }
    return bet;
  });
  saveBets(updatedBets);
  return updatedBets;
};
