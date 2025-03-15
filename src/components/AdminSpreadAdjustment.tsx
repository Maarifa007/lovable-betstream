
import React, { useState } from 'react';
import { useSpreads } from '@/contexts/SpreadsContext';
import { toast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save } from "lucide-react";

const AdminSpreadAdjustment: React.FC = () => {
  const { spreads, updateSpread } = useSpreads();
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [spreadMultiplier, setSpreadMultiplier] = useState(1);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const handleMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarketId(event.target.value);
  };
  
  const handleMultiplierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setSpreadMultiplier(isNaN(value) ? 1 : value);
  };
  
  const handleAdjustSpread = async () => {
    if (!selectedMarketId) {
      toast({
        title: "Error",
        description: "Please select a market",
        variant: "destructive",
      });
      return;
    }
    
    if (spreadMultiplier <= 0) {
      toast({
        title: "Error",
        description: "Spread multiplier must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdjusting(true);
    
    try {
      // Get the selected spread
      const selectedSpread = spreads.find(s => s.id === selectedMarketId);
      
      if (!selectedSpread) {
        throw new Error("Selected market not found");
      }
      
      // Calculate the midpoint of the current spread
      const currentBuyPrice = parseFloat(selectedSpread.buyPrice);
      const currentSellPrice = parseFloat(selectedSpread.sellPrice);
      const midPoint = (currentBuyPrice + currentSellPrice) / 2;
      const halfSpread = (currentBuyPrice - currentSellPrice) / 2;
      
      // Calculate the new spread
      const newHalfSpread = halfSpread * spreadMultiplier;
      const newBuyPrice = (midPoint + newHalfSpread).toFixed(2);
      const newSellPrice = (midPoint - newHalfSpread).toFixed(2);
      
      // In a real application, this would call an API endpoint
      // const response = await fetch('/api/admin-adjust-spreads', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     marketId: selectedMarketId,
      //     spreadMultiplier,
      //     newBuyPrice,
      //     newSellPrice
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to adjust spread');
      // }
      
      // Update local state
      updateSpread(selectedMarketId, newBuyPrice, newSellPrice);
      
      // Show success message
      toast({
        title: "Success",
        description: `Spread adjusted by ${(spreadMultiplier - 1) * 100}% for ${selectedSpread.market}`,
      });
      
      // Log the change (in a real app, this might be sent to a history endpoint)
      console.log(`✅ Admin adjusted spread for market ${selectedSpread.market}`);
      console.log(`Original: Buy=${currentBuyPrice}, Sell=${currentSellPrice}`);
      console.log(`New: Buy=${newBuyPrice}, Sell=${newSellPrice} (${(spreadMultiplier - 1) * 100}% wider)`);
      
    } catch (error) {
      console.error('Failed to adjust spread:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to adjust spread",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };
  
  // Determine if the adjustment is a significant change
  const isSignificantChange = spreadMultiplier > 1.3;
  
  return (
    <div className="p-6 rounded-lg glass">
      <h2 className="text-xl font-bold mb-6">Manual Spread Adjustment</h2>
      
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="market-select">Select Market</Label>
          <select
            id="market-select"
            value={selectedMarketId}
            onChange={handleMarketChange}
            className="w-full h-10 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-foreground"
          >
            <option value="">-- Select a market --</option>
            {spreads.map(spread => (
              <option key={spread.id} value={spread.id}>
                {spread.market}
              </option>
            ))}
          </select>
        </div>
        
        {selectedMarketId && (
          <div className="grid gap-2">
            <Label htmlFor="spread-multiplier">
              Spread Multiplier
              <span className="ml-2 text-xs text-muted-foreground">
                (e.g., 1.25 = 25% wider spread)
              </span>
            </Label>
            <Input
              id="spread-multiplier"
              type="number"
              min="1"
              step="0.05"
              value={spreadMultiplier}
              onChange={handleMultiplierChange}
            />
            
            <div className="text-sm text-muted-foreground mt-1">
              {spreadMultiplier > 1 ? (
                <span>Widens spread by {((spreadMultiplier - 1) * 100).toFixed(0)}%</span>
              ) : spreadMultiplier < 1 ? (
                <span className="text-yellow-500">Warning: This will narrow the spread</span>
              ) : (
                <span>No change to spread width</span>
              )}
            </div>
          </div>
        )}
        
        {selectedMarketId && isSignificantChange && (
          <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">
                Significant Spread Adjustment
              </p>
              <p className="text-xs text-yellow-300/80 mt-1">
                You're increasing the spread by {((spreadMultiplier - 1) * 100).toFixed(0)}%, which is a significant change.
                This may affect market liquidity.
              </p>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleAdjustSpread}
          disabled={!selectedMarketId || isAdjusting}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isAdjusting ? "Adjusting..." : "Apply Spread Adjustment"}
        </Button>
      </div>
      
      {selectedMarketId && (
        <div className="mt-6 p-4 border border-white/10 rounded bg-white/5">
          <h3 className="text-sm font-medium mb-2">Spread Preview</h3>
          {(() => {
            const selectedSpread = spreads.find(s => s.id === selectedMarketId);
            
            if (!selectedSpread) return null;
            
            const currentBuyPrice = parseFloat(selectedSpread.buyPrice);
            const currentSellPrice = parseFloat(selectedSpread.sellPrice);
            const midPoint = (currentBuyPrice + currentSellPrice) / 2;
            const halfSpread = (currentBuyPrice - currentSellPrice) / 2;
            const newHalfSpread = halfSpread * spreadMultiplier;
            const newBuyPrice = (midPoint + newHalfSpread).toFixed(2);
            const newSellPrice = (midPoint - newHalfSpread).toFixed(2);
            
            return (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Spread:</p>
                  <p className="font-medium">Buy: <span className="text-green-500">{currentBuyPrice}</span></p>
                  <p className="font-medium">Sell: <span className="text-red-500">{currentSellPrice}</span></p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Width: {(currentBuyPrice - currentSellPrice).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">New Spread:</p>
                  <p className="font-medium">Buy: <span className="text-green-500">{newBuyPrice}</span></p>
                  <p className="font-medium">Sell: <span className="text-red-500">{newSellPrice}</span></p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Width: {(parseFloat(newBuyPrice) - parseFloat(newSellPrice)).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminSpreadAdjustment;
