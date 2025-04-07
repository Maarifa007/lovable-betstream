
import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Wallet, Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getUserBets, 
  getUserAccount,
  shouldPromptUpgrade,
  markUpgradePrompt
} from "@/utils/betUtils";
import { mockPlaceTradeEndpoint, mockClosePositionEndpoint } from "@/utils/tradeApi";
import marketScraper from "@/services/marketScraperService";

// Default user wallet address - in real app this would come from auth
const USER_WALLET_ADDRESS = "0x1234...5678";

const LiveBettingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: "user" | "bot", confirmationData?: any}>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [tradeContext, setTradeContext] = useState<any>(null);

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
      text: "👋 Hi! I'm Mikey, your AI betting assistant. I can help you place bets, check odds, or close positions. Try commands like:\n\n• 'Show NBA spreads'\n• 'Buy Lakers at 5.5 for $10/pt'\n• 'Close my Warriors bet'\n• 'Close 50% of my Lakers bet'\n• 'Bet live on Barcelona'\n\nType /help for more commands.",
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

      // Use the market scraper service
      try {
        const markets = await marketScraper.fetchMarkets(sport as any);
        
        let responseMessage = `📊 Live Prices for ${sport.toUpperCase()}:\n\n`;
        markets.forEach(game => {
          responseMessage += `${game.match}:\nBuy ${game.buyPrice.toFixed(2)} | Sell ${game.sellPrice.toFixed(2)}\n\n`;
        });
        
        setMessages(prev => [...prev, { text: responseMessage, sender: "bot" }]);
      } catch (error) {
        console.error("❌ Error fetching market data:", error);
        
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
      }
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

  const handleFetchLivePrice = async (matchName: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { text: `Getting live price for ${matchName}...`, sender: "bot" }]);
      
      // Guess the sport based on the match name
      const sportKeywords = {
        football: ['united', 'fc', 'city', 'arsenal', 'chelsea', 'liverpool', 'madrid', 'barcelona'],
        basketball: ['lakers', 'bulls', 'warriors', 'celtics', 'heat', 'knicks', 'bucks'],
        tennis: ['djokovic', 'nadal', 'federer', 'murray', 'williams', 'osaka'],
        golf: ['woods', 'mcilroy', 'masters', 'open', 'championship', 'pga']
      };
      
      const normalizedMatch = matchName.toLowerCase();
      let sport: string = 'football';
      
      for (const [sportName, keywords] of Object.entries(sportKeywords)) {
        for (const keyword of keywords) {
          if (normalizedMatch.includes(keyword)) {
            sport = sportName;
            break;
          }
        }
      }
      
      // Fetch live prices from the market scraper
      const markets = await marketScraper.fetchMarkets(sport as any);
      
      // Find a match that contains the requested match name
      const matchedMarket = markets.find(market => 
        market.match.toLowerCase().includes(normalizedMatch)
      );
      
      if (matchedMarket) {
        // Got a match, display the live price
        const responseMessage = `Live price for ${matchedMarket.match}:\n` +
                                `Buy: ${matchedMarket.buyPrice.toFixed(2)} / Sell: ${matchedMarket.sellPrice.toFixed(2)}\n\n` +
                                `Would you like to place a trade? Reply with:\n` +
                                `"Buy ${matchName} for [stake]/pt" or\n` +
                                `"Sell ${matchName} for [stake]/pt"`;
        
        setMessages(prev => [...prev, { 
          text: responseMessage, 
          sender: "bot",
          confirmationData: {
            action: "priceQuote",
            matchName: matchedMarket.match,
            buyPrice: matchedMarket.buyPrice,
            sellPrice: matchedMarket.sellPrice
          }
        }]);
        
        // Set trade context for easier follow-up
        setTradeContext({
          matchName: matchedMarket.match,
          matchId: Math.floor(Math.random() * 10000).toString(),
          buyPrice: matchedMarket.buyPrice,
          sellPrice: matchedMarket.sellPrice
        });
      } else {
        // No match found, use sample data
        const buyPrice = 3.2 + (Math.random() * 0.4 - 0.2);
        const sellPrice = buyPrice - 0.4;
        
        const responseMessage = `Live price for ${matchName} (Sample Data):\n` +
                               `Buy: ${buyPrice.toFixed(2)} / Sell: ${sellPrice.toFixed(2)}\n\n` +
                               `Would you like to place a trade? Reply with:\n` +
                               `"Buy ${matchName} for [stake]/pt" or\n` +
                               `"Sell ${matchName} for [stake]/pt"`;
        
        setMessages(prev => [...prev, { 
          text: responseMessage, 
          sender: "bot",
          confirmationData: {
            action: "priceQuote",
            matchName: matchName,
            buyPrice: buyPrice,
            sellPrice: sellPrice
          }
        }]);
        
        // Set trade context for easier follow-up
        setTradeContext({
          matchName: matchName,
          matchId: Math.floor(Math.random() * 10000).toString(),
          buyPrice: buyPrice,
          sellPrice: sellPrice
        });
      }
    } catch (error) {
      console.error("❌ Error fetching live price:", error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I couldn't fetch the live price for that market. Please try another market or try again later.", 
        sender: "bot" 
      }]);
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
      const percentage = percentageStr ? parseInt(percentageStr) / 100 : 1.0; // Convert to decimal (0.5 for 50%)
      
      // Prepare the API request
      const request = {
        body: {
          userId: USER_WALLET_ADDRESS,
          matchName: betName,
          percentageToClose: percentage
        }
      };
      
      // Call the mock API endpoint
      const response = await mockClosePositionEndpoint(request);
      
      if (response.status !== 200 || !response.json.success) {
        setMessages(prev => [...prev, { 
          text: response.json.message || "Failed to close position. Please try again.", 
          sender: "bot" 
        }]);
        return;
      }
      
      // Build success message
      const data = response.json;
      const userAccount = getUserAccount(USER_WALLET_ADDRESS);
      const currencySymbol = userAccount.accountType === 'free' ? 'GC' : 'USDC';
      
      let resultMessage = `✅ Position ${percentage === 1 ? 'fully' : `${Math.round(percentage * 100)}%`} closed at ${data.currentPrice.toFixed(2)}.\n`;
      
      // Add P/L information
      const profitLoss = data.profitLoss || 0;
      if (profitLoss > 0) {
        resultMessage += `You made a profit of ${profitLoss.toFixed(2)}${currencySymbol}. 🎉\n`;
      } else if (profitLoss < 0) {
        resultMessage += `You had a loss of ${Math.abs(profitLoss).toFixed(2)}${currencySymbol}. 📉\n`;
      } else {
        resultMessage += `You broke even on this trade. 🤝\n`;
      }
      
      // Add collateral information
      resultMessage += `\nCollateral released: ${data.collateralReleased?.toFixed(2) || 0}${currencySymbol}\n`;
      
      if (data.newStatus === "partially_closed") {
        resultMessage += `Position is now partially closed. You can close the rest later.\n`;
      } else {
        resultMessage += `Position is now fully closed.\n`;
      }
      
      resultMessage += `\nYour new balance: ${data.newBalance.toFixed(2)}${currencySymbol}`;
      
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

  const handlePlaceTrade = async (action: 'buy' | 'sell', matchName: string, stake: number) => {
    try {
      setIsLoading(true);
      
      // Get the match information from context or create new if missing
      const match = tradeContext && tradeContext.matchName.toLowerCase().includes(matchName.toLowerCase())
        ? tradeContext
        : {
            matchName: matchName,
            matchId: Math.floor(Math.random() * 10000).toString(),
            buyPrice: action === 'buy' ? 3.2 : 3.0,
            sellPrice: action === 'buy' ? 3.0 : 2.8
          };
      
      // Get user account to determine currency type
      const userAccount = getUserAccount(USER_WALLET_ADDRESS);
      const multiplier = 20; // Default collateral multiplier
      
      // Prepare the API request
      const request = {
        body: {
          userId: USER_WALLET_ADDRESS,
          matchId: match.matchId,
          matchName: match.matchName,
          action: action,
          stake: stake,
          multiplier: multiplier,
          accountType: userAccount.accountType
        }
      };
      
      // Call the mock API endpoint
      const response = await mockPlaceTradeEndpoint(request);
      
      if (response.status !== 200 || !response.json.success) {
        setMessages(prev => [...prev, { 
          text: response.json.message || "Failed to place trade. Please try again.", 
          sender: "bot" 
        }]);
        return;
      }
      
      // Build success message
      const data = response.json;
      const currencySymbol = userAccount.accountType === 'free' ? 'GC' : 'USDC';
      const collateralHeld = stake * multiplier;
      
      const resultMessage = `✅ Trade confirmed: ${action.toUpperCase()} ${match.matchName} at ${data.entryPrice.toFixed(2)} for ${stake}${currencySymbol}/pt.\n\n` +
                           `Collateral held: ${collateralHeld}${currencySymbol} (${multiplier}x multiplier)\n` +
                           `Your new balance: ${data.newBalance.toFixed(2)}${currencySymbol}\n\n` +
                           `To close this position later, say "Close my ${match.matchName} bet" or "Close 50% of my ${match.matchName} bet"`;
      
      setMessages(prev => [...prev, { text: resultMessage, sender: "bot" }]);
      
      // Clear trade context
      setTradeContext(null);
      
      // Show toast notification
      toast({
        title: "Position Opened",
        description: `${action.toUpperCase()} position on ${match.matchName} for ${stake}${currencySymbol}/pt`,
      });
    } catch (error) {
      console.error("❌ Error placing trade:", error);
      setMessages(prev => [...prev, { 
        text: "There was an error placing your trade. Please try again.", 
        sender: "bot" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processConfirmation = async (lastBotMessage: any) => {
    if (!lastBotMessage?.confirmationData) return false;
    
    const { action } = lastBotMessage.confirmationData;
    
    if (action === "upgradePrompt") {
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
      
      // Check for "bet live on X" pattern
      const betLiveMatch = userMessage.match(/bet\s+live\s+(?:on\s+)?(.*)/i);
      if (betLiveMatch) {
        const matchName = betLiveMatch[1].trim();
        await handleFetchLivePrice(matchName);
        return;
      }
      
      // Check for "live price for X" pattern
      const livePriceMatch = userMessage.match(/live\s+price\s+(?:for\s+)?(.*)/i);
      if (livePriceMatch) {
        const matchName = livePriceMatch[1].trim();
        await handleFetchLivePrice(matchName);
        return;
      }
      
      // Check for "place trade" pattern (if we have trade context)
      if (userMessage.toLowerCase().includes('place trade') && tradeContext) {
        const userAccount = getUserAccount(USER_WALLET_ADDRESS);
        
        // Ask for buy/sell direction and stake
        setMessages(prev => [...prev, { 
          text: `For ${tradeContext.matchName}:\n\n` +
                `Buy price: ${tradeContext.buyPrice.toFixed(2)}\n` +
                `Sell price: ${tradeContext.sellPrice.toFixed(2)}\n\n` +
                `Would you like to Buy or Sell? And how much per point?\n\n` +
                `Example: "Buy for 10/pt" or "Sell for 5/pt"`,
          sender: "bot"
        }]);
        return;
      }
      
      // Check for bet placement commands
      const buyRegex = /(?:buy|long)\s+(.*?)(?:\s+at\s+(\d+(?:\.\d+)?))?\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i;
      const sellRegex = /(?:sell|short)\s+(.*?)(?:\s+at\s+(\d+(?:\.\d+)?))?\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i;
      
      const buyMatch = userMessage.match(buyRegex);
      const sellMatch = userMessage.match(sellRegex);
      
      if (buyMatch) {
        const market = buyMatch[1].trim();
        const amount = parseInt(buyMatch[3]);
        
        if (market && !isNaN(amount) && amount > 0) {
          await handlePlaceTrade('buy', market, amount);
          return;
        }
      } else if (sellMatch) {
        const market = sellMatch[1].trim();
        const amount = parseInt(sellMatch[3]);
        
        if (market && !isNaN(amount) && amount > 0) {
          await handlePlaceTrade('sell', market, amount);
          return;
        }
      }
      
      // Simpler buy/sell commands (when we have trade context)
      if (tradeContext) {
        const simpleBuyMatch = userMessage.match(/buy\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i);
        const simpleSellMatch = userMessage.match(/sell\s+(?:for\s+)?\$?(\d+)(?:\/pt)?/i);
        
        if (simpleBuyMatch) {
          const amount = parseInt(simpleBuyMatch[1]);
          if (!isNaN(amount) && amount > 0) {
            await handlePlaceTrade('buy', tradeContext.matchName, amount);
            return;
          }
        } else if (simpleSellMatch) {
          const amount = parseInt(simpleSellMatch[1]);
          if (!isNaN(amount) && amount > 0) {
            await handlePlaceTrade('sell', tradeContext.matchName, amount);
            return;
          }
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
          
          await handlePlaceTrade(action, market, amount);
        } else if (userMessage.toLowerCase() === '/help') {
          // Get account type to determine currency in help message
          const userAccount = getUserAccount(USER_WALLET_ADDRESS);
          const currencyType = userAccount.accountType === 'free' ? 'Gold Coins' : 'USDC';
          
          setMessages(prev => [...prev, { 
            text: `Available commands:\n\n` +
                  `- 'Bet live on [market]': Get current prices\n` +
                  `- 'Buy [market] for [amount]/pt': Open buy position\n` +
                  `- 'Sell [market] for [amount]/pt': Open sell position\n` +
                  `- 'Close [market] bet': Fully close a position\n` +
                  `- 'Close [percentage]% of [market] bet': Partially close a position\n` +
                  `- '/help': Show this help message\n\n` +
                  (userAccount.accountType === 'free' ? 
                    `You're in Free Play mode using Gold Coins. Upgrade to Cash mode to bet with real USDC.` : 
                    `You're in Cash mode betting with real USDC.`) + 
                    `\n\nNo purchase necessary. Free points available daily. Terms apply.`, 
            sender: "bot" 
          }]);
        } else if (userMessage.toLowerCase() === '/account') {
          // Show account status
          const userAccount = getUserAccount(USER_WALLET_ADDRESS);
          
          setMessages(prev => [...prev, { 
            text: `Your Account:\n\n` +
                  `- Type: ${userAccount.accountType === 'free' ? 'Free Play' : 'Cash'}\n` +
                  `- Gold Coins: ${userAccount.virtualBalance.toFixed(2)}\n` +
                  `- USDC Balance: ${userAccount.walletBalance.toFixed(2)}\n` +
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
      } else if (userMessage.toLowerCase().includes('football spreads') || 
                 userMessage.toLowerCase().includes('football odds')) {
        await fetchLivePrices('football');
      } else if (userMessage.toLowerCase().includes('basketball spreads') || 
                 userMessage.toLowerCase().includes('basketball odds')) {
        await fetchLivePrices('basketball');
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
                      "- 'Bet live on [team]': Get current odds\n" +
                      "- 'Buy [market] for [amount]/pt': Buy position\n" +
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
            <div className="mt-2 text-xs text-muted-foreground text-center">
              No purchase necessary. Free points available daily. Terms apply.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBettingChat;

