
import { useState, useEffect } from "react";
import WebSocketService from "@/services/webSocketService";
import { DollarSign } from "lucide-react";

interface LiveBalanceProps {
  userWallet: string;
  initialBalance: number;
  webSocketService: WebSocketService;
  onBalanceUpdate: (newBalance: number) => void;
}

const LiveBalance = ({ userWallet, initialBalance, webSocketService, onBalanceUpdate }: LiveBalanceProps) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  useEffect(() => {
    // Update local state if the initialBalance prop changes
    setBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    // Handler for balance updates
    const handleBalanceUpdate = (data: { wallet: string, balance: number }) => {
      if (data.wallet === userWallet) {
        console.log(`Balance updated: ${data.balance}`);
        
        // Add flashing animation
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 1000);
        
        setBalance(data.balance);
        onBalanceUpdate(data.balance);
      }
    };

    // Add the handler to the WebSocket service
    webSocketService.addWalletHandler(handleBalanceUpdate);

    // Cleanup when component unmounts
    return () => {
      webSocketService.removeWalletHandler(handleBalanceUpdate);
    };
  }, [userWallet, webSocketService, onBalanceUpdate]);

  return (
    <div className={`font-medium transition-all duration-300 ${isFlashing ? 'flash-up' : ''}`}>
      {balance.toLocaleString()}
    </div>
  );
};

export default LiveBalance;
