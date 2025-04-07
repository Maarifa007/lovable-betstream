
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Index from "./Index";
import { getUserAccount } from "@/utils/betUtils";
import { Loader } from "lucide-react";

// Default user wallet address - in real app this would come from auth
const USER_WALLET_ADDRESS = "0x1234...5678";

const ChatPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isDemo = searchParams.get('demo') === 'true';
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user account is ready
  useEffect(() => {
    // Simulate checking account/wallet status
    const checkAccountStatus = async () => {
      try {
        // Get user account - in a real app this would check auth status
        const account = getUserAccount(USER_WALLET_ADDRESS);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking account status:", error);
        setIsLoading(false);
      }
    };
    
    checkAccountStatus();
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium mb-2">Getting your account ready...</h2>
          <p className="text-muted-foreground">Loading your betting profile and market data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Index />
    </div>
  );
};

export default ChatPage;
