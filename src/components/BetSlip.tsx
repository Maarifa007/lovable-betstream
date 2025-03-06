
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface Bet {
  id: string;
  matchId: number;
  matchName: string;
  market: string;
  betType: 'buy' | 'sell';
  betPrice: number;
  stakePerPoint: number;
  makeupLimit: number;
  status: 'open' | 'settled';
  timestamp: number;
}

const BetSlip = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  
  // Load bets from localStorage
  useEffect(() => {
    const storedBets = localStorage.getItem('userBets');
    if (storedBets) {
      setBets(JSON.parse(storedBets));
    }
  }, []);

  const removeBet = (betId: string) => {
    const updatedBets = bets.filter(bet => bet.id !== betId);
    setBets(updatedBets);
    localStorage.setItem('userBets', JSON.stringify(updatedBets));
  };

  const calculateExposure = (bet: Bet) => {
    return bet.stakePerPoint * bet.makeupLimit;
  };

  return (
    <aside className="w-72 min-w-72 bg-card border-l border-border h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Position Ticket</h2>
        
        <Tabs defaultValue="open">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="pt-4">
            {bets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No open positions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.filter(bet => bet.status === 'open').map((bet) => (
                  <div key={bet.id} className="bg-background border border-border rounded-lg p-3 relative">
                    <button 
                      onClick={() => removeBet(bet.id)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <div className="pr-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{bet.matchName}</h4>
                        <span className={bet.betType === 'buy' ? 'text-primary text-sm' : 'text-destructive text-sm'}>
                          {bet.betType === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {bet.market} @ {bet.betPrice}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Size</div>
                          <div>${bet.stakePerPoint}/pt</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Makeup</div>
                          <div>{bet.makeupLimit}X</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Exposure</div>
                          <div>${calculateExposure(bet)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Opened</div>
                          <div>{new Date(bet.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            {bets.filter(bet => bet.status === 'settled').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No position history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.filter(bet => bet.status === 'settled').map((bet) => (
                  <div key={bet.id} className="bg-background border border-border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{bet.matchName}</h4>
                      <span className="text-muted-foreground text-sm">CLOSED</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {bet.market} @ {bet.betPrice}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
};

export default BetSlip;
