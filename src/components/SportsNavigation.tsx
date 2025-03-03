
import { ChevronRight } from "lucide-react";

interface Sport {
  id: string;
  name: string;
  count: number;
}

interface SportsNavigationProps {
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
}

const SportsNavigation = ({ selectedSport, onSelectSport }: SportsNavigationProps) => {
  const sports: Sport[] = [
    { id: "football", name: "Football", count: 8 },
    { id: "basketball", name: "Basketball", count: 6 },
    { id: "tennis", name: "Tennis", count: 4 },
    { id: "hockey", name: "Hockey", count: 3 },
    { id: "baseball", name: "Baseball", count: 5 }
  ];

  return (
    <nav className="lg:col-span-3">
      <div className="glass rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Sports</h2>
        <div className="space-y-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
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
  );
};

export default SportsNavigation;
