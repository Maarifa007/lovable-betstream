
import React, { useState, useEffect } from "react";
import { Wallet, Plus, ArrowRight, ExternalLink, DollarSign, Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WebSocketService from "@/services/webSocketService";

// Define the Transak SDK interface
interface TransakSDK {
  init: () => void;
  close: () => void;
}

declare global {
  interface Window {
    TransakSDK: new (config: any) => TransakSDK;
  }
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userWallet: string;
  webSocketService?: WebSocketService;
}

const WalletModal = ({ isOpen, onClose, balance, userWallet, webSocketService }: WalletModalProps) => {
  const [isTransakOpen, setIsTransakOpen] = useState(false);
  const [isTransakLoaded, setIsTransakLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load Transak SDK script
  useEffect(() => {
    if (!isOpen || isTransakLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://global.transak.com/sdk/v1.1/widget.js';
    script.async = true;
    script.onload = () => {
      setIsTransakLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, isTransakLoaded]);

  // Initialize Transak when deposit button is clicked
  const handleDeposit = (amount?: number) => {
    if (!isTransakLoaded) {
      toast({
        title: "Transak is loading",
        description: "Please wait a moment and try again."
      });
      return;
    }

    setIsTransakOpen(true);

    // Initialize Transak with configuration
    const transak = new window.TransakSDK({
      apiKey: 'f7d6a82b-e8de-45b9-8e99-1041c22e93b8', // This is a example public API key
      environment: 'STAGING', // STAGING/PRODUCTION
      defaultCryptoCurrency: 'USDC',
      walletAddress: userWallet, // Your customer's wallet address
      themeColor: '000000', // App theme color
      fiatCurrency: 'USD', // INR/GBP
      email: '', // Your customer's email address
      fiatAmount: amount || 100, // Default amount or user selected amount
      redirectURL: '',
      hostURL: window.location.origin,
      widgetHeight: '550px',
      widgetWidth: '450px',
      onClose: () => {
        setIsTransakOpen(false);
      },
      onSuccess: (data: any) => {
        console.log("Transaction Successful:", data);
        
        // Simulate balance update since we don't have a real backend
        if (webSocketService) {
          // For demo purposes, add the deposit amount to current balance
          // In a real app, this would come from the server
          const depositAmount = data.fiatAmount || 100; // Default to 100 if not available
          const newBalance = balance + depositAmount;
          
          webSocketService.simulateBalanceUpdate(userWallet, newBalance);
        }
        
        toast({
          title: "Deposit successful!",
          description: "Your wallet balance has been updated."
        });
        
        setIsTransakOpen(false);
      }
    });

    transak.init();
  };

  // Function to simulate quick balance updates for testing
  const simulateQuickDeposit = (amount: number) => {
    if (webSocketService) {
      const newBalance = balance + amount;
      
      webSocketService.simulateBalanceUpdate(userWallet, newBalance);
      
      toast({
        title: "Quick Deposit Successful!",
        description: `$${amount} added to your balance for testing.`
      });
    }
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading wallet information...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="text-2xl font-bold flex items-center">
                <DollarSign className="h-6 w-6 text-primary mr-1" />
                {balance.toLocaleString()}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Deposit</h3>
              <div className="grid grid-cols-3 gap-3">
                {[10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => simulateQuickDeposit(amount)}
                    className="bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-2 px-1 text-center transition-colors"
                  >
                    +${amount}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleDeposit()}
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
        )}
      </div>
    </div>
  );
};

export default WalletModal;
