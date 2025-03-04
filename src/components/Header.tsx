
import { Trophy, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LiveBalance from "./LiveBalance";
import WebSocketService from "@/services/webSocketService";

interface HeaderProps {
  walletBalance: number;
  onOpenWalletModal: () => void;
  onOpenNewPositionModal?: () => void;
  userWallet: string;
  webSocketService?: WebSocketService;
  onBalanceUpdate?: (newBalance: number) => void;
}

const Header = ({ 
  walletBalance, 
  onOpenWalletModal, 
  onOpenNewPositionModal,
  userWallet,
  webSocketService,
  onBalanceUpdate 
}: HeaderProps) => {
  const handleNewPosition = () => {
    if (onOpenNewPositionModal) {
      onOpenNewPositionModal();
    } else {
      toast({ title: "Coming soon!", description: "This feature is under development." });
    }
  };

  return (
    <header className="glass rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold">SportIndex</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={onOpenWalletModal}
          className="glass px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white/10 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {webSocketService && onBalanceUpdate ? (
              <LiveBalance 
                userWallet={userWallet}
                initialBalance={walletBalance}
                webSocketService={webSocketService}
                onBalanceUpdate={onBalanceUpdate}
              />
            ) : (
              walletBalance.toLocaleString()
            )}
          </span>
        </button>
        <button 
          onClick={handleNewPosition}
          className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
        >
          New Position
        </button>
      </div>
    </header>
  );
};

export default Header;
