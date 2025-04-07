
import { Helmet } from "react-helmet";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>BetStream - AI-Powered Sports Trading</title>
        <meta name="description" content="Chat with Mikey, your AI betting agent. Buy and sell sports spreads in a simple, conversational interface." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">BetStream</span>
            </div>
            <nav className="hidden md:flex gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            </nav>
          </div>
        </header>
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        
        <FooterSection />
      </div>
    </>
  );
};

export default LandingPage;
