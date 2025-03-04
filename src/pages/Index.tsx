import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WebSocketService from "@/services/webSocketService";
import WalletModal from "@/components/WalletModal";
import NewPositionModal from "@/components/NewPositionModal";
import Header from "@/components/Header";
import SportsNavigation from "@/components/SportsNavigation";
import MatchList from "@/components/MatchList";
import { toast } from "@/hooks/use-toast";

// Type definitions for our data
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

  // Animation utility
  const animateValue = (element: HTMLElement, className: string) => {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 1000);
  };

  // Handler for balance updates
  const handleBalanceUpdate = (newBalance: number) => {
    setWalletBalance(newBalance);
    toast({
      title: "Balance Updated",
      description: `Your balance is now $${newBalance.toLocaleString()}`
    });
  };

  // Fetch initial market data
  const { data: initialMarkets, isLoading, error } = useQuery({
    queryKey: ['markets', selectedSport],
    queryFn: async () => {
      try {
        // Replace with your API endpoint
        const response = await fetch(`https://api.your-service.com/markets/${selectedSport}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching markets:", error);
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

    // WebSocket connection for live updates
    if (!wsRef.current) {
      wsRef.current = new WebSocketService('wss://stream.your-service.com/markets');
      
      // Handle market updates
      wsRef.current.addMessageHandler((event) => {
        try {
          const update = JSON.parse(event.data);
          
          // Optimize by using React Query's setQueryData
          queryClient.setQueryData(['markets', selectedSport], (oldData: any) => {
            if (!oldData) return oldData;
            
            return oldData.map((match: Market) => {
              if (match.id === update.id) {
                // Track which fields were updated for animations
                const updatedFields = [];
                
                if (match.sellPrice !== update.sellPrice) updatedFields.push('sellPrice');
                if (match.buyPrice !== update.buyPrice) updatedFields.push('buyPrice');
                
                // Apply animations in the next render cycle
                if (updatedFields.length > 0) {
                  setTimeout(() => {
                    updatedFields.forEach(field => {
                      const element = priceRefs.current[`${match.id}-${field}`];
                      if (element) {
                        const direction = field === 'sellPrice' 
                          ? parseFloat(update.sellPrice) > parseFloat(match.sellPrice) ? 'up' : 'down'
                          : parseFloat(update.buyPrice) > parseFloat(match.buyPrice) ? 'up' : 'down';
                        
                        animateValue(element, `flash-${direction}`);
                      }
                    });
                  }, 0);
                }
                
                return {
                  ...match,
                  spread: `${update.sellPrice}-${update.buyPrice}`,
                  sellPrice: update.sellPrice,
                  buyPrice: update.buyPrice,
                  updatedFields
                };
              }
              return match;
            });
          });
          
          // Update the state to reflect changes from query client
          setLiveMatches(queryClient.getQueryData(['markets', selectedSport]) as Market[]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header */}
      <Header 
        walletBalance={walletBalance}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenNewPositionModal={() => setIsNewPositionModalOpen(true)}
        userWallet={USER_WALLET_ADDRESS}
        webSocketService={wsRef.current}
        onBalanceUpdate={handleBalanceUpdate}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sports Navigation */}
        <SportsNavigation 
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
        />

        {/* Live Matches */}
        <MatchList 
          matches={liveMatches}
          isLoading={isLoading}
          error={error}
          selectedSport={selectedSport}
          priceRefs={priceRefs}
          onOpenNewPosition={handleOpenNewPosition}
        />
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
  );
};

export default Index;
