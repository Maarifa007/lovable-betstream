
import React, { useState, useEffect } from 'react';
import AdminSpreads from '@/components/AdminSpreads';
import AdminDashboard from '@/components/AdminDashboard';
import AdminRiskDashboard from '@/components/AdminRiskDashboard';
import AdminRiskAlerts from '@/components/AdminRiskAlerts';
import AdminSpreadAdjustment from '@/components/AdminSpreadAdjustment';
import HistoricalExposure from '@/components/HistoricalExposure';
import Header from '@/components/Header';
import LiveBettingChat from '@/components/LiveBettingChat';
import { SpreadsProvider } from '@/contexts/SpreadsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart3, History, PanelLeft, Wallet } from "lucide-react";

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
          
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Dashboard
              </TabsTrigger>
              <TabsTrigger value="risk">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risk Monitoring ({exposureAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="spreads">
                <PanelLeft className="h-4 w-4 mr-2" />
                Manage Spreads
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Historical Exposure
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>
            
            <TabsContent value="risk">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminRiskDashboard />
                <AdminRiskAlerts />
              </div>
            </TabsContent>
            
            <TabsContent value="spreads">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminSpreads />
                <AdminSpreadAdjustment />
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <HistoricalExposure />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Add LiveBettingChat assistant for admin interface */}
        <LiveBettingChat />
      </div>
    </SpreadsProvider>
  );
};

export default Admin;
