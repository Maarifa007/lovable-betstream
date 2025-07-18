import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import SportsNavigation from '@/components/SportsNavigation';
import { WalletPreview } from '@/components/WalletPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Cricket = () => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return `${t('currency_symbol')}${amount.toLocaleString()}`;
  };

  // Mock cricket matches data
  const matches = [
    {
      id: 1,
      home: 'Bangladesh',
      away: 'India',
      time: '2:00 PM',
      odds: { home: 2.5, away: 1.8 },
      market: 'Match Winner'
    },
    {
      id: 2,
      home: 'Pakistan',
      away: 'Sri Lanka',
      time: '7:00 PM',
      odds: { home: 1.9, away: 2.1 },
      market: 'Match Winner'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('cricket')} - BanglaBet</title>
      </Helmet>
      
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">BanglaBet</span>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Sports Navigation */}
        <SportsNavigation selectedSport="cricket" onSelectSport={() => {}} />

        {/* Page Content */}
        <div className="px-4 max-w-md mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{t('cricket')} 🏏</h1>
            <p className="text-muted-foreground">{t('live_betting')} & {t('upcoming_matches')}</p>
          </div>

          {/* Matches */}
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{match.home} vs {match.away}</h3>
                    <p className="text-sm text-muted-foreground">{match.time} • {match.market}</p>
                  </div>
                  <span className="bg-accent/20 text-accent-foreground px-2 py-1 rounded text-xs">
                    LIVE
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <span className="text-sm font-medium">{match.home}</span>
                    <span className="text-lg font-bold text-primary">{match.odds.home}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <span className="text-sm font-medium">{match.away}</span>
                    <span className="text-lg font-bold text-primary">{match.odds.away}</span>
                  </Button>
                </div>

                <div className="mt-3 text-center">
                  <Button className="w-full">
                    {t('bet_now')} • {formatCurrency(100)} → {formatCurrency(250)}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Wallet Preview */}
        <WalletPreview balance={0} />

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </>
  );
};

export default Cricket;