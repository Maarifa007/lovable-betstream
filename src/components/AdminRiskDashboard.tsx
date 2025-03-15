
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { calculateSpreadMultiplier } from '@/utils/apiUtils';

interface MarketExposure {
  id: string;
  marketName: string;
  totalExposure: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

const AdminRiskDashboard: React.FC = () => {
  const [markets, setMarkets] = useState<MarketExposure[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch market exposure data (in a real app, this would be from an API)
  useEffect(() => {
    const fetchExposure = async () => {
      try {
        // In a real implementation, this would call an actual API
        // const response = await fetch('/api/get-risk-dashboard');
        // const data = await response.json();
        
        // For this demo, we'll simulate the data
        const mockData: MarketExposure[] = [
          { 
            id: '1', 
            marketName: 'Total Goals (Liverpool vs Chelsea)', 
            totalExposure: 82500, 
            lastUpdated: new Date().toISOString(),
            trend: 'up'
          },
          { 
            id: '2', 
            marketName: 'Total Corners (Man City vs Arsenal)', 
            totalExposure: 47800, 
            lastUpdated: new Date(Date.now() - 300000).toISOString(),
            trend: 'down'
          },
          { 
            id: '3', 
            marketName: 'Total Cards (Juventus vs Inter)', 
            totalExposure: 63200, 
            lastUpdated: new Date(Date.now() - 600000).toISOString(),
            trend: 'up'
          },
          { 
            id: '4', 
            marketName: 'First Goal Scorer (PSG vs Lyon)', 
            totalExposure: 38900, 
            lastUpdated: new Date(Date.now() - 900000).toISOString(),
            trend: 'stable'
          },
          { 
            id: '5', 
            marketName: 'Match Winner (Bayern vs Dortmund)', 
            totalExposure: 52100, 
            lastUpdated: new Date(Date.now() - 1200000).toISOString(),
            trend: 'up'
          }
        ];
        
        setMarkets(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch market exposure data:', error);
        toast({
          title: "Error",
          description: "Failed to load market exposure data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchExposure();
    
    // In a real app, you might want to refresh this data periodically
    const intervalId = setInterval(fetchExposure, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get the appropriate color class based on exposure level
  const getExposureColorClass = (exposure: number) => {
    const { level } = calculateSpreadMultiplier(exposure);
    
    switch (level) {
      case 'high':
        return 'text-red-500 font-bold';
      case 'medium':
        return 'text-yellow-500 font-semibold';
      default:
        return 'text-green-500';
    }
  };
  
  // Get trend icon and color
  const getTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ChevronUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <ChevronDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  if (loading) {
    return <div className="p-6 text-center">Loading market exposure data...</div>;
  }
  
  return (
    <div className="p-6 rounded-lg glass">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Market Risk Exposure</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="mb-6 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <div className="text-sm text-yellow-200">
          <span className="font-semibold">Risk Alert:</span> {markets.filter(m => m.totalExposure > 50000).length} markets currently have high exposure levels.
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead className="text-right">Total Exposure ($)</TableHead>
            <TableHead className="text-right">Risk Level</TableHead>
            <TableHead className="text-right">Trend</TableHead>
            <TableHead className="text-right">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const { level } = calculateSpreadMultiplier(market.totalExposure);
            
            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">{market.marketName}</TableCell>
                <TableCell className={`text-right ${getExposureColorClass(market.totalExposure)}`}>
                  ${market.totalExposure.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    level === 'high' ? 'bg-red-500/20 text-red-500' : 
                    level === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center">
                    {getTrendIndicator(market.trend)}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {new Date(market.lastUpdated).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminRiskDashboard;
