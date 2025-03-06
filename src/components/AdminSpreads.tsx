
import React, { useState } from 'react';
import { useSpreads } from '@/contexts/SpreadsContext';
import { toast } from '@/hooks/use-toast';

const AdminSpreads = () => {
  const { spreads, updateSpread, loading } = useSpreads();
  const [editValues, setEditValues] = useState<Record<string, { buyPrice: string, sellPrice: string }>>({});

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

  if (loading) {
    return <div className="p-4">Loading spreads...</div>;
  }

  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Manage Spreads</h2>
      
      <div className="space-y-4">
        {spreads.map(spread => (
          <div key={spread.id} className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium mb-2">{spread.market}</h3>
            
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
            
            <div className="border-t border-white/10 my-4 pt-4">
              <h4 className="text-sm font-medium mb-2">Update Spread</h4>
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
        ))}
      </div>
    </div>
  );
};

export default AdminSpreads;
