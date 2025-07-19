import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/contexts/LanguageContext';

interface WalletPreviewProps {
  userId: string;
  onOpenFullWallet: () => void;
}

export default function WalletPreview({ userId, onOpenFullWallet }: WalletPreviewProps) {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [interestEnabled, setInterestEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
    loadInterestSettings();
  }, [userId]);

  const loadWalletData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-balance', {
        body: { userId }
      });

      if (error) throw error;

      if (data) {
        setBalance(data.betPoints || 0);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInterestSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('interest_settings')
        .select('enabled')
        .eq('user_id', userId)
        .single();

      if (settings) {
        setInterestEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Error loading interest settings:', error);
    }
  };

  const toggleInterest = async () => {
    try {
      const newState = !interestEnabled;
      
      const { error } = await supabase.functions.invoke('wallet-interest-toggle', {
        body: { 
          userId, 
          enabled: newState 
        }
      });

      if (error) throw error;

      setInterestEnabled(newState);
      
      toast({
        title: newState ? "Interest Enabled" : "Interest Disabled",
        description: newState 
          ? "You'll now earn 5% APY on your balance" 
          : "Interest earning has been disabled"
      });
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast({
        title: "Error",
        description: "Failed to update interest settings",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          <Badge variant={interestEnabled ? "default" : "secondary"}>
            {interestEnabled ? "5% APY" : "No Interest"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Available Balance</div>
          <div className="text-2xl font-bold">৳{balance.toLocaleString()}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">Interest Earning</span>
          </div>
          <Switch
            checked={interestEnabled}
            onCheckedChange={toggleInterest}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFullWallet}
            className="text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Deposit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFullWallet}
            className="text-xs"
          >
            <Percent className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}