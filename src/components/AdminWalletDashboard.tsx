import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, TrendingUp, Clock, Search, UserPlus, Settings } from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string;
  bet_points: number;
  total_deposited: number;
  total_withdrawn: number;
  is_admin: boolean;
  interest_enabled?: boolean;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  wallet_address: string;
  status: string;
  created_at: string;
  user_email?: string;
}

const AdminWalletDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWalletBalance: 0,
    activeInterestAccounts: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [manualAdjustment, setManualAdjustment] = useState({ amount: '', type: 'deposit', description: '' });
  const [globalAPY, setGlobalAPY] = useState(5.0);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users with wallet data
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          wallets (bet_points, total_deposited, total_withdrawn),
          interest_settings (enabled)
        `);

      if (usersError) throw usersError;

      const processedUsers = usersData?.map((user: any) => ({
        id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        bet_points: user.wallets?.[0]?.bet_points || 0,
        total_deposited: user.wallets?.[0]?.total_deposited || 0,
        total_withdrawn: user.wallets?.[0]?.total_withdrawn || 0,
        is_admin: user.is_admin,
        interest_enabled: user.interest_settings?.[0]?.enabled || false,
      })) || [];

      setUsers(processedUsers);

      // Calculate stats
      const totalUsers = processedUsers.length;
      const totalWalletBalance = processedUsers.reduce((sum, user) => sum + user.bet_points, 0);
      const activeInterestAccounts = processedUsers.filter(user => user.interest_enabled).length;
      const totalDeposits = processedUsers.reduce((sum, user) => sum + user.total_deposited, 0);
      const totalWithdrawals = processedUsers.reduce((sum, user) => sum + user.total_withdrawn, 0);

      setStats({
        totalUsers,
        totalWalletBalance,
        activeInterestAccounts,
        totalDeposits,
        totalWithdrawals,
      });

      // Fetch withdrawal requests
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles (email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      const processedWithdrawals = withdrawalsData?.map((withdrawal: any) => ({
        ...withdrawal,
        user_email: withdrawal.profiles?.email || 'Unknown',
      })) || [];

      setWithdrawalRequests(processedWithdrawals);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleUserSearch = (userId: string) => {
    const user = users.find(u => u.id === userId || u.email.includes(userId));
    setSelectedUser(user || null);
    if (!user) {
      toast({
        title: "User not found",
        description: "No user found with that ID or email",
        variant: "destructive",
      });
    }
  };

  const handleManualAdjustment = async () => {
    if (!selectedUser || !manualAdjustment.amount) return;

    try {
      const amount = parseFloat(manualAdjustment.amount);
      const adjustedAmount = manualAdjustment.type === 'withdraw' ? -amount : amount;

      const { error } = await supabase.functions.invoke('admin-balance-update', {
        body: {
          userId: selectedUser.id,
          amount: adjustedAmount,
          type: manualAdjustment.type,
          description: manualAdjustment.description || `Manual ${manualAdjustment.type} by admin`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully ${manualAdjustment.type === 'withdraw' ? 'debited' : 'credited'} ৳${amount}`,
      });

      // Refresh data
      fetchDashboardData();
      setManualAdjustment({ amount: '', type: 'deposit', description: '' });

    } catch (error) {
      console.error('Manual adjustment error:', error);
      toast({
        title: "Error",
        description: "Failed to process manual adjustment",
        variant: "destructive",
      });
    }
  };

  const toggleUserInterest = async (userId: string, enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('wallet-interest-toggle', {
        body: { userId, enabled },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Interest ${enabled ? 'enabled' : 'disabled'} for user`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Interest toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle interest",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawalAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Withdrawal ${action}d successfully`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error(`Withdrawal ${action} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} withdrawal`,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Wallet Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="interest">Interest System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{stats.totalWalletBalance.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interest Accounts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeInterestAccounts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">৳{stats.totalDeposits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">৳{stats.totalWithdrawals.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="user-search">Search User (ID or Email)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="user-search"
                      placeholder="Enter user ID or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={() => handleUserSearch(searchTerm)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {selectedUser && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedUser.display_name || selectedUser.email}</h3>
                    <Badge variant={selectedUser.is_admin ? "default" : "secondary"}>
                      {selectedUser.is_admin ? "Admin" : "User"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Balance</Label>
                      <p className="text-2xl font-bold">৳{selectedUser.bet_points.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Interest Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedUser.interest_enabled ? "default" : "secondary"}>
                          {selectedUser.interest_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => toggleUserInterest(selectedUser.id, !selectedUser.interest_enabled)}
                        >
                          Toggle
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Manual Balance Adjustment</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Amount"
                        value={manualAdjustment.amount}
                        onChange={(e) => setManualAdjustment({ ...manualAdjustment, amount: e.target.value })}
                      />
                      <Select
                        value={manualAdjustment.type}
                        onValueChange={(value) => setManualAdjustment({ ...manualAdjustment, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdraw">Withdraw</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Description"
                        value={manualAdjustment.description}
                        onChange={(e) => setManualAdjustment({ ...manualAdjustment, description: e.target.value })}
                      />
                      <Button onClick={handleManualAdjustment}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>All Users</Label>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div>
                        <p className="font-medium">{user.display_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">৳{user.bet_points.toLocaleString()}</p>
                        <div className="flex gap-1">
                          {user.is_admin && <Badge variant="default" className="text-xs">Admin</Badge>}
                          {user.interest_enabled && <Badge variant="secondary" className="text-xs">Interest</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending withdrawal requests</p>
                ) : (
                  withdrawalRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{request.user_email}</h3>
                          <p className="text-sm text-muted-foreground">
                            ৳{request.amount.toLocaleString()} via {request.method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                          {request.wallet_address && (
                            <p className="text-xs text-muted-foreground">
                              Address: {request.wallet_address}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleWithdrawalAction(request.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleWithdrawalAction(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interest System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Active Interest Accounts</Label>
                  <p className="text-2xl font-bold">{stats.activeInterestAccounts}</p>
                </div>
                <div>
                  <Label>Current APY Rate</Label>
                  <p className="text-2xl font-bold">{globalAPY}%</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Interest-Enabled Users</Label>
                {users.filter(user => user.interest_enabled).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{user.display_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">Balance: ৳{user.bet_points.toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserInterest(user.id, false)}
                    >
                      Disable Interest
                    </Button>
                  </div>
                ))}
                {users.filter(user => user.interest_enabled).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No users have interest enabled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="global-apy">Global Interest APY Rate (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="global-apy"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={globalAPY}
                    onChange={(e) => setGlobalAPY(parseFloat(e.target.value) || 0)}
                  />
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Update APY
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Label>Manual Interest Payout</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Trigger manual interest calculation and payout for all eligible users
                </p>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Run Interest Payout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWalletDashboard;