
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WithdrawalApproval from './WithdrawalApproval';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  walletAddress: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalUsers: 0,
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const { toast } = useToast();

  // Simulate fetching stats and withdrawal requests
  useEffect(() => {
    // For demo purposes, we'll use mock data
    setStats({
      totalDeposits: 25000,
      totalWithdrawals: 15000,
      totalUsers: 500,
    });

    setWithdrawalRequests([
      {
        id: '1',
        userId: 'user123',
        amount: 500,
        walletAddress: '0x1234...5678',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user456',
        amount: 1000,
        walletAddress: '0x8765...4321',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }, []);

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawalRequests(prevRequests => 
      prevRequests.filter(request => request.id !== id)
    );
  };

  const handleRejectWithdrawal = (id: string) => {
    setWithdrawalRequests(prevRequests => 
      prevRequests.filter(request => request.id !== id)
    );
  };

  const handleSendReport = () => {
    // In a real app, this would call an API endpoint to trigger an email report
    toast({
      title: "Report Sent",
      description: "Analytics report has been sent to admin email",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="analytics">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="withdrawals">Pending Withdrawals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">${stats.totalDeposits.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">${stats.totalWithdrawals.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">{stats.totalUsers.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end mb-6">
            <Button onClick={handleSendReport}>
              Send Report to Email
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <WithdrawalApproval />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
