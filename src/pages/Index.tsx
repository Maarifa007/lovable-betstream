
import { useState } from "react";
import { Trophy, ChevronRight, DollarSign } from "lucide-react";

const Index = () => {
  const [selectedSport, setSelectedSport] = useState("football");

  const sports = [
    { id: "football", name: "Football", count: 24 },
    { id: "tennis", name: "Tennis", count: 18 },
    { id: "basketball", name: "Basketball", count: 12 }
  ];

  const liveMatches = [
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header */}
      <header className="glass rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">SportIndex</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass px-4 py-2 rounded-full flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium">10,000</span>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
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
                      <button className="p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive">
                        <div className="text-xs mb-1">Sell at</div>
                        <div className="font-semibold">{match.sellPrice}</div>
                      </button>
                      <button className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary">
                        <div className="text-xs mb-1">Buy at</div>
                        <div className="font-semibold">{match.buyPrice}</div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
