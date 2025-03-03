
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

const NewPositionModal = ({ isOpen, onClose, match, action }: NewPositionModalProps) => {
  const [stake, setStake] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number | null>(null);

  if (!isOpen || !match) return null;

  const price = action === 'buy' ? match.buyPrice : match.sellPrice;
  const maxLoss = action === 'buy' 
    ? stake * (parseFloat(match.buyPrice) / 100) 
    : stake * (parseFloat(match.sellPrice) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In real implementation, this would send the order to a backend
    toast({
      title: "Position Opened",
      description: `${action === 'buy' ? 'Bought' : 'Sold'} ${match.market} at ${price} with $${stake} stake`,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass rounded-lg max-w-md w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">New Position</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-3 border border-white/10 rounded-lg bg-white/5">
              <div className="text-sm text-muted-foreground mb-1">Market</div>
              <div className="font-medium">{match.home} vs {match.away}</div>
              <div className="text-sm text-muted-foreground mt-1">{match.market}</div>
            </div>
            
            <div className="p-3 border border-white/10 rounded-lg bg-white/5">
              <div className="text-sm text-muted-foreground mb-1">Action</div>
              <div className={`font-medium ${action === 'buy' ? 'text-primary' : 'text-destructive'}`}>
                {action === 'buy' ? 'Buy at' : 'Sell at'} {price}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm" htmlFor="stake">Stake Amount ($)</label>
              <input
                id="stake"
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                min={10}
                max={10000}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm" htmlFor="stopLoss">Stop Loss (Optional)</label>
                <span className="text-xs text-muted-foreground">Max Loss: ${maxLoss.toFixed(2)}</span>
              </div>
              <input
                id="stopLoss"
                type="number"
                value={stopLoss || ''}
                onChange={(e) => setStopLoss(e.target.value ? Number(e.target.value) : null)}
                min={0}
                max={maxLoss}
                placeholder="No stop loss"
                className="w-full bg-white/10 border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
