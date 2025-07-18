import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Wallet, Settings, TrendingUp } from 'lucide-react';
import MikeyChat from '@/components/MikeyChat';
import WalletDashboard from '@/components/WalletDashboard';
import AdminControl from '@/components/AdminControl';
import { Loader2 } from 'lucide-react';

export default function BetChat() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        navigate('/auth');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile to check admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setIsAdmin(profile.is_admin || false);
      }

      // Load wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('bet_points')
        .eq('user_id', userId)
        .single();

      if (wallet) {
        setUserBalance(wallet.bet_points || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    } else {
      navigate('/auth');
    }
  };

  const handleDepositRequest = () => {
    // This would typically open a deposit modal or redirect to payment
    toast({
      title: "Deposit Request",
      description: "Redirecting to deposit options...",
    });
  };

  const handleBetPlaced = (bet: any) => {
    toast({
      title: "Bet Placed",
      description: `Your bet of ৳${bet.stake} has been placed successfully`,
    });
    
    // Update balance
    setUserBalance(prev => prev - bet.stake);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setUserBalance(newBalance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium mb-2">Loading BanglaBet...</h2>
          <p className="text-muted-foreground">Setting up your account</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              BanglaBet
            </h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.user_metadata?.display_name || user.email?.split('@')[0]}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">৳{userBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Available Balance</p>
            </div>
            
            {isAdmin && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Admin
              </span>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Chat & Bet</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MikeyChat
                  userBalance={userBalance}
                  onDepositRequest={handleDepositRequest}
                  onBetPlaced={handleBetPlaced}
                />
              </div>
              
              <div className="space-y-4">
                {/* Quick Stats */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Today's Highlights</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Active Bets:</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Live Matches:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus Available:</span>
                        <span className="font-medium text-green-600">৳200</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Promotion Banner */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold mb-2">🎁 200% Welcome Bonus</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get up to ৳10,000 bonus on your first deposit
                    </p>
                    <Button size="sm" onClick={handleDepositRequest}>
                      Claim Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <WalletDashboard
              userId={user.id}
              balance={userBalance}
              onBalanceUpdate={handleBalanceUpdate}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminControl isAdmin={isAdmin} />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <p className="text-sm text-muted-foreground">
                      {user.user_metadata?.display_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Type</label>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? 'Administrator' : 'Standard User'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}