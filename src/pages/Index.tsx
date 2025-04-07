import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WebSocketService from "@/services/webSocketService";
import WalletModal from "@/components/WalletModal";
import NewPositionModal from "@/components/NewPositionModal";
import Header from "@/components/Header";
import BetHistory from "@/components/BetHistory";
import { toast } from "@/hooks/use-toast";
import { SpreadsProvider } from "@/contexts/SpreadsContext";
import Sidebar from "@/components/Sidebar";
import MarketView from "@/components/MarketView";
import BetSlip from "@/components/BetSlip";
import LiveBettingChat from "@/components/LiveBettingChat";
import { fetchMarketData } from "@/utils/apiUtils";
import { debounce } from "lodash";
import { getUserAccount, AccountType } from "@/utils/betUtils";

interface Market {
  id: number;
  home: string;
  away: string;
  time: string;
  market: string;
  spread: string;
  sellPrice: string;
  buyPrice: string;
  updatedFields?: string[];
}

const USER_WALLET_ADDRESS = "0x1234...5678";

const Index = () => {
  const [selectedSport, setSelectedSport] = useState("football");
  const [liveMatches, setLiveMatches] = useState<Market[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNewPositionModalOpen, setIsNewPositionModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Market | null>(null);
  const [betAction, setBetAction] = useState<'buy' | 'sell' | null>(null);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const wsRef = useRef<WebSocketService | null>(null);
  const priceRefs = useRef<Record<string, HTMLDivElement>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const account = getUserAccount(USER_WALLET_ADDRESS);
    setAccountType(account.accountType);
    setVirtualBalance(account.virtualBalance);
    setWalletBalance(account.walletBalance);
    
    const hasChosenAccount = localStorage.getItem(`account_chosen_${USER_WALLET_ADDRESS}`);
    
    if (!hasChosenAccount) {
      setShowAccountSelection(true);
      setIsWalletModalOpen(true);
    }
    
    const handleOpenWalletModal = () => {
      setIsWalletModalOpen(true);
    };
    
    window.addEventListener('openWalletModal', handleOpenWalletModal);
    
    setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);
    
    return () => {
      window.removeEventListener('openWalletModal', handleOpenWalletModal);
    };
  }, []);

  const debouncedUpdateMarkets = useRef(
    debounce((updates: any[]) => {
      console.log(`Applying batch update for ${updates.length} markets`);
      setLiveMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          const update = updates.find(u => u.id === match.id);
          if (!update) return match;
          
          return { 
            ...match, 
            sellPrice: update.sellPrice || match.sellPrice,
            buyPrice: update.buyPrice || match.buyPrice,
            updatedFields: ['sellPrice', 'buyPrice']
          };
        });
        
        return updatedMatches;
      });
      
      updates.forEach(update => {
        if (priceRefs.current[`${update.id}-sellPrice`]) {
          priceRefs.current[`${update.id}-sellPrice`].classList.add('flash-update');
          setTimeout(() => {
            priceRefs.current[`${update.id}-sellPrice`]?.classList.remove('flash-update');
          }, 1000);
        }
        
        if (priceRefs.current[`${update.id}-buyPrice`]) {
          priceRefs.current[`${update.id}-buyPrice`].classList.add('flash-update');
          setTimeout(() => {
            priceRefs.current[`${update.id}-buyPrice`]?.classList.remove('flash-update');
          }, 1000);
        }
      });
    }, 500)
  ).current;

  const handleBalanceUpdate = async (newBalance: number) => {
    try {
      const account = getUserAccount(USER_WALLET_ADDRESS);
      
      if (account.accountType === 'free') {
        account.virtualBalance = newBalance;
        setVirtualBalance(newBalance);
      } else {
        account.walletBalance = newBalance;
        setWalletBalance(newBalance);
      }
      
      localStorage.setItem(`userAccount_${USER_WALLET_ADDRESS}`, JSON.stringify(account));
      
      const displayBalance = account.accountType === 'free' ? account.virtualBalance : account.walletBalance;
      
      toast({
        title: "Balance Updated",
        description: `Your ${account.accountType === 'free' ? 'Gold Coins' : 'USDC'} balance is now ${displayBalance.toLocaleString()}`
      });
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({
        title: "Error",
        description: "Failed to update balance. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const { data: initialMarkets, isLoading, error } = useQuery({
    queryKey: ['markets', selectedSport],
    queryFn: async () => fetchMarketData(selectedSport),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !isAppLoading
  });

  useEffect(() => {
    if (initialMarkets) {
      setLiveMatches(initialMarkets);
    }

    if (!wsRef.current) {
      wsRef.current = new WebSocketService('wss://stream.your-service.com/markets');
      
      wsRef.current.addOpenHandler(() => {
        console.log("✅ WebSocket connected successfully.");
        toast({
          title: "Connected",
          description: "Live updates are now active",
          variant: "default"
        });
      });
      
      wsRef.current.addErrorHandler((error) => {
        console.error("❌ WebSocket encountered an error:", error);
      });
      
      wsRef.current.addCloseHandler((event) => {
        console.warn("⚠️ WebSocket disconnected. Attempting to reconnect...");
        if (event.code !== 1000) {
          toast({
            title: "Connection Lost",
            description: "Attempting to reconnect to live updates...",
            variant: "destructive"
          });
        }
      });
      
      wsRef.current.addMessageHandler((event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'market_update' && data.id) {
            console.log(`📊 Received market update for ${data.id}:`, data);
            debouncedUpdateMarkets([data]);
          }
          
          if (data.type === 'market_updates' && Array.isArray(data.updates)) {
            console.log(`📊 Batch update received for ${data.updates.length} markets.`);
            debouncedUpdateMarkets(data.updates);
          }
          
          if (data.type === 'balance_update' && data.userId === USER_WALLET_ADDRESS) {
            console.log(`💰 Received balance update:`, data);
            
            const account = getUserAccount(USER_WALLET_ADDRESS);
            if (data.accountType === 'free') {
              setVirtualBalance(data.balance);
              account.virtualBalance = data.balance;
            } else {
              setWalletBalance(data.balance);
              account.walletBalance = data.balance;
            }
            
            localStorage.setItem(`userAccount_${USER_WALLET_ADDRESS}`, JSON.stringify(account));
          }
        } catch (error) {
          console.error("❌ WebSocket message error:", error);
        }
      });
      
      wsRef.current.connect();
    }

    return () => {
      debouncedUpdateMarkets.cancel();
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [initialMarkets, queryClient, selectedSport, debouncedUpdateMarkets]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const account = getUserAccount(USER_WALLET_ADDRESS);
      
      if (account.accountType !== accountType) {
        setAccountType(account.accountType);
      }
      
      if (account.virtualBalance !== virtualBalance) {
        setVirtualBalance(account.virtualBalance);
      }
      
      if (account.walletBalance !== walletBalance) {
        setWalletBalance(account.walletBalance);
      }
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [accountType, virtualBalance, walletBalance]);

  const handleOpenNewPosition = (match: Market, action: 'buy' | 'sell') => {
    setSelectedMatch(match);
    setBetAction(action);
    setIsNewPositionModalOpen(true);
  };

  const displayBalance = accountType === 'free' ? virtualBalance : walletBalance;

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium mb-2">Getting your account ready...</h2>
          <p className="text-muted-foreground">Loading your betting profile and market data</p>
        </div>
      </div>
    );
  }

  return (
    <SpreadsProvider>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        <Header 
          walletBalance={displayBalance}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onOpenNewPositionModal={() => setIsNewPositionModalOpen(true)}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
          onBalanceUpdate={handleBalanceUpdate}
          accountType={accountType}
        />

        <div className="flex h-[calc(100vh-64px)]">
          <Sidebar 
            selectedSport={selectedSport}
            onSelectSport={setSelectedSport}
          />
          
          <MarketView 
            matches={liveMatches}
            isLoading={isLoading}
            error={error}
            onOpenNewPosition={handleOpenNewPosition}
            priceRefs={priceRefs}
          />
          
          <BetSlip />
        </div>
        
        <LiveBettingChat />
        
        <WalletModal 
          isOpen={isWalletModalOpen} 
          onClose={() => {
            setIsWalletModalOpen(false);
            localStorage.setItem(`account_chosen_${USER_WALLET_ADDRESS}`, "true");
          }}
          balance={displayBalance}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
          accountSelection={showAccountSelection}
          onAccountTypeSelected={() => {
            localStorage.setItem(`account_chosen_${USER_WALLET_ADDRESS}`, "true");
            setShowAccountSelection(false);
          }}
        />
        
        <NewPositionModal 
          isOpen={isNewPositionModalOpen} 
          onClose={() => setIsNewPositionModalOpen(false)} 
          match={selectedMatch || undefined}
          action={betAction || undefined}
          accountType={accountType}
        />
      </div>
    </SpreadsProvider>
  );
};

export default Index;
