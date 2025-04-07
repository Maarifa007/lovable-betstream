
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 py-12 max-w-7xl mx-auto px-4">
      <div className="flex-1 space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Meet <span className="text-primary">Mikey</span>, Your AI Betting Agent
        </h1>
        <p className="text-xl text-muted-foreground">
          Trade sports spreads with the simplicity of chat. Buy and sell point spreads with real-time market access.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link to="/chat" className="px-8">
              Start Trading <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button variant="outline" size="lg">
            <Link to="/chat?demo=true">Try Demo</Link>
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl">
        <div className="rounded-lg bg-background/80 backdrop-blur-sm p-6 border border-border">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">M</div>
            <div className="bg-muted p-3 rounded-lg max-w-[80%]">
              <p className="text-sm">Hi! I'm Mikey, your AI betting agent. How can I help you today?</p>
            </div>
          </div>
          <div className="flex items-start gap-3 mb-6 justify-end">
            <div className="bg-primary/10 p-3 rounded-lg max-w-[80%]">
              <p className="text-sm">Show me NFL spreads for today</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-foreground font-bold">U</div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">M</div>
            <div className="bg-muted p-3 rounded-lg max-w-[80%]">
              <p className="text-sm">Here are today's NFL spreads:</p>
              <div className="mt-2 space-y-2">
                <div className="p-2 bg-background rounded border border-border">
                  <div className="flex justify-between text-sm">
                    <span>Chiefs vs Ravens</span>
                    <span className="font-semibold">45.5 Total Pts</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>8:20 PM ET</span>
                    <span>Buy: 45.7 / Sell: 45.3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
