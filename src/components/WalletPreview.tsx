import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface WalletPreviewProps {
  balance?: number;
  onDeposit?: () => void;
}

export const WalletPreview: React.FC<WalletPreviewProps> = ({ 
  balance = 0, 
  onDeposit 
}) => {
  const { t } = useTranslation();
  
  const formatCurrency = (amount: number) => {
    return `${t('currency_symbol')}${amount.toLocaleString()}`;
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 p-4 bg-card/95 backdrop-blur-sm border shadow-lg z-40 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('wallet_balance')}</p>
            <p className="text-lg font-bold">{formatCurrency(balance)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={onDeposit}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t('deposit_button')}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            asChild
          >
            <Link to="/wallet">
              {t('balance')}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};