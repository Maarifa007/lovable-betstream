
import React, { useState, useEffect } from 'react';
import { useSpreads } from '@/contexts/SpreadsContext';
import { toast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock, History, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SpreadAdjustmentLog {
  id: string;
  marketId: string;
  marketName: string;
  timestamp: string;
  oldBuyPrice: string;
  oldSellPrice: string;
  newBuyPrice: string;
  newSellPrice: string;
  adjustedBy: string;
  multiplier: number;
}

interface ScheduledAdjustment {
  id: string;
  marketId: string;
  marketName: string;
  spreadMultiplier: number;
  scheduledTime: string;
  status: 'pending' | 'completed' | 'cancelled';
}

const AdminSpreadAdjustment: React.FC = () => {
  const { spreads, updateSpread } = useSpreads();
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [spreadMultiplier, setSpreadMultiplier] = useState(1);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentLogs, setAdjustmentLogs] = useState<SpreadAdjustmentLog[]>([]);
  const [scheduledAdjustments, setScheduledAdjustments] = useState<ScheduledAdjustment[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  
  // Load adjustment logs from localStorage on component mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('spreadAdjustmentLogs');
    if (savedLogs) {
      setAdjustmentLogs(JSON.parse(savedLogs));
    }
    
    const savedScheduled = localStorage.getItem('scheduledAdjustments');
    if (savedScheduled) {
      setScheduledAdjustments(JSON.parse(savedScheduled));
    }
    
    // Set default schedule time to 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setScheduleDate(oneHourLater.toISOString().split('T')[0]);
    setScheduleTime(oneHourLater.toTimeString().split(' ')[0].substring(0, 5));
    
    // Check for scheduled adjustments that need to be applied
    const checkScheduledAdjustments = setInterval(() => {
      const now = new Date();
      
      setScheduledAdjustments(prev => {
        const updated = [...prev];
        let hasUpdates = false;
        
        updated.forEach(adjustment => {
          if (adjustment.status === 'pending') {
            const scheduledTime = new Date(adjustment.scheduledTime);
            
            if (now >= scheduledTime) {
              // Time to apply this adjustment
              const marketToAdjust = spreads.find(s => s.id === adjustment.marketId);
              
              if (marketToAdjust) {
                // Calculate and apply the adjustment
                applySpreadAdjustment(
                  adjustment.marketId, 
                  adjustment.spreadMultiplier,
                  `Scheduled adjustment (ID: ${adjustment.id})`
                );
                
                // Mark as completed
                adjustment.status = 'completed';
                hasUpdates = true;
                
                toast({
                  title: "Scheduled Adjustment Applied",
                  description: `Spread for ${adjustment.marketName} has been adjusted by ${((adjustment.spreadMultiplier - 1) * 100).toFixed(0)}%`,
                });
              }
            }
          }
        });
        
        if (hasUpdates) {
          localStorage.setItem('scheduledAdjustments', JSON.stringify(updated));
        }
        
        return updated;
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkScheduledAdjustments);
  }, [spreads]);
  
  const handleMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarketId(event.target.value);
  };
  
  const handleMultiplierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setSpreadMultiplier(isNaN(value) ? 1 : value);
  };
  
  // Apply the spread adjustment to a market
  const applySpreadAdjustment = (marketId: string, multiplier: number, source: string = 'Manual adjustment') => {
    // Get the selected spread
    const selectedSpread = spreads.find(s => s.id === marketId);
    
    if (!selectedSpread) {
      throw new Error("Selected market not found");
    }
    
    // Calculate the midpoint of the current spread
    const currentBuyPrice = parseFloat(selectedSpread.buyPrice);
    const currentSellPrice = parseFloat(selectedSpread.sellPrice);
    const midPoint = (currentBuyPrice + currentSellPrice) / 2;
    const halfSpread = (currentBuyPrice - currentSellPrice) / 2;
    
    // Calculate the new spread
    const newHalfSpread = halfSpread * multiplier;
    const newBuyPrice = (midPoint + newHalfSpread).toFixed(2);
    const newSellPrice = (midPoint - newHalfSpread).toFixed(2);
    
    // Update local state
    updateSpread(marketId, newBuyPrice, newSellPrice);
    
    // Log the adjustment
    const logEntry: SpreadAdjustmentLog = {
      id: Date.now().toString(),
      marketId: marketId,
      marketName: selectedSpread.market,
      timestamp: new Date().toISOString(),
      oldBuyPrice: selectedSpread.buyPrice,
      oldSellPrice: selectedSpread.sellPrice,
      newBuyPrice: newBuyPrice,
      newSellPrice: newSellPrice,
      adjustedBy: source,
      multiplier: multiplier
    };
    
    const updatedLogs = [logEntry, ...adjustmentLogs];
    setAdjustmentLogs(updatedLogs);
    localStorage.setItem('spreadAdjustmentLogs', JSON.stringify(updatedLogs));
    
    return { newBuyPrice, newSellPrice };
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
      // Apply the adjustment
      applySpreadAdjustment(selectedMarketId, spreadMultiplier);
      
      // Get the selected spread for the success message
      const selectedSpread = spreads.find(s => s.id === selectedMarketId);
      
      // Show success message
      toast({
        title: "Success",
        description: `Spread adjusted by ${(spreadMultiplier - 1) * 100}% for ${selectedSpread?.market}`,
      });
      
      // Log the change (in a real app, this might be sent to a history endpoint)
      console.log(`✅ Admin adjusted spread for market ${selectedSpread?.market}`);
      
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
  
  const handleScheduleAdjustment = () => {
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
    
    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Error",
        description: "Please select a valid date and time",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create scheduled time
      const scheduledTimeStr = `${scheduleDate}T${scheduleTime}:00`;
      const scheduledTime = new Date(scheduledTimeStr);
      
      // Validate the scheduled time is in the future
      if (scheduledTime <= new Date()) {
        toast({
          title: "Error",
          description: "Scheduled time must be in the future",
          variant: "destructive",
        });
        return;
      }
      
      // Get the market details
      const selectedMarket = spreads.find(s => s.id === selectedMarketId);
      
      if (!selectedMarket) {
        throw new Error("Selected market not found");
      }
      
      // Create the scheduled adjustment
      const newScheduledAdjustment: ScheduledAdjustment = {
        id: Date.now().toString(),
        marketId: selectedMarketId,
        marketName: selectedMarket.market,
        spreadMultiplier: spreadMultiplier,
        scheduledTime: scheduledTime.toISOString(),
        status: 'pending'
      };
      
      // Add to list and save to localStorage
      const updatedScheduled = [newScheduledAdjustment, ...scheduledAdjustments];
      setScheduledAdjustments(updatedScheduled);
      localStorage.setItem('scheduledAdjustments', JSON.stringify(updatedScheduled));
      
      // Show success message
      toast({
        title: "Adjustment Scheduled",
        description: `Spread adjustment scheduled for ${scheduledTime.toLocaleString()}`,
      });
      
    } catch (error) {
      console.error('Failed to schedule adjustment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule adjustment",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelScheduled = (id: string) => {
    setScheduledAdjustments(prev => {
      const updated = prev.map(adj => 
        adj.id === id ? { ...adj, status: 'cancelled' as const } : adj
      );
      
      localStorage.setItem('scheduledAdjustments', JSON.stringify(updated));
      
      toast({
        title: "Adjustment Cancelled",
        description: "The scheduled adjustment has been cancelled",
      });
      
      return updated;
    });
  };
  
  // Determine if the adjustment is a significant change
  const isSignificantChange = spreadMultiplier > 1.3;
  
  return (
    <div className="p-6 rounded-lg glass">
      <h2 className="text-xl font-bold mb-6">Manual Spread Adjustment</h2>
      
      <Tabs defaultValue="adjust">
        <TabsList className="mb-4">
          <TabsTrigger value="adjust">
            <Save className="h-4 w-4 mr-2" />
            Adjust Now
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="adjust">
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
        </TabsContent>
        
        <TabsContent value="schedule">
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="schedule-market-select">Select Market</Label>
              <select
                id="schedule-market-select"
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
              <>
                <div className="grid gap-2">
                  <Label htmlFor="schedule-spread-multiplier">
                    Spread Multiplier
                    <span className="ml-2 text-xs text-muted-foreground">
                      (e.g., 1.25 = 25% wider spread)
                    </span>
                  </Label>
                  <Input
                    id="schedule-spread-multiplier"
                    type="number"
                    min="1"
                    step="0.05"
                    value={spreadMultiplier}
                    onChange={handleMultiplierChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleScheduleAdjustment}
                  disabled={!selectedMarketId || !scheduleDate || !scheduleTime}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Adjustment
                </Button>
              </>
            )}
            
            {selectedMarketId && scheduledAdjustments.filter(adj => adj.status === 'pending').length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Pending Scheduled Adjustments</h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {scheduledAdjustments
                    .filter(adj => adj.status === 'pending')
                    .map(adj => (
                      <div key={adj.id} className="p-3 border border-white/10 rounded bg-white/5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{adj.marketName}</p>
                            <p className="text-xs text-muted-foreground">
                              Adjustment: {((adj.spreadMultiplier - 1) * 100).toFixed(0)}% wider
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Scheduled for: {new Date(adj.scheduledTime).toLocaleString()}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancelScheduled(adj.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          {adjustmentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No adjustment history yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {adjustmentLogs.map(log => (
                <div key={log.id} className="p-4 border border-white/10 rounded bg-white/5">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{log.marketName}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Before:</p>
                      <p>Buy: <span className="text-green-500">{log.oldBuyPrice}</span></p>
                      <p>Sell: <span className="text-red-500">{log.oldSellPrice}</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After:</p>
                      <p>Buy: <span className="text-green-500">{log.newBuyPrice}</span></p>
                      <p>Sell: <span className="text-red-500">{log.newSellPrice}</span></p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Adjusted by: {log.adjustedBy}</p>
                    <p>Change: {((log.multiplier - 1) * 100).toFixed(0)}% {log.multiplier > 1 ? 'wider' : 'narrower'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSpreadAdjustment;
