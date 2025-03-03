
import React, { useState } from "react";
import { Wallet, Plus, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
}

const WalletModal = ({ isOpen, onClose, balance }: WalletModalProps) => {
  const [isTransakOpen, setIsTransakOpen] = useState(false);

  const handleDeposit = () => {
    setIsTransakOpen(true);
    // Initialize Transak in a real implementation
    window.open('https://global.transak.com/', '_blank');
    toast({
      title: "Transak opened",
      description: "Complete your deposit in the Transak window",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass rounded-lg max-w-md w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-primary" />
            Wallet
          </h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
            <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleDeposit}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Deposit
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowRight size={16} />
              Withdraw
            </button>
          </div>

          {isTransakOpen && (
            <div className="mt-4 p-3 border border-primary/30 rounded-lg bg-primary/5 text-sm flex items-start gap-2">
              <ExternalLink size={16} className="mt-0.5 flex-shrink-0 text-primary" />
              <p>
                Complete your transaction in the Transak window. Your balance will update automatically once the transaction is complete.
              </p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center mt-4">
            Powered by Transak - Secure, Compliant Crypto On-ramp
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
