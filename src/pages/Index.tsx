
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

// Type definitions
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

// User wallet address for wallet updates
const USER_WALLET_ADDRESS = "0x1234...5678"; // This would be from authentication in a real app

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

  // Check if user has selected account type yet
  useEffect(() => {
    // Get user account
    const account = getUserAccount(USER_WALLET_ADDRESS);
    setAccountType(account.accountType);
    setVirtualBalance(account.virtualBalance);
    setWalletBalance(account.walletBalance);
    
    // Check if account has been chosen
    const hasChosenAccount = localStorage.getItem(`account_chosen_${USER_WALLET_ADDRESS}`);
    
    // If they haven't chosen an account type and just opened the app, show wallet modal with account selection
    if (!hasChosenAccount) {
      setShowAccountSelection(true);
      setIsWalletModalOpen(true);
    }
    
    // Listen for wallet modal open requests from LiveBettingChat
    const handleOpenWalletModal = () => {
      setIsWalletModalOpen(true);
    };
    
    window.addEventListener('openWalletModal', handleOpenWalletModal);
    
    // Simulate loading application data
    setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);
    
    return () => {
      window.removeEventListener('openWalletModal', handleOpenWalletModal);
    };
  }, []);

  // Create a debounced market update function to reduce unnecessary re-renders
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
      
      // Flash the updated price elements
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

  // Handler for balance updates with API call
  const handleBalanceUpdate = async (newBalance: number) => {
    try {
      // Update user account
      const account = getUserAccount(USER_WALLET_ADDRESS);
      
      // Update appropriate balance based on account type
      if (account.accountType === 'free') {
        account.virtualBalance = newBalance;
        setVirtualBalance(newBalance);
      } else {
        account.walletBalance = newBalance;
        setWalletBalance(newBalance);
      }
      
      // Save updated account
      localStorage.setItem(`userAccount_${USER_WALLET_ADDRESS}`, JSON.stringify(account));
      
      // Update UI state for the active balance display
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

  // Fetch initial market data with improved error handling and fallback
  const { data: initialMarkets, isLoading, error } = useQuery({
    queryKey: ['markets', selectedSport],
    queryFn: async () => fetchMarketData(selectedSport),
    retry: 3, // Retry up to 3 times if the API call fails
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential retry delay
    enabled: !isAppLoading // Only start fetching after initial app loading is complete
  });

  useEffect(() => {
    // Set initial markets
    if (initialMarkets) {
      setLiveMatches(initialMarkets);
    }

    // WebSocket connection for live updates with enhanced logging and event handling
    if (!wsRef.current) {
      wsRef.current = new WebSocketService('wss://stream.your-service.com/markets');
      
      // Add open handler for successful connections
      wsRef.current.addOpenHandler(() => {
        console.log("✅ WebSocket connected successfully.");
        toast({
          title: "Connected",
          description: "Live updates are now active",
          variant: "default"
        });
      });
      
      // Add error handler for WebSocket errors
      wsRef.current.addErrorHandler((error) => {
        console.error("❌ WebSocket encountered an error:", error);
      });
      
      // Add close handler for disconnect events
      wsRef.current.addCloseHandler((event) => {
        console.warn("⚠️ WebSocket disconnected. Attempting to reconnect...");
        if (event.code !== 1000) { // Not a normal closure
          toast({
            title: "Connection Lost",
            description: "Attempting to reconnect to live updates...",
            variant: "destructive"
          });
        }
      });
      
      // Add message handler to update markets in real-time with batch processing
      wsRef.current.addMessageHandler((event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle individual market updates (legacy support)
          if (data.type === 'market_update' && data.id) {
            console.log(`📊 Received market update for ${data.id}:`, data);
            debouncedUpdateMarkets([data]);
          }
          
          // Handle batch updates for improved performance
          if (data.type === 'market_updates' && Array.isArray(data.updates)) {
            console.log(`📊 Batch update received for ${data.updates.length} markets.`);
            debouncedUpdateMarkets(data.updates);
          }
          
          // Handle account balance updates
          if (data.type === 'balance_update' && data.userId === USER_WALLET_ADDRESS) {
            console.log(`💰 Received balance update:`, data);
            
            // Update the appropriate balance based on account type
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
      
      // Initialize WebSocket connection
      wsRef.current.connect();
    }

    // Cleanup WebSocket on unmount
    return () => {
      debouncedUpdateMarkets.cancel(); // Cancel any pending debounced updates
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [initialMarkets, queryClient, selectedSport, debouncedUpdateMarkets]);

  // Check for account updates
  useEffect(() => {
    // Set up interval to check for account updates
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

  // Determine which balance to display based on account type
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
        {/* Header */}
        <Header 
          walletBalance={displayBalance}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onOpenNewPositionModal={() => setIsNewPositionModalOpen(true)}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
          onBalanceUpdate={handleBalanceUpdate}
          accountType={accountType}
        />

        {/* Main Content - IG Index Style */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left Sidebar */}
          <Sidebar 
            selectedSport={selectedSport}
            onSelectSport={setSelectedSport}
          />
          
          {/* Main Market View */}
          <MarketView 
            matches={liveMatches}
            isLoading={isLoading}
            error={error}
            onOpenNewPosition={handleOpenNewPosition}
            priceRefs={priceRefs}
          />
          
          {/* Right Bet Slip Panel */}
          <BetSlip />
        </div>
        
        {/* Live Betting Chat */}
        <LiveBettingChat />
        
        {/* Modals */}
        <WalletModal 
          isOpen={isWalletModalOpen} 
          onClose={() => {
            setIsWalletModalOpen(false);
            // Record that the user has selected an account type
            localStorage.setItem(`account_chosen_${USER_WALLET_ADDRESS}`, "true");
          }}
          balance={displayBalance}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
          showAccountSelection={showAccountSelection}
          onAccountTypeSelected={() => {
            // When user selects account type, record it and close modal
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
