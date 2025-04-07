
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <div className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of traders who are already using Mikey to place smarter sports trades. Start with free gold coins or connect your wallet for real USDC trading.
        </p>
        <Button size="lg" asChild>
          <Link to="/chat" className="px-8">
            Get Started with Mikey <ArrowRight className="ml-2" />
          </Link>
        </Button>
        <div className="mt-8 text-sm text-muted-foreground">
          <p className="max-w-2xl mx-auto">
            *Free mode available as part of our legal sweepstakes model. Cash mode requires connecting a wallet and purchasing USDC. Availability may vary by jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
