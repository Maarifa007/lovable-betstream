
import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Wallet, Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getUserBets, 
  partiallyCloseBet, 
  fullyCloseBet, 
  findBetByName,
  getUserAccount,
  shouldPromptUpgrade,
  markUpgradePrompt,
  placeBet
} from "@/utils/betUtils";

// Default user wallet address - in real app this would come from auth
const USER_WALLET_ADDRESS = "0x1234...5678";

const LiveBettingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: "user" | "bot", confirmationData?: any}>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    // Check if chatbot API is available
    fetch("/api/chatbot/status")
      .then(response => {
        if (response.ok) {
          setConnectionStatus("connected");
          console.log("✅ Chatbot API is available");
        } else {
          setConnectionStatus("disconnected");
          console.error("❌ Chatbot API is unavailable");
          toast({
            title: "Connection Issue",
            description: "Cannot connect to betting assistant API",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error("❌ Error checking chatbot API:", error);
        setConnectionStatus("disconnected");
        toast({
          title: "Connection Error",
          description: "Failed to reach betting assistant",
          variant: "destructive"
        });
      });
      
    // Add initial welcome message from Mikey
    setMessages([{
      text: "👋 Hi! I'm Mikey, your AI betting assistant. I can help you place bets, check odds, or close positions. Try commands like:\n\n• 'Show NBA spreads'\n• 'Buy Lakers at 5.5 for $10/pt'\n• 'Close my Warriors bet'\n• 'Close 50% of my Lakers bet'\n\nType /help for more commands.",
      sender: "bot"
    }]);
    
    // Check if we should prompt user to upgrade
    const userAccount = getUserAccount(USER_WALLET_ADDRESS);
    const { should, message } = shouldPromptUpgrade(userAccount);
    
    if (should) {
      setShowUpgradePrompt(true);
      // Mark as prompted to avoid showing too frequently
      markUpgradePrompt(userAccount);
    }
  }, []);

  useEffect(() => {
    // Show upgrade prompt message if needed
    if (showUpgradePrompt && isOpen) {
      const userAccount = getUserAccount(USER_WALLET_ADDRESS);
      const { message } = shouldPromptUpgrade(userAccount);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: message || "Ready to go pro? Connect a wallet and play for real!",
          sender: "bot"
        }]);
        
        // Add a special message with a call to action
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            text: "Convert to a real USDC account to withdraw winnings anytime. Would you like to upgrade now?",
            sender: "bot",
            confirmationData: {
              action: "upgradePrompt"
            }
          }]);
        }, 1000);
      }, 3000);
      
      setShowUpgradePrompt(false);
    }
  }, [showUpgradePrompt, isOpen]);

  const fetchLivePrices = async (sport: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { text: `Fetching live prices for ${sport}...`, sender: "bot" }]);

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to fetch real data first
      try {
        const response = await fetch(`/api/live-prices/${sport}`);
        
        if (response.ok) {
          const data = await response.json();
          
          let responseMessage = `📊 Live Prices for ${sport.toUpperCase()}:\n\n`;
          data.forEach((game: any) => {
            responseMessage += `${game.market_name}:\nBuy ${game.buy_price} | Sell ${game.sell_price}\n\n`;
          });
          
          setMessages(prev => [...prev, { text: responseMessage, sender: "bot" }]);
          return;
        }
      } catch (error) {
        console.error("❌ Error fetching real prices:", error);
      }
      
      // Fallback to sample data
      const sampleData = [
        { market_name: `${sport === 'football' ? 'West Ham vs Leicester' : 'Lakers vs Warriors'}`, buy_price: "3.2", sell_price: "2.8" },
        { market_name: `${sport === 'football' ? 'Barcelona vs Real Madrid' : 'Bulls vs Celtics'}`, buy_price: "10.8", sell_price: "10.2" }
      ];
      
      let response = `📊 Live Prices for ${sport.toUpperCase()} (Sample Data):\n\n`;
      sampleData.forEach(game => {
        response += `${game.market_name}:\nBuy ${game.buy_price} | Sell ${game.sell_price}\n\n`;
      });

      setMessages(prev => [...prev, { text: response, sender: "bot" }]);
    } catch (error) {
      console.error("❌ Error fetching prices:", error);
      setMessages(prev => [...prev, { text: "Error fetching prices. Please try again.", sender: "bot" }]);
      toast({
        title: "Error",
        description: "Failed to fetch live prices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (userMessage: string) => {
    setIsLoading(true);
    try {
      // Parse the message to identify the bet and closure percentage
      const closeRegex = /close\s+(?:(\d+)%\s+of\s+)?(?:my\s+)?(.*?)(?:\s+bet)?$/i;
      const match = userMessage.match(closeRegex);
      
      if (!match) {
        setMessages(prev => [...prev, { 
          text: "I couldn't understand the position closure request. Try: 'Close my Lakers bet' or 'Close 50% of my Barcelona bet'", 
          sender: "bot" 
        }]);
        return;
      }
      
      const percentageStr = match[1];
      const betName = match[2].trim();
      const percentage = percentageStr ? parseInt(percentageStr) : 100; // Default to 100% if no percentage specified
      
      // Find the bet
      const matchingBets = findBetByName(betName);
      
      if (matchingBets.length === 0) {
        setMessages(prev => [...prev, { 
          text: `I couldn't find any open positions matching "${betName}". Please check the name and try again.`, 
          sender: "bot" 
        }]);
        return;
      }
      
      if (matchingBets.length > 1) {
        // Multiple matches found, ask user to be more specific
        let responseMessage = "I found multiple positions matching that name. Please be more specific:\n\n";
        matchingBets.forEach((bet, index) => {
          responseMessage += `${index + 1}. ${bet.matchName} - ${bet.market} (${bet.betType.toUpperCase()} @ ${bet.betPrice})\n`;
        });
        
        setMessages(prev => [...prev, { text: responseMessage, sender: "bot" }]);
        return;
      }
      
      // Get the current market price - in a real app this would come from an API
      // For now we'll simulate it with a slight deviation from the original price
      const bet = matchingBets[0];
      const deviation = (Math.random() * 0.2) - 0.1; // Random deviation between -10% and +10%
      const currentPrice = bet.betPrice * (1 + deviation);
      const formattedCurrentPrice = parseFloat(currentPrice.toFixed(2));
      
      // Get user account to determine currency type
      const userAccount = getUserAccount(USER_WALLET_ADDRESS);
      const currencySymbol = userAccount.accountType === 'free' ? 'GC' : 'USDC';
      
      // Ask for confirmation
      const direction = percentage === 100 ? "fully close" : `close ${percentage}% of`;
      const confirmMessage = `Are you sure you want to ${direction} your ${bet.betType.toUpperCase()} position on ${bet.matchName} (${bet.market}) at ${bet.betPrice} for ${bet.stakePerPoint}${currencySymbol}/pt?\n\nCurrent market price: ${formattedCurrentPrice}\n\nReply 'confirm' to proceed.`;
      
      // Store the closure details in a data attribute for later
      setMessages(prev => [...prev, { 
        text: confirmMessage, 
        sender: "bot",
        confirmationData: {
          action: "closePosition",
          betId: bet.id,
          percentage,
          currentPrice: formattedCurrentPrice
        }
      }]);
    } catch (error) {
      console.error("❌ Error processing position closure:", error);
      setMessages(prev => [...prev, { 
        text: "There was an error processing your position closure. Please try again.", 
        sender: "bot" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processConfirmation = async (lastBotMessage: any) => {
    if (!lastBotMessage?.confirmationData) return false;
    
    const { action } = lastBotMessage.confirmationData;
    
    if (action === "closePosition") {
      const { betId, percentage, currentPrice } = lastBotMessage.confirmationData;
      try {
        setIsLoading(true);
        
        // Execute the position closure
        if (percentage === 100) {
          fullyCloseBet(betId, currentPrice);
        } else {
          partiallyCloseBet(betId, percentage, currentPrice);
        }
        
        // Calculate P/L
        const bets = getUserBets();
        const updatedBet = bets.find(bet => bet.id === betId);
        
        if (!updatedBet) throw new Error("Bet not found after update");
        
        // Get user account to determine currency type
        const userAccount = getUserAccount(USER_WALLET_ADDRESS);
        const currencySymbol = userAccount.accountType === 'free' ? 'GC' : 'USDC';
        
        let resultMessage = "";
        if (percentage === 100) {
          resultMessage = `✅ Position fully closed at ${currentPrice}.\n`;
        } else {
          resultMessage = `✅ ${percentage}% of position closed at ${currentPrice}.\n`;
        }
        
        // Add P/L information
        const profitLoss = updatedBet.profitLoss || 0;
        if (profitLoss > 0) {
          resultMessage += `You made a profit of ${profitLoss.toFixed(2)}${currencySymbol}. 🎉\n`;
        } else if (profitLoss < 0) {
          resultMessage += `You had a loss of ${Math.abs(profitLoss).toFixed(2)}${currencySymbol}. 📉\n`;
        } else {
          resultMessage += `You broke even on this trade. 🤝\n`;
        }
        
        // Add collateral information
        if (updatedBet.status === "partially_closed") {
          resultMessage += `\nRemaining position: ${updatedBet.stakeOpen}/pt\n`;
          resultMessage += `Collateral still held: ${updatedBet.collateralHeld?.toFixed(2) || 0}${currencySymbol}`;
        } else {
          resultMessage += `\nAll collateral has been released.`;
        }
        
        setMessages(prev => [...prev, { text: resultMessage, sender: "bot" }]);
        
        // Check if profit is high enough to trigger upgrade prompt
        if (userAccount.accountType === 'free' && profitLoss > 100) {
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              text: "You've earned a nice profit! Upgrade to a cash account to withdraw real winnings. Want to learn more?",
              sender: "bot",
              confirmationData: { action: "upgradePrompt" }
            }]);
          }, 2000);
        }
        
        return true;
      } catch (error) {
        console.error("❌ Error executing position closure:", error);
        setMessages(prev => [...prev, { 
          text: "Error executing the position closure. Please try again.", 
          sender: "bot" 
        }]);
        return true;
      } finally {
        setIsLoading(false);
      }
    } else if (action === "upgradePrompt") {
      // This handles user saying "yes" to upgrade prompt
      setMessages(prev => [...prev, { 
        text: "Great choice! To upgrade to a cash account, you'll need to connect your wallet. Would you like me to guide you through the process?",
        sender: "bot",
        confirmationData: { action: "walletConnectGuide" }
      }]);
      return true;
    } else if (action === "walletConnectGuide") {
      // Guide user to connect wallet
      setMessages(prev => [...prev, { 
        text: "Here's how to connect your wallet:\n\n1. Click on the Wallet icon in the top right corner\n2. Click 'Upgrade to Cash Mode'\n3. Follow the prompts to connect your existing wallet or create a new one\n\nOnce connected, you'll be able to deposit USDC and place real money bets.",
        sender: "bot"
      }]);
      return true;
    }
    
    return false;
  };

  const handlePlaceBet = (market: string, action: 'buy' | 'sell', amount: number) => {
    try {
      // Get user account to determine currency type
      const userAccount = getUserAccount(USER_WALLET_ADDRESS);
      const currencyType = userAccount.accountType === 'free' ? 'Gold Coins' : 'USDC';
      
      // Create the bet object
      const bet = {
        matchId: Math.floor(Math.random() * 1000),
        matchName: market,
        market: `${market} Points`,
        betType: action,
        betPrice: action === 'buy' ? 3.2 : 2.8,
        stakePerPoint: amount,
        makeupLimit: 30,
        collateralHeld: amount * 30, // Collateral = stake * makeupLimit
        userId: USER_WALLET_ADDRESS
      };
      
      // Place the bet using the utility function
      const newBet = placeBet(bet, USER_WALLET_ADDRESS);
      
      // Send confirmation message
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: `✅ You ${action === 'buy' ? 'bought' : 'sold'} ${market} at ${newBet.betPrice} for ${amount}${userAccount.accountType === 'free' ? 'GC' : 'USDC'}/pt.\nCollateral held: ${newBet.collateralHeld}${userAccount.accountType === 'free' ? 'GC' : 'USDC'} (${newBet.makeupLimit}x)`,
          sender: "bot" 
        }]);
      }, 500);
      
      toast({
        title: "Position Opened",
        description: `${action.toUpperCase()} position on ${market} for ${amount} per point`,
      });
      
      // If it's a free account and they've placed enough bets, prompt to upgrade
      if (userAccount.accountType === 'free' && userAccount.betsPlaced >= 3 && !userAccount.lastPromptDate) {
        setTimeout(() => {
          setShowUpgradePrompt(true);
        }, 2000);
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error placing bet:", error);
      setMessages(prev => [...prev, { 
        text: "There was an error placing your bet. Please try again.", 
        sender: "bot" 
      }]);
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    
    // Handle confirmations first (like "confirm", "yes", etc.)
    if (userMessage.toLowerCase() === 'confirm') {
      // Get the last bot message
      const lastBotMessage = [...messages].reverse().find(msg => msg.sender === "bot");
      if (lastBotMessage) {
        const handled = await processConfirmation(lastBotMessage);
        if (handled) return;
      }
    } else if (['yes', 'sure', 'okay', 'ok'].includes(userMessage.toLowerCase())) {
      // Look for upgrade prompts
      const lastBotMessage = [...messages].reverse().find(
        msg => msg.sender === "bot" && 
        msg.confirmationData?.action === "upgradePrompt"
      );
      
      if (lastBotMessage) {
        const handled = await processConfirmation(lastBotMessage);
        if (handled) return;
      }
      
      // Look for wallet connect guide prompts
      const walletGuideMessage = [...messages].reverse().find(
        msg => msg.sender === "bot" && 
        msg.confirmationData?.action === "walletConnectGuide"
      );
      
      if (walletGuideMessage) {
        const handled = await processConfirmation(walletGuideMessage);
        if (handled) return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Check for bet placement commands
      const buyRegex = /(?:buy|long)\s+(.*?)(?:\s+at\s+(\d+(?:\.\d+)?))?\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i;
      const sellRegex = /(?:sell|short)\s+(.*?)(?:\s+at\s+(\d+(?:\.\d+)?))?\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i;
      
      const buyMatch = userMessage.match(buyRegex);
      const sellMatch = userMessage.match(sellRegex);
      
      if (buyMatch) {
        const market = buyMatch[1].trim();
        const amount = parseInt(buyMatch[3]);
        
        if (market && !isNaN(amount) && amount > 0) {
          const success = handlePlaceBet(market, 'buy', amount);
          if (success) return;
        }
      } else if (sellMatch) {
        const market = sellMatch[1].trim();
        const amount = parseInt(sellMatch[3]);
        
        if (market && !isNaN(amount) && amount > 0) {
          const success = handlePlaceBet(market, 'sell', amount);
          if (success) return;
        }
      }
      
      if (userMessage.toLowerCase().startsWith('close')) {
        // Handle position closure
        await handleClosePosition(userMessage);
        return;
      }
      
      if (userMessage.startsWith('/')) {
        if (userMessage.startsWith('/buy') || userMessage.startsWith('/sell')) {
          const parts = userMessage.split(' ');
          const action = parts[0].substring(1) as 'buy' | 'sell';
          const market = parts.length > 2 ? parts[1] : ""; 
          const amount = parts.length > 2 ? parseInt(parts[2]) : 0;
          
          if (!market || isNaN(amount) || amount <= 0) {
            setMessages(prev => [...prev, { 
              text: "Invalid format. Use '/buy [market] [amount]' or '/sell [market] [amount]'", 
              sender: "bot" 
            }]);
            return;
          }
          
          handlePlaceBet(market, action, amount);
        } else if (userMessage.toLowerCase() === '/help') {
          // Get account type to determine currency in help message
          const userAccount = getUserAccount(USER_WALLET_ADDRESS);
          const currencyType = userAccount.accountType === 'free' ? 'Gold Coins' : 'USDC';
          
          setMessages(prev => [...prev, { 
            text: `Available commands:\n\n` +
                  `- /buy [market] [amount]: Buy a market with ${currencyType}\n` +
                  `- /sell [market] [amount]: Sell a market with ${currencyType}\n` +
                  `- 'Show [sport] spreads': View current markets\n` +
                  `- 'Close [market] bet': Fully close a position\n` +
                  `- 'Close [percentage]% of [market] bet': Partially close a position\n` +
                  `- /help: Show this help message\n\n` +
                  (userAccount.accountType === 'free' ? 
                    `You're in Free Play mode using Gold Coins. Upgrade to Cash mode to bet with real USDC.` : 
                    `You're in Cash mode betting with real USDC.`), 
            sender: "bot" 
          }]);
        } else if (userMessage.toLowerCase() === '/account') {
          // Show account status
          const userAccount = getUserAccount(USER_WALLET_ADDRESS);
          
          setMessages(prev => [...prev, { 
            text: `Your Account:\n\n` +
                  `- Type: ${userAccount.accountType === 'free' ? 'Free Play' : 'Cash'}\n` +
                  `- Gold Coins: ${userAccount.virtualBalance}\n` +
                  `- USDC Balance: ${userAccount.walletBalance}\n` +
                  `- Bets Placed: ${userAccount.betsPlaced}\n` +
                  (userAccount.accountType === 'free' ? 
                    `\nUpgrade to Cash mode to withdraw real winnings.` : 
                    `\nYour wallet is connected and ready for cash betting.`), 
            sender: "bot" 
          }]);
        } else {
          setMessages(prev => [...prev, { 
            text: "I'm your betting assistant. Try using commands like '/buy Lakers 100' or '/sell West Ham 50', or type '/help' for assistance.", 
            sender: "bot" 
          }]);
        }
      } else if (userMessage.toLowerCase().startsWith('upgrade') || 
                 userMessage.toLowerCase().includes('cash mode') ||
                 userMessage.toLowerCase().includes('wallet')) {
        // Handle upgrade request
        setMessages(prev => [...prev, { 
          text: "Ready to upgrade to Cash mode and bet with real USDC? I'll guide you through connecting your wallet.",
          sender: "bot",
          confirmationData: { action: "walletConnectGuide" }
        }]);
      } else {
        try {
          console.log("🔄 Sending message to chatbot API:", userMessage);
          const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: userMessage,
              context: {
                recentMessages: messages.slice(-5),
                timestamp: new Date().toISOString(),
                accountType: getUserAccount(USER_WALLET_ADDRESS).accountType
              }
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          console.log("✅ Received response from chatbot API:", data);
          setMessages(prev => [...prev, { text: data.response, sender: "bot" }]);
          
        } catch (error) {
          console.error("❌ Error calling chatbot API:", error);
          setMessages(prev => [...prev, { 
            text: "Sorry, I'm having trouble connecting to the betting intelligence API. Please try again later.", 
            sender: "bot" 
          }]);
          
          toast({
            title: "Connection Error",
            description: "Failed to reach AI betting assistant",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("❌ Error processing message:", error);
      setMessages(prev => [...prev, { text: "Error processing your request. Please try again.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="z-50">
      <button 
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-card border border-border rounded-lg shadow-lg w-80 sm:w-96 max-h-[32rem] flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="font-semibold">🎲 Mikey - AI Betting Assistant</h2>
              {connectionStatus === "connected" ? (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
              ) : connectionStatus === "connecting" ? (
                <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              ) : (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-2 flex space-x-2 border-b border-border">
            <button 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm"
              onClick={() => fetchLivePrices("football")}
              disabled={isLoading}
            >
              Football Odds
            </button>
            <button 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm"
              onClick={() => fetchLivePrices("basketball")}
              disabled={isLoading}
            >
              Basketball Odds
            </button>
            <button 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm flex-shrink-0"
              onClick={() => setMessages(prev => [...prev, { 
                text: "Available commands:\n\n" +
                      "- '/buy [market] [amount]': Buy a market\n" +
                      "- '/sell [market] [amount]': Sell a market\n" +
                      "- 'Close [market] bet': Fully close a position\n" +
                      "- 'Close 50% of [market] bet': Partially close\n" +
                      "- '/help': Show all commands", 
                sender: "bot" 
              }])}
              disabled={isLoading}
            >
              Help
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[400px]">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <p>I'm Mikey, your AI betting assistant. Ask me about odds, trends, or strategies!</p>
                <p className="text-sm mt-2">Type /help for available commands</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`${
                    msg.sender === "user" 
                      ? "ml-auto bg-primary/20 text-primary" 
                      : "mr-auto bg-secondary text-secondary-foreground"
                  } p-3 rounded-lg max-w-[80%] break-words`}
                >
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                  
                  {/* Special action buttons for certain message types */}
                  {msg.sender === "bot" && msg.confirmationData?.action === "upgradePrompt" && (
                    <div className="mt-2 flex justify-end gap-2">
                      <button 
                        onClick={() => processConfirmation(msg)}
                        className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  )}
                  
                  {/* Wallet connect guide button */}
                  {msg.sender === "bot" && msg.confirmationData?.action === "walletConnectGuide" && (
                    <div className="mt-2 flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          // Open wallet modal (in a real app, trigger the wallet modal)
                          window.dispatchEvent(new CustomEvent('openWalletModal'));
                          setMessages(prev => [...prev, { 
                            text: "I've opened the wallet panel for you. Select 'Upgrade to Cash Mode' to continue.",
                            sender: "bot" 
                          }]);
                        }}
                        className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
                      >
                        <Wallet className="h-3 w-3" />
                        Connect Wallet
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-center py-2">
                <div className="h-6 w-6 border-2 border-primary border-r-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mikey about bets or markets..."
                className="flex-1 bg-background border border-input px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-primary text-primary-foreground p-2 rounded-md disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBettingChat;
