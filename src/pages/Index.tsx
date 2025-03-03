
import { useState, useEffect, useRef } from "react";
import { Trophy, ChevronRight, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import WebSocketService from "@/services/webSocketService";
import WalletModal from "@/components/WalletModal";
import NewPositionModal from "@/components/NewPositionModal";

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

  // Animation utility
  const animateValue = (element: HTMLElement, className: string) => {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 1000);
  };

  useEffect(() => {
    // Set initial markets
    if (initialMarkets) {
      setLiveMatches(initialMarkets);
    }

    // WebSocket connection for live updates
    if (!wsRef.current) {
      wsRef.current = new WebSocketService('wss://stream.your-service.com/markets');
      
      wsRef.current.addMessageHandler((event) => {
        try {
          const update = JSON.parse(event.data);
          
          setLiveMatches(current => 
            current.map(match => {
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
            })
          );
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      wsRef.current.connect();
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [initialMarkets]);

  const handleOpenNewPosition = (match: Market, action: 'buy' | 'sell') => {
    setSelectedMatch(match);
    setBetAction(action);
    setIsNewPositionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header */}
      <header className="glass rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">SportIndex</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="glass px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white/10 transition-colors"
          >
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium">{walletBalance.toLocaleString()}</span>
          </button>
          <button 
            onClick={() => toast({ title: "Coming soon!", description: "This feature is under development." })}
            className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
          >
            New Position
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sports Navigation */}
        <nav className="lg:col-span-3">
          <div className="glass rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Sports</h2>
            <div className="space-y-2">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedSport === sport.id
                      ? "bg-primary text-white"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span>{sport.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm opacity-75">{sport.count}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Live Matches */}
        <main className="lg:col-span-9">
          <div className="glass rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Live Markets</h2>
            
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-muted-foreground">Loading markets...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                <p>Failed to load markets. Please try again later.</p>
              </div>
            )}
            
            {!isLoading && !error && liveMatches.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No live markets available for {selectedSport}.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-primary text-sm">{match.time}</span>
                          <span className="text-sm text-muted-foreground">Live</span>
                        </div>
                        <h3 className="font-medium">{match.home} vs {match.away}</h3>
                        <div className="text-sm text-muted-foreground">
                          {match.market}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          Spread
                        </div>
                        <div className="font-medium">{match.spread}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleOpenNewPosition(match, 'sell')}
                        className="p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
                      >
                        <div className="text-xs mb-1">Sell at</div>
                        <div 
                          ref={el => { if (el) priceRefs.current[`${match.id}-sellPrice`] = el; }} 
                          className="font-semibold transition-all duration-300"
                        >
                          {match.sellPrice}
                        </div>
                      </button>
                      <button 
                        onClick={() => handleOpenNewPosition(match, 'buy')}
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                      >
                        <div className="text-xs mb-1">Buy at</div>
                        <div 
                          ref={el => { if (el) priceRefs.current[`${match.id}-buyPrice`] = el; }} 
                          className="font-semibold transition-all duration-300"
                        >
                          {match.buyPrice}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        balance={walletBalance}
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
