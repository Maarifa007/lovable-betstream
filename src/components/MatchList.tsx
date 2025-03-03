
import MatchItem from "./MatchItem";

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

interface MatchListProps {
  matches: Market[];
  isLoading: boolean;
  error: unknown;
  selectedSport: string;
  priceRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
  onOpenNewPosition: (match: Market, action: 'buy' | 'sell') => void;
}

const MatchList = ({ 
  matches, 
  isLoading, 
  error, 
  selectedSport, 
  priceRefs, 
  onOpenNewPosition 
}: MatchListProps) => {
  return (
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
        
        {!isLoading && !error && matches.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No live markets available for {selectedSport}.</p>
          </div>
        )}
        
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchItem 
              key={match.id}
              match={match}
              onOpenNewPosition={onOpenNewPosition}
              priceRefs={priceRefs}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MatchList;
