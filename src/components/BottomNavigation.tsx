import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Trophy, Wallet, Gift } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: t('home'),
      isActive: location.pathname === '/'
    },
    { 
      path: '/chat', 
      icon: MessageCircle, 
      label: t('chat_with_mikey'),
      isActive: location.pathname === '/chat'
    },
    { 
      path: '/sports/cricket', 
      icon: Trophy, 
      label: t('sportsbook'),
      isActive: location.pathname.startsWith('/sports')
    },
    { 
      path: '/wallet', 
      icon: Wallet, 
      label: t('wallet_balance'),
      isActive: location.pathname === '/wallet'
    },
    { 
      path: '/promotions', 
      icon: Gift, 
      label: t('promotions'),
      isActive: location.pathname === '/promotions'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                item.isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate max-w-[60px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};