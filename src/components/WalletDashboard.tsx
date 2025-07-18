import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Smartphone, Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet, Gift } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Load wallet info
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (wallet) {
        setTotalDeposited(wallet.total_deposited || 0);
        setTotalWithdrawn(wallet.total_withdrawn || 0);
        
        // Calculate bonus progress (200% bonus example)
        const bonusEligible = wallet.total_deposited * 2;
        const currentBalance = wallet.bet_points || 0;
        setBonusProgress(Math.min((currentBalance / bonusEligible) * 100, 100));
      }

      // Load transactions
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txns) {
        setTransactions(txns.map(tx => ({
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
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
      </Tabs>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.type.includes('deposit') || transaction.type.includes('win') || transaction.type.includes('bonus') ? '+' : '-'}
                      ৳{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: ৳{transaction.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}