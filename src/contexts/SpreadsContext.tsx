
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SpreadSettings {
  id: string;
  market: string;
  buyPrice: string;
  sellPrice: string;
}

interface SpreadsContextType {
  spreads: SpreadSettings[];
  updateSpread: (id: string, buyPrice: string, sellPrice: string) => void;
  loading: boolean;
}

const SpreadsContext = createContext<SpreadsContextType | undefined>(undefined);

export const useSpreads = () => {
  const context = useContext(SpreadsContext);
  if (!context) {
    throw new Error('useSpreads must be used within a SpreadsProvider');
  }
  return context;
};

export const SpreadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spreads, setSpreads] = useState<SpreadSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial spreads from localStorage (in a real app, this would be an API call)
    const storedSpreads = localStorage.getItem('spreadSettings');
    if (storedSpreads) {
      setSpreads(JSON.parse(storedSpreads));
    } else {
      // Default spreads if none exist
      const defaultSpreads = [
        { id: '1', market: 'Total Goals', buyPrice: '3.0', sellPrice: '2.8' },
        { id: '2', market: 'Total Corners', buyPrice: '10.8', sellPrice: '10.5' }
      ];
      localStorage.setItem('spreadSettings', JSON.stringify(defaultSpreads));
      setSpreads(defaultSpreads);
    }
    setLoading(false);
  }, []);

  const updateSpread = (id: string, buyPrice: string, sellPrice: string) => {
    const updatedSpreads = spreads.map(spread => 
      spread.id === id ? { ...spread, buyPrice, sellPrice } : spread
    );
    setSpreads(updatedSpreads);
    localStorage.setItem('spreadSettings', JSON.stringify(updatedSpreads));
  };

  return (
    <SpreadsContext.Provider value={{ spreads, updateSpread, loading }}>
      {children}
    </SpreadsContext.Provider>
  );
};
