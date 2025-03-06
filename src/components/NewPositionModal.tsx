
import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface NewPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: {
    id: number;
    home: string;
    away: string;
    market: string;
    sellPrice: string;
    buyPrice: string;
  };
  action?: 'buy' | 'sell';
}

interface Bet {
  id: string;
  matchId: number;
  matchName: string;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  makeupLimit: number;
  status: 'open' | 'settled';
  timestamp: number;
}

const NewPositionModal = ({ isOpen, onClose, match, action }: NewPositionModalProps) => {
  const [stakePerPoint, setStakePerPoint] = useState<number>(10);
  const [makeupLimit, setMakeupLimit] = useState<number>(30); // Default 30X makeup

  if (!isOpen || !match) return null;

  const price = action === 'buy' ? match.buyPrice : match.sellPrice;
  const totalExposure = stakePerPoint * makeupLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a bet object
    const bet: Bet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      matchId: match.id,
      matchName: `${match.home} vs ${match.away}`,
      market: match.market,
      betType: action || 'buy',
      betPrice: parseFloat(price),
      stakePerPoint,
      makeupLimit,
      status: 'open',
      timestamp: Date.now(),
    };
    
    // Store bet in localStorage for now (in a real app, this would be sent to a backend)
    const existingBets = JSON.parse(localStorage.getItem('userBets') || '[]');
    localStorage.setItem('userBets', JSON.stringify([...existingBets, bet]));
    
    // Show toast notification
    toast({
      title: "Position Opened",
      description: `${action === 'buy' ? 'Bought' : 'Sold'} ${match.market} at ${price} with $${stakePerPoint} per point`,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-card rounded-lg max-w-md w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">New Position</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-3 border border-border rounded-lg bg-background">
              <div className="text-sm text-muted-foreground mb-1">Market</div>
              <div className="font-medium">{match.home} vs {match.away}</div>
              <div className="text-sm text-muted-foreground mt-1">{match.market}</div>
            </div>
            
            <div className="p-3 border border-border rounded-lg bg-background">
              <div className="text-sm text-muted-foreground mb-1">Action</div>
              <div className={`font-medium ${action === 'buy' ? 'text-primary' : 'text-destructive'}`}>
                {action === 'buy' ? 'Buy at' : 'Sell at'} {price}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm" htmlFor="stakePerPoint">Stake Per Point ($)</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25, 50, 100, 200].map((amount) => (
                  <button 
                    key={amount}
                    type="button"
                    onClick={() => setStakePerPoint(amount)}
                    className={`p-2 border rounded transition-colors ${
                      stakePerPoint === amount 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-white/5'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Amount you win or lose per point difference</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm">Makeup Limit (default: 30X)</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20, 25, 30].map((limit) => (
                  <button 
                    key={limit}
                    type="button"
                    onClick={() => setMakeupLimit(limit)}
                    className={`p-2 border rounded transition-colors ${
                      makeupLimit === limit 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-white/5'
                    }`}
                  >
                    {limit}X
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Platform will hold ${totalExposure} until event is over</span>
                <span className="font-medium">Max exposure: ${totalExposure}</span>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className={`w-full p-3 rounded-lg transition-colors ${
              action === 'buy' 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
          >
            Confirm {action === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPositionModal;
