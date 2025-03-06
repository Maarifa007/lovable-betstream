
import { useSpreads } from "@/contexts/SpreadsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, AlertTriangle } from "lucide-react";

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

interface MarketViewProps {
  matches: Market[];
  isLoading: boolean;
  error: unknown;
  onOpenNewPosition: (match: Market, action: 'buy' | 'sell') => void;
  priceRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
}

const MarketView = ({ 
  matches, 
  isLoading, 
  error, 
  onOpenNewPosition,
  priceRefs 
}: MarketViewProps) => {
  const { spreads } = useSpreads();

  const getMarketSpread = (market: string) => {
    return spreads.find(s => s.market === market);
  };

  return (
    <main className="flex-1 overflow-auto bg-background p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Live Markets</h2>
      </div>
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading markets...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Failed to load markets. Please try again later.</p>
          </div>
        </div>
      )}
      
      {!isLoading && !error && matches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No live markets available.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {matches.map((match) => {
          const marketSpread = getMarketSpread(match.market);
          const buyPrice = marketSpread ? marketSpread.buyPrice : match.buyPrice;
          const sellPrice = marketSpread ? marketSpread.sellPrice : match.sellPrice;
          
          return (
            <div key={match.id} className="border border-border rounded-lg overflow-hidden">
              <div className="bg-card p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary text-sm">{match.time}</span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">Live</span>
                    </div>
                    <h3 className="font-medium">{match.home} vs {match.away}</h3>
                    <div className="text-sm text-muted-foreground">
                      {match.market}
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-xs flex items-center text-blue-400 hover:underline">
                      <Info className="h-3 w-3 mr-1" />
                      Market Info
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-background">
                <Tabs defaultValue="buy-sell">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="buy-sell">Buy/Sell</TabsTrigger>
                    <TabsTrigger value="size">Size</TabsTrigger>
                    <TabsTrigger value="stop">Stop/Limit</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy-sell" className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onOpenNewPosition(match, 'sell')}
                        className="p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
                      >
                        <div className="text-xs mb-1">Sell at</div>
                        <div 
                          ref={el => { if (el) priceRefs.current[`${match.id}-sellPrice`] = el; }} 
                          className="font-semibold text-lg"
                        >
                          {sellPrice}
                        </div>
                        <div className="text-xs mt-1">
                          Win if final &lt; {sellPrice}
                        </div>
                      </button>
                      <button 
                        onClick={() => onOpenNewPosition(match, 'buy')}
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                      >
                        <div className="text-xs mb-1">Buy at</div>
                        <div 
                          ref={el => { if (el) priceRefs.current[`${match.id}-buyPrice`] = el; }} 
                          className="font-semibold text-lg"
                        >
                          {buyPrice}
                        </div>
                        <div className="text-xs mt-1">
                          Win if final &gt; {buyPrice}
                        </div>
                      </button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="size" className="p-3">
                    <div className="space-y-3">
                      <div className="text-sm">Stake per point ($)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 25, 50, 100, 200].map((amount) => (
                          <button 
                            key={amount}
                            className="p-2 border border-border rounded hover:bg-white/5 transition-colors"
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Max makeup: 30X = ${30 * 10} exposure
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stop" className="p-3">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm mb-1">Reduce max makeup (30X default)</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[10, 15, 20, 25, 30].map((amount) => (
                            <button 
                              key={amount}
                              className="p-2 border border-border rounded hover:bg-white/5 transition-colors"
                            >
                              {amount}X
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Platform will hold {30 * 10}$ until event is over
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default MarketView;
