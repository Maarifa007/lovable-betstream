import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Wallet, TrendingUp, DollarSign, Settings, Bot, User, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'bet_slip' | 'odds_card' | 'deposit_form';
  data?: any;
}

interface BetSlipData {
  match: string;
  odds: string;
  stake: number;
  potential_payout: number;
}

interface OddsCardData {
  matches: Array<{
    id: string;
    home: string;
    away: string;
    odds: {
      home: string;
      away: string;
      draw?: string;
    };
    sport: string;
  }>;
}

interface MikeyChatProps {
  userBalance: number;
  onDepositRequest: () => void;
  onBetPlaced: (bet: any) => void;
}

export default function MikeyChat({ userBalance, onDepositRequest, onBetPlaced }: MikeyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Mikey greeting
    const greeting = language === 'bn' 
      ? "নমস্কার! আমি মিকি, আপনার AI বেটিং সহায়ক। আপনি বাংলা বা English এ কথা বলতে পারেন। আজকের খেলার জন্য আপনার প্রিয় দল কোনটি?"
      : "Welcome to BanglaBet! I'm Mikey, your AI betting assistant. I can chat in বাংলা or English. What's your favorite team for today's matches?";
    
    setMessages([{
      id: '1',
      content: greeting,
      isBot: true,
      timestamp: new Date()
    }]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call Mikey AI service
      const response = await supabase.functions.invoke('mikey-chat', {
        body: {
          message: inputValue,
          language: language,
          userBalance: userBalance
        }
      });

      if (response.error) throw response.error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        isBot: true,
        timestamp: new Date(),
        type: response.data.type || 'text',
        data: response.data.data
      };

      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: language === 'bn' 
          ? "দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          : "Sorry, something went wrong. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'bet_slip' && message.data) {
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <BetSlipCard data={message.data} onConfirm={onBetPlaced} />
        </div>
      );
    }

    if (message.type === 'odds_card' && message.data) {
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <OddsCard data={message.data} />
        </div>
      );
    }

    if (message.type === 'deposit_form') {
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <Button onClick={onDepositRequest} className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Deposit Now
          </Button>
        </div>
      );
    }

    return <p>{message.content}</p>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Mikey</CardTitle>
              <p className="text-sm text-muted-foreground">AI Betting Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">৳{userBalance.toLocaleString()}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            >
              {language === 'en' ? 'বাং' : 'EN'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={message.isBot ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                    {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 ${
                  message.isBot 
                    ? 'bg-muted text-foreground' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {renderMessage(message)}
                  <p className="text-xs opacity-70 mt-2">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'bn' ? "একটি বার্তা লিখুন..." : "Type a message..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Bet Slip Component
function BetSlipCard({ data, onConfirm }: { data: BetSlipData; onConfirm: (bet: any) => void }) {
  const [stake, setStake] = useState(data.stake || 0);
  
  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{data.match}</h4>
          <Badge>{data.odds}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            placeholder="Stake amount"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">৳</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Potential Payout:</span>
          <span className="font-semibold">৳{(stake * parseFloat(data.odds)).toFixed(2)}</span>
        </div>
        <Button 
          onClick={() => onConfirm({ ...data, stake })} 
          className="w-full"
          disabled={stake <= 0}
        >
          Place Bet
        </Button>
      </CardContent>
    </Card>
  );
}

// Odds Card Component
function OddsCard({ data }: { data: OddsCardData }) {
  return (
    <div className="space-y-2">
      {data.matches.map((match) => (
        <Card key={match.id} className="border-secondary/20">
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium text-sm">{match.home} vs {match.away}</h5>
              <Badge variant="outline" className="text-xs">{match.sport}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Button variant="outline" size="sm" className="h-8">
                {match.home}: {match.odds.home}
              </Button>
              {match.odds.draw && (
                <Button variant="outline" size="sm" className="h-8">
                  Draw: {match.odds.draw}
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8">
                {match.away}: {match.odds.away}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}