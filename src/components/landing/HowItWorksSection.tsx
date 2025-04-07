
import { CheckCircle } from "lucide-react";

const steps = [
  {
    title: "Choose Your Account Type",
    description: "Start with a free account to practice, or connect your wallet for cash trading."
  },
  {
    title: "Chat with Mikey",
    description: "Ask for markets, place trades, check your balance - all through simple chat."
  },
  {
    title: "Buy or Sell Spreads",
    description: "Take positions on point spreads, totals, or other markets with instant execution."
  },
  {
    title: "Collect Your Winnings",
    description: "Markets are graded within an hour of the final score, and winnings are credited automatically."
  }
];

const HowItWorksSection = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Sports Trading</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          BetStream simplifies sports betting by using an AI agent to help you place trades through conversation.
        </p>
        
        <div className="space-y-6 max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
