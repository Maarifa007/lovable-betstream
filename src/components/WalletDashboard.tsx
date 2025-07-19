import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Smartphone, Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet, Gift, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/contexts/LanguageContext';
import WalletTransactionHistory from './WalletTransactionHistory';
import WalletTransferModal from './WalletTransferModal';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet_place' | 'bet_win' | 'bet_loss' | 'bonus';
  description: string;
  timestamp: Date;
  balance_after: number;
}

interface WalletDashboardProps {
  userId: string;
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

export default function WalletDashboard({ userId, balance, onBalanceUpdate }: WalletDashboardProps) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bonusProgress, setBonusProgress] = useState(0);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const loadWalletData = async () => {
    try {
      // Load wallet balance using edge function
      const { data: walletData, error: walletError } = await supabase.functions.invoke('wallet-balance', {
        body: { userId }
      });

      if (walletError) throw walletError;

      if (walletData) {
        setTotalDeposited(walletData.totalDeposited || 0);
        setTotalWithdrawn(walletData.totalWithdrawn || 0);
        
        // Calculate bonus progress (200% bonus example)
        const bonusEligible = walletData.totalDeposited * 2;
        const currentBalance = walletData.betPoints || 0;
        setBonusProgress(Math.min((currentBalance / bonusEligible) * 100, 100));
      }

      // Load transaction history using edge function
      const { data: historyData, error: historyError } = await supabase.functions.invoke('wallet-history', {
        body: { 
          userId, 
          filter: 'all',
          limit: 20,
          offset: 0
        }
      });

      if (historyError) throw historyError;

      if (historyData?.transactions) {
        setTransactions(historyData.transactions.map((tx: any) => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.transaction_type as any,
          description: tx.description || '',
          timestamp: new Date(tx.created_at),
          balance_after: tx.balance_after
        })));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
    }
  };

  const handleDeposit = async (method: 'bkash' | 'nagad' | 'usdt') => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await supabase.functions.invoke('process-deposit', {
        body: {
          userId,
          amount: parseFloat(depositAmount),
          method,
          language: 'en' // or 'bn' based on user preference
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Deposit Initiated",
        description: `Your ${method.toUpperCase()} deposit of ৳${depositAmount} has been initiated`,
      });

      // Update balance and reload data
      const newBalance = balance + parseFloat(depositAmount);
      onBalanceUpdate(newBalance);
      loadWalletData();
      setDepositAmount('');

    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit Failed",
        description: "Unable to process deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await supabase.functions.invoke('process-withdrawal', {
        body: {
          userId,
          amount: parseFloat(withdrawAmount)
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal of ৳${withdrawAmount} is being processed`,
      });

      // Update balance and reload data
      const newBalance = balance - parseFloat(withdrawAmount);
      onBalanceUpdate(newBalance);
      loadWalletData();
      setWithdrawAmount('');

    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Unable to process withdrawal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bet_win':
      case 'bonus':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
      case 'bet_place':
      case 'bet_loss':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bet_win':
      case 'bonus':
        return 'text-green-600';
      case 'withdrawal':
      case 'bet_place':
      case 'bet_loss':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for betting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{totalDeposited.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bonus Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">200% Bonus</span>
            </div>
            <Progress value={bonusProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{bonusProgress.toFixed(1)}% unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Deposit/Withdraw */}
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Amount in BDT"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-lg"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  onClick={() => handleDeposit('bkash')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-12"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  bKash
                </Button>
                
                <Button 
                  onClick={() => handleDeposit('nagad')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-12"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Nagad
                </Button>
                
                <Button 
                  onClick={() => handleDeposit('usdt')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-12"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  USDT
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Request a withdrawal to your preferred method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Amount in BDT"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg"
              />
              
              <Button 
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full h-12"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Withdrawals are processed within 24 hours. Minimum withdrawal: ৳100
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Money</CardTitle>
              <CardDescription>Transfer funds to another user instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transfer Money</h3>
                <p className="text-muted-foreground mb-4">
                  Send funds to friends, family, or other users instantly with zero fees
                </p>
                
                <WalletTransferModal
                  userId={userId}
                  currentBalance={balance}
                  onTransferComplete={loadWalletData}
                >
                  <Button className="w-full max-w-sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                </WalletTransferModal>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold text-green-600">₿0</p>
                  <p className="text-xs text-muted-foreground">Transfer Fee</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">⚡</p>
                  <p className="text-xs text-muted-foreground">Instant</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">🔒</p>
                  <p className="text-xs text-muted-foreground">Secure</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <WalletTransactionHistory userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}