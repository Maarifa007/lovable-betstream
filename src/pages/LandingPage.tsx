
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Trophy, ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BottomNavigation } from "@/components/BottomNavigation";
import { WalletPreview } from "@/components/WalletPreview";

const LandingPage = () => {
  const { t, language } = useTranslation();
  const [walletBalance] = useState(0);

  const handleDeposit = () => {
    // Navigate to deposit flow
    console.log('Opening deposit modal');
  };

  return (
    <>
      <Helmet>
        <title>BanglaBet - {t('betting_assistant')}</title>
        <meta name="description" content={t('hero_subtitle')} />
      </Helmet>
      
      <div className="min-h-screen bg-background pb-20">
        {/* Top Navigation */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">BanglaBet</span>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Hero Section */}
        <div className="px-4 py-8 max-w-md mx-auto">
          {/* Rotating Promo Banner */}
          <Card className="mb-8 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/20">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-2">
                {language === 'en' 
                  ? `${t('bonus_banner')} ${t('bonus_banner').replace('200% Bonus! No Time Limit', '২০০% বোনাস! সময়ের সীমা নেই')}`
                  : `${t('bonus_banner')} 200% Bonus! No Time Limit`
                }
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? `${t('play_sports')} খেলুন ক্রিকেট, ফুটবল, কাবাডি!`
                  : `${t('play_sports')} Play Cricket, Soccer, Kabaddi!`
                }
              </p>
            </div>
          </Card>

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {t('hero_title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {t('hero_subtitle')}
            </p>
          </div>

          {/* Two Path CTAs */}
          <div className="space-y-4 mb-8">
            {/* Chat with Mikey */}
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{t('chat_with_mikey')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('welcome_mikey')}
                  </p>
                </div>
              </div>
              <Button 
                asChild 
                className="w-full h-12 text-lg"
              >
                <Link to="/chat" className="flex items-center justify-center gap-2">
                  {t('chat_with_mikey')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </Card>

            {/* Browse Sportsbook */}
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Trophy className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{t('browse_sportsbook')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('show_odds')}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                asChild 
                className="w-full h-12 text-lg"
              >
                <Link to="/sports/cricket" className="flex items-center justify-center gap-2">
                  {t('browse_sportsbook')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </Card>
          </div>

          {/* Bonus Offer */}
          <Card className="p-4 bg-accent/10 border-accent/20">
            <p className="text-sm text-center">
              <span className="font-semibold">{t('claim_bonus')}!</span>
              <br />
              {t('bonus_offer')}
            </p>
          </Card>
        </div>

        {/* Wallet Preview */}
        <WalletPreview 
          balance={walletBalance}
          onDeposit={handleDeposit}
        />

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </>
  );
};

export default LandingPage;
