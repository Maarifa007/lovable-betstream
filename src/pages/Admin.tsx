
import React, { useState, useEffect } from 'react';
import AdminSpreads from '@/components/AdminSpreads';
import AdminDashboard from '@/components/AdminDashboard';
import Header from '@/components/Header';
import { SpreadsProvider } from '@/contexts/SpreadsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const [walletBalance] = useState<number>(10000);
  const [exposureAlerts, setExposureAlerts] = useState<{
    id: string;
    market: string;
    exposure: number;
    timestamp: string;
  }[]>([]);
  
  // Simulate fetching exposure alerts
  useEffect(() => {
    // In a real application, this would be an API call or WebSocket subscription
    const mockAlerts = [
      {
        id: '101',
        market: 'Total Goals (Liverpool vs Chelsea)',
        exposure: 82500,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: '102',
        market: 'Total Corners (Man City vs Arsenal)',
        exposure: 67800,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    
    setExposureAlerts(mockAlerts);
  }, []);
  
  return (
    <SpreadsProvider>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
        {/* Header with less functionality for admin page */}
        <Header 
          walletBalance={walletBalance}
          onOpenWalletModal={() => {}}
          onOpenNewPositionModal={() => {}}
          userWallet="0xAdmin"
        />
        
        <div className="mt-8">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
          <Tabs defaultValue="spreads">
            <TabsList className="mb-6">
              <TabsTrigger value="spreads">Manage Spreads</TabsTrigger>
              <TabsTrigger value="dashboard">Analytics Dashboard</TabsTrigger>
              <TabsTrigger value="alerts">Risk Alerts ({exposureAlerts.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spreads">
              <AdminSpreads />
            </TabsContent>
            
            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>
            
            <TabsContent value="alerts">
              <div className="glass rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Risk Exposure Alerts</h2>
                
                {exposureAlerts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No risk alerts at this time.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exposureAlerts.map(alert => (
                      <div key={alert.id} className="bg-white/5 border border-red-500/20 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-red-400">{alert.market}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Exposure: <span className="text-red-500 font-medium">${alert.exposure.toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Alerted: {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-3 py-1 rounded text-sm">
                              Adjust Spread
                            </button>
                            <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 px-3 py-1 rounded text-sm">
                              Acknowledge
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white/5 rounded text-xs text-muted-foreground">
                          <p>Recommended action: Increase spread by 50% or temporarily limit new positions on this market.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SpreadsProvider>
  );
};

export default Admin;
