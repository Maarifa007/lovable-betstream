
import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="bg-background py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">BetStream</h3>
            <p className="text-muted-foreground text-sm">
              The future of sports trading, powered by AI.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/chat" className="text-muted-foreground hover:text-foreground transition-colors">Mikey Chat</Link></li>
              <li><Link to="/chat?demo=true" className="text-muted-foreground hover:text-foreground transition-colors">Try Demo</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Markets</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Trading Guide</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Sweepstakes Rules</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BetStream. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
