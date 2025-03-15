
import React, { useState, useEffect } from 'react';
import { useSpreads } from '@/contexts/SpreadsContext';
import { toast } from '@/hooks/use-toast';
import { calculateSpreadMultiplier } from '@/utils/apiUtils';
import { debounce } from 'lodash';

const AdminSpreads = () => {
  const { spreads, updateSpread, loading } = useSpreads();
  const [editValues, setEditValues] = useState<Record<string, { buyPrice: string, sellPrice: string }>>({});
  const [exposureLevels, setExposureLevels] = useState<Record<string, { amount: number, level: 'normal' | 'medium' | 'high' }>>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);

  // Simulate fetching exposure levels
  useEffect(() => {
    const fetchExposureLevels = async () => {
      // In a real application, this would be an API call
      const mockExposure: Record<string, { amount: number, level: 'normal' | 'medium' | 'high' }> = {};
      
      spreads.forEach(spread => {
        // Generate random exposure between 0 and 100,000
        const randomExposure = Math.floor(Math.random() * 100000);
        const { level } = calculateSpreadMultiplier(randomExposure);
        mockExposure[spread.id] = { amount: randomExposure, level };
      });
      
      setExposureLevels(mockExposure);
    };
    
    fetchExposureLevels();
  }, [spreads]);

  const handleEditChange = (id: string, field: 'buyPrice' | 'sellPrice', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { buyPrice: '', sellPrice: '' }),
        [field]: value
      }
    }));
  };

  const handleUpdateSpread = (id: string) => {
    const values = editValues[id];
    if (!values || !values.buyPrice || !values.sellPrice) {
      toast({
        title: "Error",
        description: "Both buy and sell prices must be provided",
        variant: "destructive"
      });
      return;
    }

    // Validate that buyPrice is greater than sellPrice
    if (parseFloat(values.buyPrice) <= parseFloat(values.sellPrice)) {
      toast({
        title: "Error",
        description: "Buy price must be greater than sell price",
        variant: "destructive"
      });
      return;
    }

    updateSpread(id, values.buyPrice, values.sellPrice);
    
    toast({
      title: "Success",
      description: "Spread updated successfully",
    });
    
    // Clear the edit values for this spread
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  // Apply risk-based adjustment to a spread
  const applyRiskAdjustment = (id: string, exposureLevel: 'normal' | 'medium' | 'high') => {
    const spread = spreads.find(s => s.id === id);
    if (!spread) return;
    
    let multiplier = 1;
    switch (exposureLevel) {
      case 'medium':
        multiplier = 1.25; // 25% increase
        break;
      case 'high':
        multiplier = 1.5; // 50% increase
        break;
    }
    
    // Calculate the midpoint and adjust the spread around it
    const buyPrice = parseFloat(spread.buyPrice);
    const sellPrice = parseFloat(spread.sellPrice);
    const midPoint = (buyPrice + sellPrice) / 2;
    const halfSpread = (buyPrice - sellPrice) / 2;
    
    const newHalfSpread = halfSpread * multiplier;
    const newBuyPrice = (midPoint + newHalfSpread).toFixed(2);
    const newSellPrice = (midPoint - newHalfSpread).toFixed(2);
    
    updateSpread(id, newBuyPrice, newSellPrice);
    
    toast({
      title: "Risk Adjustment Applied",
      description: `Applied ${exposureLevel} risk adjustment (${(multiplier-1)*100}% wider spread)`,
    });
  };

  // Toggle market simulation
  const toggleSimulation = () => {
    if (isSimulating) {
      // Stop simulation
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      setIsSimulating(false);
      toast({
        title: "Simulation Stopped",
        description: "Market simulation has been stopped",
      });
    } else {
      // Start simulation
      const interval = setInterval(() => {
        // Randomly update exposure levels
        const newExposureLevels = { ...exposureLevels };
        const randomSpreadId = spreads[Math.floor(Math.random() * spreads.length)]?.id;
        
        if (randomSpreadId) {
          const randomExposure = Math.floor(Math.random() * 100000);
          const { level } = calculateSpreadMultiplier(randomExposure);
          newExposureLevels[randomSpreadId] = { amount: randomExposure, level };
          
          setExposureLevels(newExposureLevels);
          
          // If exposure is high, auto-adjust spread
          if (level !== 'normal') {
            applyRiskAdjustment(randomSpreadId, level);
            
            // Send mock admin notification for high exposure
            if (level === 'high') {
              const spread = spreads.find(s => s.id === randomSpreadId);
              console.log(`🚨 High exposure alert! Market: ${spread?.market}, Exposure: $${randomExposure.toLocaleString()}`);
              toast({
                title: "Admin Email Sent",
                description: `Alert sent for ${spread?.market} with $${randomExposure.toLocaleString()} exposure`,
                variant: "warning",
              });
            }
          }
        }
      }, 5000);
      
      setSimulationInterval(interval);
      setIsSimulating(true);
      toast({
        title: "Simulation Started",
        description: "Market simulation is now running",
      });
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  if (loading) {
    return <div className="p-4">Loading spreads...</div>;
  }

  const getExposureBadgeClass = (level: 'normal' | 'medium' | 'high') => {
    switch (level) {
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'high':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-green-500/20 text-green-500';
    }
  };

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Spreads</h2>
        <button
          onClick={toggleSimulation}
          className={`px-4 py-2 rounded ${
            isSimulating ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
          }`}
        >
          {isSimulating ? 'Stop Simulation' : 'Simulate Market Activity'}
        </button>
      </div>
      
      <div className="space-y-4">
        {spreads.map(spread => {
          const exposure = exposureLevels[spread.id];
          
          return (
            <div key={spread.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{spread.market}</h3>
                {exposure && (
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getExposureBadgeClass(exposure.level)}`}>
                      {exposure.level === 'normal' ? 'Normal Exposure' : 
                       exposure.level === 'medium' ? 'Medium Exposure' : 'High Exposure'}
                    </span>
                    <span className="ml-2 text-sm">${exposure.amount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Buy Price</p>
                  <p className="font-medium text-primary">{spread.buyPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Sell Price</p>
                  <p className="font-medium text-destructive">{spread.sellPrice}</p>
                </div>
              </div>
              
              {exposure && exposure.level !== 'normal' && (
                <div className="mb-4 p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-400 mb-1">Risk-Based Pricing Recommended</p>
                  <p className="text-xs text-yellow-300/80">
                    {exposure.level === 'medium' 
                      ? 'Medium exposure detected. Consider widening spread by 25%.' 
                      : 'High exposure detected! Widening spread by 50% recommended.'}
                  </p>
                  <button
                    onClick={() => applyRiskAdjustment(spread.id, exposure.level)}
                    className="mt-2 w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium py-2 rounded transition-colors"
                  >
                    Apply {exposure.level === 'medium' ? '25%' : '50%'} Risk Adjustment
                  </button>
                </div>
              )}
              
              <div className="border-t border-white/10 my-4 pt-4">
                <h4 className="text-sm font-medium mb-2">Manual Spread Adjustment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">New Buy Price</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editValues[spread.id]?.buyPrice || ''}
                      onChange={(e) => handleEditChange(spread.id, 'buyPrice', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm"
                      placeholder={spread.buyPrice}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">New Sell Price</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editValues[spread.id]?.sellPrice || ''}
                      onChange={(e) => handleEditChange(spread.id, 'sellPrice', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm"
                      placeholder={spread.sellPrice}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateSpread(spread.id)}
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary font-medium py-2 rounded transition-colors"
                >
                  Update Spread
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSpreads;
