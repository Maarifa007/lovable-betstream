import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter, Search, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  balance_after: number;
}

interface WalletTransactionHistoryProps {
  userId: string;
}

export default function WalletTransactionHistory({ userId }: WalletTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactionHistory();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, typeFilter, dateRange]);

  const loadTransactionHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-history', {
        body: {
          userId,
          filter: 'all',
          limit: 100,
          offset: 0
        }
      });

      if (error) throw error;

      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === typeFilter);
    }

    // Date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        const isAfterFrom = !dateRange?.from || txDate >= dateRange.from;
        const isBeforeTo = !dateRange?.to || txDate <= dateRange.to;
        return isAfterFrom && isBeforeTo;
      });
    }

    setFilteredTransactions(filtered);
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Description', 'Balance After'].join(','),
      ...filteredTransactions.map(tx => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.transaction_type,
        tx.amount,
        `"${tx.description}"`,
        tx.balance_after
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Transaction history exported successfully"
    });
  };

  const getTransactionIcon = (type: string) => {
    const isCredit = ['deposit', 'bet_win', 'bonus', 'interest', 'transfer_receive'].includes(type);
    return isCredit ? 
      <ArrowDownLeft className="h-4 w-4 text-green-500" /> : 
      <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    const isCredit = ['deposit', 'bet_win', 'bonus', 'interest', 'transfer_receive'].includes(type);
    return isCredit ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'bet_place': 'Bet Placed',
      'bet_win': 'Bet Win',
      'bet_loss': 'Bet Loss',
      'bonus': 'Bonus',
      'interest': 'Interest',
      'transfer_send': 'Transfer Sent',
      'transfer_receive': 'Transfer Received'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button onClick={exportTransactions} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="bet_place">Bets Placed</SelectItem>
              <SelectItem value="bet_win">Bet Wins</SelectItem>
              <SelectItem value="bonus">Bonuses</SelectItem>
              <SelectItem value="interest">Interest</SelectItem>
              <SelectItem value="transfer_send">Transfers Sent</SelectItem>
              <SelectItem value="transfer_receive">Transfers Received</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange?.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setDateRange(undefined);
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
          {(searchTerm || typeFilter !== 'all' || dateRange?.from || dateRange?.to) && (
            <Badge variant="secondary">Filtered</Badge>
          )}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{transaction.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.amount >= 0 ? '+' : ''}৳{transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Balance: ৳{transaction.balance_after.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}