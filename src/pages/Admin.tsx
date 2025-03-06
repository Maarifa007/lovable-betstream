
import React, { useState } from 'react';
import AdminSpreads from '@/components/AdminSpreads';
import Header from '@/components/Header';
import { SpreadsProvider } from '@/contexts/SpreadsContext';

const Admin = () => {
  const [walletBalance] = useState<number>(10000);
  
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
          
          <div className="space-y-6">
            <AdminSpreads />
            
            {/* You can add more admin components here */}
          </div>
        </div>
      </div>
    </SpreadsProvider>
  );
};

export default Admin;
