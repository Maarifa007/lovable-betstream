
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

  // Fetch initial market data with improved error handling
  const { data: initialMarkets, isLoading, error } = useQuery({
    queryKey: ['markets', selectedSport],
    queryFn: async () => {
      try {
        // This will eventually connect to SportsGameOdds API
        // Replace with your API endpoint when ready
        const response = await fetch(`https://api.your-service.com/markets/${selectedSport}`);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching markets:", error);
        toast({
          title: "Error",
          description: "Failed to load markets. Using sample data.",
          variant: "destructive"
        });
        
        // Return placeholder data for development
        return [
          {
            id: 1,
            home: "West Ham",
            away: "Leicester",
            time: "32:15",
            market: "Total Goals",
            spread: "2.8-3.0",
            sellPrice: "2.8",
            buyPrice: "3.0"
          },
          {
            id: 2,
            home: "Barcelona",
            away: "Real Madrid",
            time: "56:23",
            market: "Total Corners",
            spread: "10.5-10.8",
            sellPrice: "10.5",
            buyPrice: "10.8"
          }
        ];
      }
    }
  });

  useEffect(() => {
    // Set initial markets
    if (initialMarkets) {
      setLiveMatches(initialMarkets);
    }

    // WebSocket connection for live updates with proper message handling
    if (!wsRef.current) {
      wsRef.current = new WebSocketService('wss://stream.your-service.com/markets');
      
      // Add message handler to update markets in real-time
      wsRef.current.addMessageHandler((event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check if this is a market update
          if (data.type === 'market_update' && data.id) {
            setLiveMatches(prevMatches => 
              prevMatches.map(match => 
                match.id === data.id 
                  ? { 
                      ...match, 
                      sellPrice: data.sellPrice || match.sellPrice,
                      buyPrice: data.buyPrice || match.buyPrice,
                      updatedFields: ['sellPrice', 'buyPrice']
                    } 
                  : match
              )
            );
            
            // Flash the updated price elements
            if (priceRefs.current[`${data.id}-sellPrice`]) {
              priceRefs.current[`${data.id}-sellPrice`].classList.add('flash-update');
              setTimeout(() => {
                priceRefs.current[`${data.id}-sellPrice`]?.classList.remove('flash-update');
              }, 1000);
            }
            
            if (priceRefs.current[`${data.id}-buyPrice`]) {
              priceRefs.current[`${data.id}-buyPrice`].classList.add('flash-update');
              setTimeout(() => {
                priceRefs.current[`${data.id}-buyPrice`]?.classList.remove('flash-update');
              }, 1000);
            }
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      });
      
      // Initialize WebSocket connection
      wsRef.current.connect();
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [initialMarkets, queryClient, selectedSport]);

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
