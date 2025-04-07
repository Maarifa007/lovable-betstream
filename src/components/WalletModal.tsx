import React, { useState, useEffect } from "react";
import { Wallet, Plus, ArrowRight, ExternalLink, DollarSign, Loader, ShieldCheck, Coins, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WebSocketService from "@/services/webSocketService";
import { 
  AccountType, 
  getUserAccount, 
  saveUserAccount, 
  convertToCashAccount 
} from "@/utils/betUtils";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userWallet: string;
  webSocketService?: WebSocketService;
  accountSelection?: boolean;
  onAccountTypeSelected?: () => void;
}

const WalletModal = ({ isOpen, onClose, balance, userWallet, webSocketService, accountSelection, onAccountTypeSelected }: WalletModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [kycVerified, setKycVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Account type and balances 
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [goldCoins, setGoldCoins] = useState(0); // Free play balance (now called virtualBalance)
  const [points, setPoints] = useState(0); // Real money balance (USDC)
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  
  // Wallet connection 
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  
  // Account selection 
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [isUpgradePrompt, setIsUpgradePrompt] = useState(false);
  
  // Crypto conversion
  const [cryptoBalance, setCryptoBalance] = useState(0);
  const [conversionRate, setConversionRate] = useState(100); // 1 USDC = 100 Points
  const [isConverting, setIsConverting] = useState(false);

  // Load user account data when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Get user account
      const account = getUserAccount(userWallet);
      
      // Set account type and balances
      setAccountType(account.accountType);
      setGoldCoins(account.virtualBalance);
      setPoints(account.walletBalance);
      
      // Check if wallet is connected
      if (account.walletAddress) {
        setIsWalletConnected(true);
        setWalletAddress(account.walletAddress);
      } else {
        setIsWalletConnected(false);
        setWalletAddress('');
      }
      
      // Only show account selection if they haven't chosen yet
      const hasChosenAccount = localStorage.getItem(`account_chosen_${userWallet}`);
      setShowAccountSelection(!hasChosenAccount);
      
      // Check KYC status (for cash accounts)
      const kycStatus = localStorage.getItem(`kyc_${userWallet}`);
      setKycVerified(kycStatus === 'verified');
      
      // Check daily reward claim
      const savedLastClaimedDate = localStorage.getItem(`lastClaimedDate_${userWallet}`);
      if (savedLastClaimedDate) {
        setLastClaimedDate(savedLastClaimedDate);
        // Check if user can claim daily reward
        const today = new Date().toISOString().split('T')[0];
        setCanClaimDaily(savedLastClaimedDate !== today);
      } else {
        setCanClaimDaily(true);
      }
      
      // Simulate fetching crypto balance for cash accounts
      if (account.accountType === 'cash') {
        simulateFetchCryptoBalance();
      }
      
      setIsLoading(false);
    }
  }, [isOpen, userWallet]);

  // Function to simulate fetching crypto balance
  const simulateFetchCryptoBalance = () => {
    // In a real app, this would connect to MetaMask or another wallet
    // For now, we'll use a random value between 0 and 10 USDC (for demonstration)
    const randomBalance = parseFloat((Math.random() * 10).toFixed(2));
    setCryptoBalance(randomBalance);
  };

  // Function to select account type (free or cash)
  const selectAccountType = (type: AccountType) => {
    // Get the current account
    const account = getUserAccount(userWallet);
    
    // Update account type
    account.accountType = type;
    
    // Initial balances
    if (type === 'free') {
      account.virtualBalance = 1000; // Start with 1000 virtual points for free accounts
    }
    
    // Save the updated account
    saveUserAccount(account);
    setAccountType(type);
    
    // Mark as chosen
    localStorage.setItem(`account_chosen_${userWallet}`, 'true');
    setShowAccountSelection(false);
    
    // Show appropriate toast
    if (type === 'free') {
      toast({
        title: "Free Play Mode Activated",
        description: "You've been given 1,000 Gold Coins to start with! Enjoy playing."
      });
    } else {
      // For cash accounts, prompt to connect wallet
      toast({
        title: "Cash Mode Selected",
        description: "Please connect your wallet to continue."
      });
      
      // Force showing the wallet connect prompt for cash accounts
      promptConnectWallet();
    }
  };

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAddress = accounts[0];
        
        // Update user account with wallet address
        const account = getUserAccount(userWallet);
        
        if (account.accountType === 'free') {
          // If they're connecting a wallet while in free mode, convert to cash
          const updatedAccount = convertToCashAccount(account, connectedAddress);
          setAccountType(updatedAccount.accountType);
          setPoints(updatedAccount.walletBalance);
          
          toast({
            title: "Account Upgraded to Cash Mode!",
            description: "Your wallet has been connected successfully. You can now add USDC funds."
          });
        } else {
          // Just update the wallet address
          account.walletAddress = connectedAddress;
          account.walletConnectedAt = Date.now();
          saveUserAccount(account);
        }
        
        setWalletAddress(connectedAddress);
        setIsWalletConnected(true);
        
        // Show welcome bonus prompt if first time connecting
        if (!localStorage.getItem(`wallet_bonus_shown_${userWallet}`)) {
          toast({
            title: "Welcome Bonus Available!",
            description: "Convert to a real wallet and get 2,500 bonus points when you deposit $10 in USDC."
          });
          localStorage.setItem(`wallet_bonus_shown_${userWallet}`, 'true');
        }
        
        // After connecting wallet, simulate having crypto
        simulateFetchCryptoBalance();
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect your wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Function to prompt user to connect wallet (for upgrading)
  const promptConnectWallet = () => {
    setIsUpgradePrompt(true);
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
    
    const account = getUserAccount(userWallet);
    const dailyReward = 1000;
    
    // Update balance
    account.virtualBalance += dailyReward;
    saveUserAccount(account);
    setGoldCoins(account.virtualBalance);
    
    // Save claim date
    const today = new Date().toISOString().split('T')[0];
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
      const account = getUserAccount(userWallet);
      const pointsToAdd = Math.floor(cryptoBalance * conversionRate);
      
      // Update balance
      account.walletBalance += pointsToAdd;
      saveUserAccount(account);
      setPoints(account.walletBalance);
      setCryptoBalance(0);
      
      // Update the main balance through WebSocketService
      if (webSocketService) {
        webSocketService.simulateBalanceUpdate(userWallet, account.walletBalance);
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
    const account = getUserAccount(userWallet);
    
    // Update balance
    account.virtualBalance += amount;
    saveUserAccount(account);
    setGoldCoins(account.virtualBalance);
    
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
  const simulateQuickDeposit = (amount: number, currencyType: 'points' | 'virtualBalance' = 'points') => {
    // Require KYC for Points deposits only
    if (currencyType === 'points' && !kycVerified && accountType === 'cash') {
      toast({
        title: "KYC Required",
        description: "You need to complete KYC verification before depositing Points.",
        variant: "destructive"
      });
      return;
    }
    
    const account = getUserAccount(userWallet);
    
    if (currencyType === 'points') {
      account.walletBalance += amount;
      saveUserAccount(account);
      setPoints(account.walletBalance);
      
      if (webSocketService) {
        webSocketService.simulateBalanceUpdate(userWallet, account.walletBalance);
      }
      
      toast({
        title: "Quick Points Deposit Successful!",
        description: `${amount} Points added to your balance for testing.`
      });
    } else {
      account.virtualBalance += amount;
      saveUserAccount(account);
      setGoldCoins(account.virtualBalance);
      
      toast({
        title: "Quick Gold Coins Deposit Successful!",
        description: `${amount} Gold Coins added to your balance for testing.`
      });
    }
  };

  // Render account type selection UI
  const renderAccountSelection = () => {
    return (
      <div className="space-y-6 py-4">
        <h3 className="text-lg font-semibold text-center">Choose Your Play Mode</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => selectAccountType('free')}
            className="p-6 border border-yellow-500/20 rounded-lg bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors text-left"
          >
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h4 className="text-lg font-medium text-yellow-500">🆓 Play for Fun</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sweepstakes mode with 1,000 free Gold Coins
                </p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-muted-foreground space-y-2">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> No wallet required
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Free daily bonuses
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Leaderboard competitions
              </li>
              <li className="flex items-center">
                <span className="text-red-400 mr-2">✗</span> Cannot withdraw winnings
              </li>
            </ul>
          </button>
          
          <button
            onClick={() => selectAccountType('cash')}
            className="p-6 border border-green-500/20 rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors text-left"
          >
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h4 className="text-lg font-medium text-green-500">🎯 Play for Real</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  USDC wallet with cash prizes
                </p>
              </div>
            </div>
            <ul className="mt-4 text-sm text-muted-foreground space-y-2">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Connect crypto wallet
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Deposit & withdraw USDC
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Real cash betting
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span> Cash out anytime
              </li>
            </ul>
          </button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          You can change your play mode anytime in settings
        </p>
      </div>
    );
  };

  // Render wallet connect prompt
  const renderWalletConnectPrompt = () => {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center">
        <h3 className="text-xl font-semibold text-center">
          {isUpgradePrompt ? 
            "Upgrade to Cash Mode" : 
            "Connect Your Wallet"
          }
        </h3>
        
        <p className="text-center text-muted-foreground">
          {isUpgradePrompt ?
            "You're ready to go pro! Let's connect your wallet so you can start trading with real USDC 💸." :
            "Connect your crypto wallet to deposit and withdraw USDC."
          }
        </p>
        
        <div className="mt-4">
          <button
            onClick={connectWallet}
            disabled={isConnectingWallet}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isConnectingWallet ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
        
        {isUpgradePrompt && (
          <button
            onClick={() => setIsUpgradePrompt(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Not now
          </button>
        )}
        
        <div className="border-t border-border pt-4 text-xs text-center text-muted-foreground">
          <p>Connecting your wallet is secure and private.</p>
          <p className="mt-1">We never access your funds - only verify ownership.</p>
        </div>
      </div>
    );
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
        ) : showAccountSelection ? (
          // Show account type selection UI
          renderAccountSelection()
        ) : accountType === 'cash' && !isWalletConnected ? (
          // Cash account - not connected yet
          renderWalletConnectPrompt()
        ) : isUpgradePrompt ? (
          // Showing upgrade prompt
          renderWalletConnectPrompt()
        ) : (
          <div className="space-y-6">
            {/* Account Type Indicator */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center">
                {accountType === 'free' ? (
                  <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                ) : (
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                )}
                <span className="font-medium">
                  {accountType === 'free' ? 'Free Play Mode' : 'Cash Play Mode'}
                </span>
              </div>
              
              {accountType === 'free' && (
                <button
                  onClick={promptConnectWallet}
                  className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Upgrade
                </button>
              )}
            </div>
            
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
                <div className="text-sm text-muted-foreground mb-1">
                  {accountType === 'cash' ? 'USDC Balance' : 'Points (P)'}
                </div>
                <div className="text-xl font-bold flex items-center text-green-400">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {points.toLocaleString()}
                </div>
                <div className="text-xs text-green-400/70 mt-1">
                  {accountType === 'cash' ? 'Real money betting' : 'Future cash value'}
                </div>
              </div>
            </div>
            
            {/* Only show crypto balance for cash accounts with connected wallets */}
            {accountType === 'cash' && isWalletConnected && (
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
            )}
            
            {/* Daily Claim Section - Only for free accounts */}
            {accountType === 'free' && (
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
            )}
            
            {/* KYC Status Section - Only for cash accounts */}
            {accountType === 'cash' && (
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
            )}
            
            {/* Quick Deposit Sections - Show both for all accounts */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Gold Coins (Free)</h3>
              <div className="grid grid-cols-3 gap-3">
                {[5000, 10000, 25000].map((amount) => (
                  <button
                    key={`gc-${amount}`}
                    onClick={() => simulateQuickDeposit(amount, 'virtualBalance')}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg py-2 px-1 text-center transition-colors"
                  >
                    +{(amount/1000)}k GC
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {accountType === 'cash' ? 'Quick USDC Deposit' : 'Quick Points Deposit'}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[10, 50, 100].map((amount) => (
                  <button
                    key={`p-${amount}`}
                    onClick={() => simulateQuickDeposit(amount, 'points')}
                    className={`${
                      (accountType === 'free' || (accountType === 'cash' && kycVerified))
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" 
                        : "bg-gray-500/10 text-gray-500 cursor-not-allowed"
                    } rounded-lg py-2 px-1 text-center transition-colors`}
                    disabled={accountType === 'cash' && !kycVerified}
                  >
                    +${amount}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {accountType === 'cash' ? (
                <>
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
                </>
              ) : (
                <>
                  <button 
                    onClick={promptConnectWallet}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors col-span-2"
                  >
                    <Wallet size={16} />
                    Upgrade to Cash Mode
                  </button>
                </>
              )}
            </div>

            {accountType === 'cash' ? (
              <div className="text-xs text-muted-foreground text-center mt-4">
                Convert crypto to Points for betting
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center mt-4">
                Upgrade to cash mode to withdraw real winnings
              </div>
            )}
            
            {/* Connected wallet display */}
            {isWalletConnected && (
              <div className="mt-4 p-3 border border-white/10 rounded-lg bg-white/5">
                <div className="text-xs text-muted-foreground">Connected Wallet</div>
                <div className="text-sm font-mono mt-1">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;

// Fix TypeScript global window issue
declare global {
  interface Window {
    ethereum?: any;
  }
}
