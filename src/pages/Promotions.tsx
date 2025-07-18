import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Star, Trophy } from 'lucide-react';

const Promotions = () => {
  const { t, language } = useTranslation();

  const formatCurrency = (amount: number) => {
    return `${t('currency_symbol')}${amount.toLocaleString()}`;
  };

  const promotions = [
    {
      id: 1,
      title: language === 'en' ? '200% Welcome Bonus বোনাস' : '২০০% স্বাগত বোনাস Welcome Bonus',
      description: t('bonus_offer'),
      icon: Gift,
      color: 'from-green-500/20 to-emerald-500/20',
      buttonText: t('claim_bonus')
    },
    {
      id: 2,
      title: language === 'en' ? 'Weekly Cashback সাপ্তাহিক' : 'সাপ্তাহিক ক্যাশব্যাক Weekly',
      description: language === 'en' 
        ? 'Get 10% cashback on losses পরাজয়ে ১০% ক্যাশব্যাক' 
        : 'পরাজয়ে ১০% ক্যাশব্যাক Get 10% cashback',
      icon: Star,
      color: 'from-blue-500/20 to-cyan-500/20',
      buttonText: t('claim_bonus')
    },
    {
      id: 3,
      title: language === 'en' ? 'Cricket Special ক্রিকেট বিশেষ' : 'ক্রিকেট বিশেষ Cricket Special',
      description: language === 'en' 
        ? 'Enhanced odds on Bangladesh matches বাংলাদেশ ম্যাচে বর্ধিত অডস'
        : 'বাংলাদেশ ম্যাচে বর্ধিত অডস Enhanced odds',
      icon: Trophy,
      color: 'from-orange-500/20 to-red-500/20',
      buttonText: t('bet_now')
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('promotions')} - BanglaBet</title>
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
            <h1 className="text-2xl font-bold mb-2">{t('promotions')}</h1>
            <p className="text-muted-foreground">
              {language === 'en' 
                ? 'Exclusive offers and bonuses এক্সক্লুসিভ অফার ও বোনাস'
                : 'এক্সক্লুসিভ অফার ও বোনাস Exclusive offers and bonuses'
              }
            </p>
          </div>

          {/* Featured Promotion */}
          <Card className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <div className="text-center">
              <Gift className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {language === 'en' 
                  ? `${formatCurrency(5000)} → ${formatCurrency(15000)}!`
                  : `${formatCurrency(5000)} → ${formatCurrency(15000)}!`
                }
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {t('bonus_offer')}
              </p>
              <Button className="w-full">
                {t('deposit_now')}
              </Button>
            </div>
          </Card>

          {/* Promotions List */}
          <div className="space-y-4">
            {promotions.map((promo) => {
              const Icon = promo.icon;
              return (
                <Card key={promo.id} className={`p-4 bg-gradient-to-r ${promo.color}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background/20 rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{promo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {promo.description}
                      </p>
                      <Button size="sm" variant="outline">
                        {promo.buttonText}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Terms */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">
              {language === 'en' ? 'Terms & Conditions শর্তাবলী' : 'শর্তাবলী Terms & Conditions'}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {language === 'en' ? 'Minimum deposit required ন্যূনতম জমা' : 'ন্যূনতম জমা প্রয়োজন Minimum deposit'}</li>
              <li>• {language === 'en' ? '25x wagering requirement ২৫ বার বাজি' : '২৫ বার বাজির শর্ত 25x wagering'}</li>
              <li>• {language === 'en' ? 'Valid for 30 days ৩০ দিন বৈধ' : '৩০ দিনের জন্য বৈধ Valid for 30 days'}</li>
            </ul>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </>
  );
};

export default Promotions;