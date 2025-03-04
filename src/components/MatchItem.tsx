
import { useRef } from "react";

interface MatchItemProps {
  match: Market;
  onOpenNewPosition: (match: Market, action: 'buy' | 'sell') => void;
  priceRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
}

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

const MatchItem = ({ match, onOpenNewPosition, priceRefs }: MatchItemProps) => {
  return (
    <div
      key={match.id}
      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-primary text-sm">{match.time}</span>
              <span className="text-sm text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full text-xs">Live</span>
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
            <div className="text-xs text-muted-foreground mt-1">
              Win/lose per point difference
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onOpenNewPosition(match, 'sell')}
            className="p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
          >
            <div className="text-xs mb-1">Sell at</div>
            <div 
              ref={el => { if (el) priceRefs.current[`${match.id}-sellPrice`] = el; }} 
              className="font-semibold transition-all duration-300"
            >
              {match.sellPrice}
            </div>
            <div className="text-xs mt-1">
              Win if final &lt; {match.sellPrice}
            </div>
          </button>
          <button 
            onClick={() => onOpenNewPosition(match, 'buy')}
            className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
          >
            <div className="text-xs mb-1">Buy at</div>
            <div 
              ref={el => { if (el) priceRefs.current[`${match.id}-buyPrice`] = el; }} 
              className="font-semibold transition-all duration-300"
            >
              {match.buyPrice}
            </div>
            <div className="text-xs mt-1">
              Win if final &gt; {match.buyPrice}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchItem;
