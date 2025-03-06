
import React, { useState, useEffect } from "react";
import { Wallet, Plus, ArrowRight, ExternalLink, DollarSign, Loader, ShieldCheck, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WebSocketService from "@/services/webSocketService";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userWallet: string;
  webSocketService?: WebSocketService;
}

const WalletModal = ({ isOpen, onClose, balance, userWallet, webSocketService }: WalletModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [kycVerified, setKycVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Dual currency system
  const [goldCoins, setGoldCoins] = useState(50000); // Free play balance
  const [points, setPoints] = useState(balance); // Real money balance (using the existing balance prop)
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  
  // Crypto conversion
  const [cryptoBalance, setCryptoBalance] = useState(0);
  const [conversionRate, setConversionRate] = useState(100); // 1 USDC = 100 Points
  const [isConverting, setIsConverting] = useState(false);

  // Simulate loading
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Check KYC status and load currency balances when modal opens
  useEffect(() => {
    if (isOpen) {
      // In a real app, fetch from an API. For now, we'll check localStorage
      const kycStatus = localStorage.getItem(`kyc_${userWallet}`);
      setKycVerified(kycStatus === 'verified');
      
      // Load currency balances from localStorage
      const savedGoldCoins = localStorage.getItem(`goldCoins_${userWallet}`);
      const savedPoints = localStorage.getItem(`points_${userWallet}`);
      const savedLastClaimedDate = localStorage.getItem(`lastClaimedDate_${userWallet}`);
      
      if (savedGoldCoins) {
        setGoldCoins(parseInt(savedGoldCoins, 10));
      }
      
      if (savedPoints) {
        setPoints(parseInt(savedPoints, 10));
      } else {
        setPoints(balance); // Fallback to the existing balance
      }
      
      if (savedLastClaimedDate) {
        setLastClaimedDate(savedLastClaimedDate);
        
        // Check if user can claim daily reward
        const today = new Date().toISOString().split('T')[0];
        setCanClaimDaily(savedLastClaimedDate !== today);
      } else {
        setCanClaimDaily(true);
      }
      
      // Simulate fetching crypto balance
      // In a real app, you would connect to the user's wallet and check USDC/USDT balance
      simulateFetchCryptoBalance();
    }
  }, [isOpen, userWallet, balance]);

  // Function to simulate fetching crypto balance
  const simulateFetchCryptoBalance = () => {
    // In a real app, this would connect to MetaMask or another wallet
    // For now, we'll use a random value between 0 and 10 USDC (for demonstration)
    const randomBalance = parseFloat((Math.random() * 10).toFixed(2));
    setCryptoBalance(randomBalance);
  };

  // Function to claim daily free Gold Coins
  const claimDailyGoldCoins = () => {
    if (!canClaimDaily) {
      toast({
        title: "Already Claimed",
        description: "You've already claimed your daily Gold Coins. Come back tomorrow!",
        variant: "destructive"
      });
      return;
    }
    
    const dailyReward = 1000;
    const newGoldCoins = goldCoins + dailyReward;
    
    // Update state
    setGoldCoins(newGoldCoins);
    
    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`goldCoins_${userWallet}`, newGoldCoins.toString());
    localStorage.setItem(`lastClaimedDate_${userWallet}`, today);
    
    setLastClaimedDate(today);
    setCanClaimDaily(false);
    
    toast({
      title: "Daily Reward Claimed!",
      description: `${dailyReward} Gold Coins have been added to your wallet.`
    });
  };

  // Function to convert USDC/USDT to Points
  const convertCryptoToPoints = () => {
    // Require KYC for Points conversion
    if (!kycVerified) {
      toast({
        title: "KYC Required",
        description: "You need to complete KYC verification before converting crypto to Points.",
        variant: "destructive"
      });
      return;
    }
    
    if (cryptoBalance <= 0) {
      toast({
        title: "No Crypto Available",
        description: "You don't have any USDC/USDT to convert.",
        variant: "destructive"
      });
      return;
    }
    
    setIsConverting(true);
    
    // Simulate conversion process
    setTimeout(() => {
      const pointsToAdd = Math.floor(cryptoBalance * conversionRate);
      const newPoints = points + pointsToAdd;
      
      // Update state
      setPoints(newPoints);
      setCryptoBalance(0);
      
      // Save to localStorage
      localStorage.setItem(`points_${userWallet}`, newPoints.toString());
      
      // Update the main balance through WebSocketService
      if (webSocketService) {
        webSocketService.simulateBalanceUpdate(userWallet, newPoints);
      }
      
      setIsConverting(false);
      
      toast({
        title: "Conversion Successful!",
        description: `${cryptoBalance} USDC/USDT converted to ${pointsToAdd} Points.`
      });
    }, 1500);
  };

  // Function to buy Gold Coins (no KYC required)
  const buyGoldCoins = (amount: number = 10000) => {
    // For Gold Coins, we don't need KYC verification as it's free play
    const newGoldCoins = goldCoins + amount;
    
    // Update state
    setGoldCoins(newGoldCoins);
    
    // Save to localStorage
    localStorage.setItem(`goldCoins_${userWallet}`, newGoldCoins.toString());
    
    toast({
      title: "Gold Coins Purchased!",
      description: `${amount} Gold Coins have been added to your wallet.`
    });
  };

  // Function to simulate KYC verification process
  const startKycVerification = () => {
    setIsVerifying(true);
    
    // In a real implementation, this would redirect to Sumsub or another KYC provider
    // For demo purposes, we'll simulate a KYC process with a timeout
    toast({
      title: "KYC Verification Started",
      description: "Please complete the verification process."
    });
    
    // Simulate KYC verification process (3 seconds)
    setTimeout(() => {
      // Save KYC status to localStorage (in a real app, this would be saved to a database)
      localStorage.setItem(`kyc_${userWallet}`, 'verified');
      setKycVerified(true);
      setIsVerifying(false);
      
      toast({
        title: "KYC Verification Complete",
        description: "Your account has been verified successfully."
      });
    }, 3000);
  };

  // Function to redirect to external crypto purchase site
  const redirectToExternalCryptoPurchase = () => {
    // In a real app, this would redirect to your external non-gambling site
    // For demo purposes, we'll show a toast message
    toast({
      title: "Redirecting to Crypto Purchase",
      description: "You would be redirected to our external site to purchase USDC/USDT."
    });
    
    // Simulate successful purchase and return
    setTimeout(() => {
      simulateFetchCryptoBalance();
      toast({
        title: "Crypto Purchase Detected",
        description: "Your new USDC/USDT balance has been updated."
      });
    }, 3000);
  };

  // Function to simulate quick balance updates for testing
  const simulateQuickDeposit = (amount: number, currencyType: 'points' | 'goldCoins' = 'points') => {
    // Require KYC for Points deposits only
    if (currencyType === 'points' && !kycVerified) {
      toast({
        title: "KYC Required",
        description: "You need to complete KYC verification before depositing Points.",
        variant: "destructive"
      });
      return;
    }
    
    if (currencyType === 'points') {
      const newPoints = points + amount;
      setPoints(newPoints);
      localStorage.setItem(`points_${userWallet}`, newPoints.toString());
      
      if (webSocketService) {
        webSocketService.simulateBalanceUpdate(userWallet, newPoints);
      }
      
      toast({
        title: "Quick Points Deposit Successful!",
        description: `${amount} Points added to your balance for testing.`
      });
    } else {
      const newGoldCoins = goldCoins + amount;
      setGoldCoins(newGoldCoins);
      localStorage.setItem(`goldCoins_${userWallet}`, newGoldCoins.toString());
      
      toast({
        title: "Quick Gold Coins Deposit Successful!",
        description: `${amount} Gold Coins added to your balance for testing.`
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
            {/* Dual Currency Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
                <div className="text-sm text-muted-foreground mb-1">Gold Coins (GC)</div>
                <div className="text-xl font-bold flex items-center text-yellow-500">
                  <Coins className="h-5 w-5 mr-1" />
                  {goldCoins.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-500/70 mt-1">Free play currency</div>
              </div>
              
              <div className="p-4 border border-green-500/20 rounded-lg bg-green-500/5">
                <div className="text-sm text-muted-foreground mb-1">Points (P)</div>
                <div className="text-xl font-bold flex items-center text-green-400">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {points.toLocaleString()}
                </div>
                <div className="text-xs text-green-400/70 mt-1">Real money betting</div>
              </div>
            </div>
            
            {/* Crypto Balance Section */}
            <div className="p-4 border border-blue-500/20 rounded-lg bg-blue-500/5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium mb-1 text-blue-400">USDC/USDT Balance</div>
                  <div className="text-lg font-bold">{cryptoBalance.toFixed(2)} USDC</div>
                </div>
                <button
                  onClick={convertCryptoToPoints}
                  disabled={!kycVerified || cryptoBalance <= 0 || isConverting}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    kycVerified && cryptoBalance > 0 && !isConverting
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isConverting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Convert to Points
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Conversion rate: 1 USDC = {conversionRate} Points
              </div>
            </div>
            
            {/* Daily Claim Section */}
            <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium mb-1 text-yellow-500">Daily Gold Coins</div>
                  <div className="text-xs text-muted-foreground">Claim 1,000 Gold Coins for free</div>
                </div>
                <button
                  onClick={claimDailyGoldCoins}
                  disabled={!canClaimDaily}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    canClaimDaily 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {canClaimDaily ? "Claim Now" : "Claimed Today"}
                </button>
              </div>
            </div>
            
            {/* KYC Status Section */}
            <div className="p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-sm text-muted-foreground mb-1">KYC Status (Required for Points)</div>
              {kycVerified ? (
                <div className="flex items-center text-green-400">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  <span>Verified ✅</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-yellow-400">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    <span>Not Verified</span>
                  </div>
                  <button
                    onClick={startKycVerification}
                    disabled={isVerifying}
                    className="mt-2 w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>Verify Account</>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Deposit Sections */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Gold Coins (Free)</h3>
              <div className="grid grid-cols-3 gap-3">
                {[5000, 10000, 25000].map((amount) => (
                  <button
                    key={`gc-${amount}`}
                    onClick={() => simulateQuickDeposit(amount, 'goldCoins')}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg py-2 px-1 text-center transition-colors"
                  >
                    +{(amount/1000)}k GC
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Points Deposit</h3>
              <div className="grid grid-cols-3 gap-3">
                {[10, 50, 100].map((amount) => (
                  <button
                    key={`p-${amount}`}
                    onClick={() => simulateQuickDeposit(amount, 'points')}
                    className={`${
                      kycVerified 
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" 
                        : "bg-gray-500/10 text-gray-500 cursor-not-allowed"
                    } rounded-lg py-2 px-1 text-center transition-colors`}
                    disabled={!kycVerified}
                  >
                    +${amount}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={redirectToExternalCryptoPurchase}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  kycVerified 
                    ? "bg-blue-500 text-white hover:bg-blue-600" 
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                } transition-colors`}
                disabled={!kycVerified}
              >
                <Plus size={16} />
                Buy USDC/USDT
              </button>
              <button 
                onClick={() => buyGoldCoins()}
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
              >
                <Plus size={16} />
                Buy Gold Coins
              </button>
            </div>

            <div className="text-xs text-muted-foreground text-center mt-4">
              Convert crypto to Points for betting
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
