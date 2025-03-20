import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LiveBettingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: "user" | "bot"}>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLivePrices = async (sport: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { text: `Fetching live prices for ${sport}...`, sender: "bot" }]);

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const sampleData = [
        { market_name: `${sport === 'football' ? 'West Ham vs Leicester' : 'Lakers vs Warriors'}`, buy_price: "3.2", sell_price: "2.8" },
        { market_name: `${sport === 'football' ? 'Barcelona vs Real Madrid' : 'Bulls vs Celtics'}`, buy_price: "10.8", sell_price: "10.2" }
      ];
      
      let response = `📊 Live Prices for ${sport.toUpperCase()}:\n\n`;
      sampleData.forEach(game => {
        response += `${game.market_name}:\nBuy ${game.buy_price} | Sell ${game.sell_price}\n\n`;
      });

      setMessages(prev => [...prev, { text: response, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching prices:", error);
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    
    try {
      setIsLoading(true);
      
      if (userMessage.startsWith('/')) {
        if (userMessage.startsWith('/buy') || userMessage.startsWith('/sell')) {
          const parts = userMessage.split(' ');
          const action = parts[0].substring(1);
          const market = parts.length > 2 ? parts[1] : ""; 
          const amount = parts.length > 2 ? parseInt(parts[2]) : 0;
          
          if (!market || isNaN(amount) || amount <= 0) {
            setMessages(prev => [...prev, { 
              text: "Invalid format. Use '/buy [market] [amount]' or '/sell [market] [amount]'", 
              sender: "bot" 
            }]);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const betId = `bet-${Date.now()}`;
          const bet = {
            id: betId,
            matchId: Math.floor(Math.random() * 1000),
            matchName: market,
            market: `${market} Points`,
            betType: action as 'buy' | 'sell',
            betPrice: action === 'buy' ? 3.2 : 2.8,
            stakePerPoint: amount,
            makeupLimit: 30,
            status: 'open',
            timestamp: Date.now()
          };
          
          const storedBets = localStorage.getItem('userBets');
          const bets = storedBets ? JSON.parse(storedBets) : [];
          localStorage.setItem('userBets', JSON.stringify([...bets, bet]));
          
          setMessages(prev => [...prev, { 
            text: `✅ ${action.toUpperCase()} position opened on ${market} for ${amount} per point`, 
            sender: "bot" 
          }]);
          
          toast({
            title: "Position Opened",
            description: `${action.toUpperCase()} position on ${market} for ${amount} per point`,
          });
        } else if (userMessage.toLowerCase() === '/help') {
          setMessages(prev => [...prev, { 
            text: "Available commands:\n\n" +
                  "- /buy [market] [amount]: Buy a market\n" +
                  "- /sell [market] [amount]: Sell a market\n" +
                  "- /help: Show this help message", 
            sender: "bot" 
          }]);
        } else {
          setMessages(prev => [...prev, { 
            text: "I'm your betting assistant. Try using commands like '/buy Lakers 100' or '/sell West Ham 50', or type '/help' for assistance.", 
            sender: "bot" 
          }]);
        }
      } else {
        try {
          const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          setMessages(prev => [...prev, { text: data.response, sender: "bot" }]);
          
        } catch (error) {
          console.error("Error calling chatbot API:", error);
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
      console.error("Error processing message:", error);
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
            <h2 className="font-semibold">🎲 Live Betting Assistant</h2>
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
              Get Football Odds
            </button>
            <button 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm"
              onClick={() => fetchLivePrices("basketball")}
              disabled={isLoading}
            >
              Get Basketball Odds
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[400px]">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <p>I'm your AI betting assistant. Ask me about odds, trends, or strategies!</p>
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
                placeholder="Ask about markets or type /help"
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
