import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Users, 
  TrendingUp, 
  Trophy, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Edit,
  Plus,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Contest {
  id: string;
  title: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  entry_fee: number;
  prize_pool: number;
  status: 'upcoming' | 'live' | 'completed';
  max_participants?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  bet_points: number;
  total_deposited: number;
  is_admin: boolean;
  created_at: string;
}

interface AdminControlProps {
  isAdmin: boolean;
}

export default function AdminControl({ isAdmin }: AdminControlProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newContest, setNewContest] = useState({
    title: '',
    sport_type: '',
    start_time: '',
    end_time: '',
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 100
  });

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    try {
      // Load contests
      const { data: contestsData } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });

      if (contestsData) {
        setContests(contestsData.map(contest => ({
          ...contest,
          status: contest.status as 'upcoming' | 'live' | 'completed'
        })));
      }

      // Load users with wallet info
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          *,
          wallets (
            bet_points,
            total_deposited
          )
        `)
        .limit(50);

      if (usersData) {
        const formattedUsers = usersData.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          bet_points: Array.isArray(user.wallets) ? user.wallets[0]?.bet_points || 0 : 0,
          total_deposited: Array.isArray(user.wallets) ? user.wallets[0]?.total_deposited || 0 : 0,
          is_admin: user.is_admin || false,
          created_at: user.created_at
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const createContest = async () => {
    if (!newContest.title || !newContest.sport_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('contests')
        .insert([{
          ...newContest,
          start_time: new Date(newContest.start_time).toISOString(),
          end_time: new Date(newContest.end_time).toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Contest Created",
        description: `${newContest.title} has been created successfully`,
      });

      // Reset form and reload data
      setNewContest({
        title: '',
        sport_type: '',
        start_time: '',
        end_time: '',
        entry_fee: 0,
        prize_pool: 0,
        max_participants: 100
      });
      
      loadAdminData();
    } catch (error) {
      console.error('Error creating contest:', error);
      toast({
        title: "Error",
        description: "Failed to create contest",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContestStatus = async (contestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contests')
        .update({ status })
        .eq('id', contestId);

      if (error) throw error;

      toast({
        title: "Contest Updated",
        description: `Contest status changed to ${status}`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error updating contest:', error);
      toast({
        title: "Error",
        description: "Failed to update contest",
        variant: "destructive"
      });
    }
  };

  const gradeContest = async (contestId: string, result: string) => {
    try {
      const { error } = await supabase
        .from('contests')
        .update({ 
          result,
          status: 'completed'
        })
        .eq('id', contestId);

      if (error) throw error;

      // Call grading function
      await supabase.functions.invoke('grade-contest', {
        body: { contestId, result }
      });

      toast({
        title: "Contest Graded",
        description: `Contest has been graded and payouts processed`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error grading contest:', error);
      toast({
        title: "Error",
        description: "Failed to grade contest",
        variant: "destructive"
      });
    }
  };

  const updateUserBalance = async (userId: string, amount: number, type: 'add' | 'subtract') => {
    try {
      const { error } = await supabase.functions.invoke('admin-balance-update', {
        body: {
          userId,
          amount: type === 'add' ? amount : -amount,
          description: `Admin ${type === 'add' ? 'credit' : 'debit'} adjustment`
        }
      });

      if (error) throw error;

      toast({
        title: "Balance Updated",
        description: `User balance has been ${type === 'add' ? 'increased' : 'decreased'}`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'live':
        return <Badge variant="default">Live</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have admin privileges to access this panel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <Badge variant="outline" className="px-3 py-1">
          <Settings className="h-4 w-4 mr-1" />
          Admin Mode
        </Badge>
      </div>

      <Tabs defaultValue="contests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="create">Create Contest</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="contests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Contests</CardTitle>
              <CardDescription>View and manage all betting contests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead>Prize Pool</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell className="font-medium">{contest.title}</TableCell>
                      <TableCell>{contest.sport_type}</TableCell>
                      <TableCell>{getStatusBadge(contest.status)}</TableCell>
                      <TableCell>৳{contest.entry_fee}</TableCell>
                      <TableCell>৳{contest.prize_pool}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {contest.status === 'upcoming' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateContestStatus(contest.id, 'live')}
                            >
                              Start
                            </Button>
                          )}
                          {contest.status === 'live' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const result = prompt('Enter contest result:');
                                if (result) gradeContest(contest.id, result);
                              }}
                            >
                              Grade
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Total Deposited</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>৳{user.bet_points.toLocaleString()}</TableCell>
                      <TableCell>৳{user.total_deposited.toLocaleString()}</TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const amount = prompt('Amount to add:');
                              if (amount) updateUserBalance(user.id, parseFloat(amount), 'add');
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const amount = prompt('Amount to subtract:');
                              if (amount) updateUserBalance(user.id, parseFloat(amount), 'subtract');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Contest</CardTitle>
              <CardDescription>Set up a new betting contest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contest Title</label>
                  <Input
                    value={newContest.title}
                    onChange={(e) => setNewContest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Bangladesh vs India Cricket Match"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sport Type</label>
                  <Select
                    value={newContest.sport_type}
                    onValueChange={(value) => setNewContest(prev => ({ ...prev, sport_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="kabaddi">Kabaddi</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={newContest.start_time}
                    onChange={(e) => setNewContest(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={newContest.end_time}
                    onChange={(e) => setNewContest(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Entry Fee (৳)</label>
                  <Input
                    type="number"
                    value={newContest.entry_fee}
                    onChange={(e) => setNewContest(prev => ({ ...prev, entry_fee: parseFloat(e.target.value) }))}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prize Pool (৳)</label>
                  <Input
                    type="number"
                    value={newContest.prize_pool}
                    onChange={(e) => setNewContest(prev => ({ ...prev, prize_pool: parseFloat(e.target.value) }))}
                    placeholder="1000"
                  />
                </div>
              </div>

              <Button 
                onClick={createContest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Contest'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Maintenance Mode</h4>
                  <p className="text-sm text-muted-foreground">Temporarily disable betting</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Auto-grade Contests</h4>
                  <p className="text-sm text-muted-foreground">Automatically grade simple contests</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Bengali Language Support</h4>
                  <p className="text-sm text-muted-foreground">Enable Bengali interface</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}