
import { useState, useEffect } from "react";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/LanguageContext";

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

// Just for testing, this will simulate a match result
const simulateMatchResult = (bet: Bet): number => {
  // Generate a random result close to the bet price
  const minResult = bet.betPrice - 2;
  const maxResult = bet.betPrice + 2;
  return parseFloat((Math.random() * (maxResult - minResult) + minResult).toFixed(1));
};

// Calculate profit/loss based on bet type and result
const calculateProfitLoss = (bet: Bet, finalResult: number): number => {
  if (bet.betType === 'buy') {
    return (finalResult - bet.betPrice) * bet.stakePerPoint;
  } else {
    return (bet.betPrice - finalResult) * bet.stakePerPoint;
  }
};

// Format date
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

interface BetHistoryProps {
  userId?: string;
}

const BetHistory = ({ userId }: BetHistoryProps) => {
  const { t } = useTranslation();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBets();
  }, [userId]);

  const loadBets = async () => {
    try {
      if (userId) {
        // Load from database using Supabase
        const { data: predictions, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (predictions) {
          // Convert predictions to bet format
          const formattedBets: Bet[] = predictions.map((pred: any) => ({
            id: pred.id,
            matchId: 1, // Default value
            market: pred.prediction_data?.market || 'Unknown Market',
            betType: (pred.prediction_data?.type === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
            betPrice: pred.prediction_data?.price || 0,
            stakePerPoint: pred.bet_amount,
            status: (pred.status === 'pending' ? 'open' : 'settled') as 'open' | 'settled',
            finalResult: pred.actual_payout ? pred.prediction_data?.finalResult : undefined,
            profitLoss: pred.actual_payout || undefined,
            timestamp: new Date(pred.created_at).getTime()
          }));
          setBets(formattedBets);
        }
      } else {
        // Fallback to localStorage for non-authenticated users
        const storedBets = JSON.parse(localStorage.getItem('userBets') || '[]');
        setBets(storedBets);
      }
    } catch (error) {
      console.error('Error loading bet history:', error);
      // Fallback to localStorage
      const storedBets = JSON.parse(localStorage.getItem('userBets') || '[]');
      setBets(storedBets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up an interval to check for bets that need to be settled (for demo purposes)
    const interval = setInterval(() => {
      const updatedBets = JSON.parse(localStorage.getItem('userBets') || '[]');
      
      // Find open bets that are more than 30 seconds old
      const betsToSettle = updatedBets.filter((bet: Bet) => 
        bet.status === 'open' && (Date.now() - bet.timestamp) > 30000
      );
      
      if (betsToSettle.length > 0) {
        const newBets = updatedBets.map((bet: Bet) => {
          if (bet.status === 'open' && (Date.now() - bet.timestamp) > 30000) {
            const finalResult = simulateMatchResult(bet);
            const profitLoss = calculateProfitLoss(bet, finalResult);
            
            // Show notification
            toast({
              title: `Bet Settled: ${profitLoss >= 0 ? 'Win!' : 'Loss'}`,
              description: `${bet.market}: ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`,
              variant: profitLoss >= 0 ? 'default' : 'destructive',
            });
            
            return {
              ...bet,
              status: 'settled' as const,  // Type assertion to fix the issue
              finalResult,
              profitLoss
            };
          }
          return bet;
        });
        
        localStorage.setItem('userBets', JSON.stringify(newBets));
        setBets(newBets as Bet[]); // Type assertion to ensure correct type
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSettleBet = (betId: string) => {
    // For demo purposes, manually settle a bet
    const updatedBets = bets.map(bet => {
      if (bet.id === betId && bet.status === 'open') {
        const finalResult = simulateMatchResult(bet);
        const profitLoss = calculateProfitLoss(bet, finalResult);
        
        toast({
          title: `Bet Settled: ${profitLoss >= 0 ? 'Win!' : 'Loss'}`,
          description: `${bet.market}: ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`,
          variant: profitLoss >= 0 ? 'default' : 'destructive',
        });
        
        return {
          ...bet,
          status: 'settled' as const,  // Type assertion to fix the issue
          finalResult,
          profitLoss
        };
      }
      return bet;
    });
    
    localStorage.setItem('userBets', JSON.stringify(updatedBets));
    setBets(updatedBets as Bet[]); // Type assertion to ensure correct type
  };

  if (loading) {
    return (
      <div className="glass rounded-lg p-6 animate-pulse">
        <h2 className="text-lg font-semibold mb-4">Bet History</h2>
        <div className="h-40 flex items-center justify-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Bet History</h2>
      
      {bets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No bet history available. Place your first bet to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div 
              key={bet.id} 
              className={`p-4 rounded-lg border ${bet.status === 'open' 
                ? 'border-white/10 bg-white/5' 
                : bet.profitLoss && bet.profitLoss >= 0 
                  ? 'border-green-800/30 bg-green-900/10' 
                  : 'border-red-800/30 bg-red-900/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      bet.betType === 'buy' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {bet.betType.toUpperCase()}
                    </span>
                    {bet.status === 'open' ? (
                      <span className="flex items-center space-x-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                        <Clock className="h-3 w-3" />
                        <span>OPEN</span>
                      </span>
                    ) : (
                      <span className={`flex items-center space-x-1 text-xs ${
                        bet.profitLoss && bet.profitLoss >= 0 
                          ? 'text-green-400 bg-green-400/10' 
                          : 'text-red-400 bg-red-400/10'
                      } px-2 py-0.5 rounded`}>
                        {bet.profitLoss && bet.profitLoss >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        <span>SETTLED</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium mt-2">{bet.market}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatDate(bet.timestamp)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Bet Price</div>
                  <div className="font-medium">{bet.betPrice}</div>
                  <div className="text-sm text-muted-foreground mt-2">Stake Per Point</div>
                  <div className="font-medium">${bet.stakePerPoint}</div>
                </div>
              </div>
              
              {bet.status === 'settled' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Final Result</div>
                      <div className="font-medium">{bet.finalResult}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Profit/Loss</div>
                      <div className={`font-medium ${
                        bet.profitLoss && bet.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {bet.profitLoss && bet.profitLoss >= 0 ? '+' : ''}
                        ${bet.profitLoss?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {bet.status === 'open' && (
                <button
                  onClick={() => handleSettleBet(bet.id)}
                  className="mt-4 w-full p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  Settle Bet (Demo)
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BetHistory;
