import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, CreditCard } from 'lucide-react';

const Wallet = () => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return `${t('currency_symbol')}${amount.toLocaleString()}`;
  };

  return (
    <>
      <Helmet>
        <title>{t('wallet_balance')} - BanglaBet</title>
      </Helmet>
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">BanglaBet</span>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Page Content */}
        <div className="px-4 py-6 max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{t('wallet_balance')}</h1>
            <p className="text-muted-foreground">{t('deposit_required')}</p>
          </div>

          {/* Balance Card */}
          <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="mb-4">
              <CreditCard className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">{t('balance')}</p>
              <p className="text-3xl font-bold">{formatCurrency(0)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('bonus_offer')}
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button className="h-16 flex flex-col gap-2">
              <Plus className="h-5 w-5" />
              {t('deposit_button')}
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Minus className="h-5 w-5" />
              {t('withdraw_button')}
            </Button>
          </div>

          {/* Payment Methods */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">{t('deposit_methods')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('funding_options')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <span className="font-medium">USDT</span>
                <span className="text-sm text-muted-foreground">Instant</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <span className="font-medium">bKash</span>
                <span className="text-sm text-muted-foreground">2-5 mins</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <span className="font-medium">Nagad</span>
                <span className="text-sm text-muted-foreground">2-5 mins</span>
              </div>
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">{t('transaction_history')}</h3>
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('deposit_required')}</p>
            </div>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </>
  );
};

export default Wallet;