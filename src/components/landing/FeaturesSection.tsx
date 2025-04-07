
import { ArrowUpDown, Shield, Trophy, DollarSign } from "lucide-react";

const features = [
  {
    icon: <ArrowUpDown className="h-6 w-6 text-primary" />,
    title: "Index Spread Betting",
    description: "Buy or sell point spreads just like stocks. Your profit or loss depends on the final score."
  },
  {
    icon: <DollarSign className="h-6 w-6 text-primary" />,
    title: "Free & Cash Mode",
    description: "Practice with virtual gold coins or trade with real USDC. You decide how you want to play."
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Legal Sweepstakes Model",
    description: "Our free-to-play model is available in most US states through a legal sweepstakes structure."
  },
  {
    icon: <Trophy className="h-6 w-6 text-primary" />,
    title: "AI-Powered Trading",
    description: "Mikey fetches the latest odds, executes your trades, and even helps analyze market trends."
  }
];

const FeaturesSection = () => {
  return (
    <div className="py-16 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How BetStream Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-background p-6 rounded-xl border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
