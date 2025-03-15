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
  const [walletBalance, setWalletBalance] = useState<number>(10000);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNewPositionModalOpen, setIsNewPositionModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Market | null>(null);
  const [betAction, setBetAction] = useState<'buy' | 'sell' | null>(null);
  
  const wsRef = useRef<WebSocketService | null>(null);
  const priceRefs = useRef<Record<string, HTMLDivElement>>({});
  const queryClient = useQueryClient();

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
      // In a real implementation, you'd fetch the balance from the backend
      // For now, we'll use the incoming newBalance parameter and simulate an API response
      setWalletBalance(newBalance);
      
      toast({
        title: "Balance Updated",
        description: `Your balance is now $${newBalance.toLocaleString()}`
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
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential retry delay
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

  const handleOpenNewPosition = (match: Market, action: 'buy' | 'sell') => {
    setSelectedMatch(match);
    setBetAction(action);
    setIsNewPositionModalOpen(true);
  };

  return (
    <SpreadsProvider>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        {/* Header */}
        <Header 
          walletBalance={walletBalance}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onOpenNewPositionModal={() => setIsNewPositionModalOpen(true)}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
          onBalanceUpdate={handleBalanceUpdate}
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
          onClose={() => setIsWalletModalOpen(false)} 
          balance={walletBalance}
          userWallet={USER_WALLET_ADDRESS}
          webSocketService={wsRef.current}
        />
        
        <NewPositionModal 
          isOpen={isNewPositionModalOpen} 
          onClose={() => setIsNewPositionModalOpen(false)} 
          match={selectedMatch || undefined}
          action={betAction || undefined}
        />
      </div>
    </SpreadsProvider>
  );
};

export default Index;
