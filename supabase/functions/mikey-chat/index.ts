import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en', userBalance = 0 } = await req.json();

    // Detect intent and context
    const intent = detectIntent(message.toLowerCase());
    const isAdmin = message.toLowerCase().includes('admin');

    let response;
    
    if (isAdmin) {
      response = await handleAdminQuery(message, language);
    } else {
      switch (intent) {
        case 'payout':
          response = await handlePayoutQuery(message, language, userBalance);
          break;
        case 'deposit':
          response = handleDepositQuery(message, language, userBalance);
          break;
        case 'odds':
          response = await handleOddsQuery(message, language);
          break;
        case 'bet':
          response = await handleBetQuery(message, language);
          break;
        case 'balance':
          response = handleBalanceQuery(userBalance, language);
          break;
        case 'greeting':
          response = handleGreeting(language);
          break;
        default:
          response = await callOpenAI(message, language, userBalance);
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mikey-chat function:', error);
    return new Response(JSON.stringify({ 
      message: "Something went wrong. Please try again.",
      type: 'text'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectIntent(message: string): string {
  if (message.includes('payout') || message.includes('withdraw') || message.includes('cash out') || message.includes('withdraw money') || message.includes('টাকা তুলতে')) {
    return 'payout';
  }
  if (message.includes('deposit') || message.includes('add money') || message.includes('fund')) {
    return 'deposit';
  }
  if (message.includes('odds') || message.includes('today') || message.includes('cricket') || message.includes('football')) {
    return 'odds';
  }
  if (message.includes('bet') || message.includes('place') || message.includes('wager')) {
    return 'bet';
  }
  if (message.includes('balance') || message.includes('money') || message.includes('how much')) {
    return 'balance';
  }
  if (message.includes('hello') || message.includes('hi') || message.includes('নমস্কার')) {
    return 'greeting';
  }
  return 'general';
}

function handleGreeting(language: string) {
  const messages = {
    en: "Welcome to BanglaBet! Please deposit to begin betting on Cricket, Soccer, Kabaddi, and more. I can help you with:\n• Deposit funds (USDT, bKash, Nagad)\n• Check today's odds\n• Place real-money bets\n• 200% Welcome Bonus (25x wagering, no time limit)\n\nWhat would you like to do?",
    bn: "স্বাগতম BanglaBet-এ! বাজি ধরতে অ্যাকাউন্টে টাকা জমা দিন। আমি সাহায্য করতে পারি:\n• টাকা জমা (USDT, bKash, Nagad)\n• আজকের অডস দেখতে\n• সত্যিকারের টাকা দিয়ে বাজি ধরতে\n• ২০০% স্বাগত বোনাস (২৫ গুণ বাজির শর্ত, সময়ের সীমা নেই)\n\nআপনি কী করতে চান?"
  };
  
  return {
    message: messages[language as keyof typeof messages] || messages.en,
    type: 'text'
  };
}

function handleBalanceQuery(balance: number, language: string) {
  const messages = {
    en: `Your current balance is ৳${balance.toLocaleString()}. Would you like to deposit more funds or place a bet?`,
    bn: `আপনার বর্তমান ব্যালেন্স ৳${balance.toLocaleString()}। আপনি কি আরো টাকা জমা দিতে চান নাকি বেট রাখতে চান?`
  };
  
  return {
    message: messages[language as keyof typeof messages] || messages.en,
    type: 'text'
  };
}

function handleDepositQuery(message: string, language: string, balance: number) {
  const messages = {
    en: `Your current balance is ৳${balance.toLocaleString()}. Deposit required to place bets. You can fund using USDT, bKash, or Nagad. Which do you prefer? (200% Welcome Bonus available on first deposit)`,
    bn: `আপনার বর্তমান ব্যালেন্স ৳${balance.toLocaleString()}। বাজি ধরতে জমা প্রয়োজন। আপনি USDT, bKash বা Nagad দিয়ে জমা দিতে পারেন। কোনটি ব্যবহার করতে চান? (প্রথম জমায় ২০০% বোনাস পাওয়া যাবে)`
  };
  
  return {
    message: messages[language as keyof typeof messages] || messages.en,
    type: 'deposit_form'
  };
}

async function handleOddsQuery(message: string, language: string) {
  try {
    // Get live contests
    const { data: contests } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'upcoming')
      .limit(5);

    if (!contests || contests.length === 0) {
      const messages = {
        en: "No live matches available right now. Check back soon for exciting betting opportunities!",
        bn: "এই মুহূর্তে কোন লাইভ ম্যাচ নেই। শীঘ্রই আকর্ষণীয় বেটিং সুযোগের জন্য আবার চেক করুন!"
      };
      
      return {
        message: messages[language as keyof typeof messages] || messages.en,
        type: 'text'
      };
    }

    const matches = contests.map(contest => ({
      id: contest.id,
      home: contest.title.split(' vs ')[0] || contest.title,
      away: contest.title.split(' vs ')[1] || 'TBD',
      odds: {
        home: '1.85',
        away: '2.10',
        draw: contest.sport_type === 'cricket' ? undefined : '3.20'
      },
      sport: contest.sport_type
    }));

    const messages = {
      en: "Here are today's top matches with live odds:",
      bn: "আজকের টপ ম্যাচগুলি লাইভ অডসসহ:"
    };

    return {
      message: messages[language as keyof typeof messages] || messages.en,
      type: 'odds_card',
      data: { matches }
    };

  } catch (error) {
    console.error('Error fetching odds:', error);
    return {
      message: "Unable to fetch odds right now. Please try again.",
      type: 'text'
    };
  }
}

async function handleBetQuery(message: string, language: string) {
  const messages = {
    en: "I'd be happy to help you place a bet! First, let me show you today's matches:",
    bn: "আমি আপনাকে বেট রাখতে সাহায্য করতে পেরে খুশি! প্রথমে, আজকের ম্যাচগুলি দেখি:"
  };
  
  return await handleOddsQuery(message, language);
}

async function handlePayoutQuery(message: string, language: string, userBalance: number) {
  if (userBalance < 100) {
    const messages = {
      en: "Minimum withdrawal amount is ৳100. Your current balance is ৳" + userBalance + ". Please deposit more or win more bets to reach the minimum.",
      bn: "সর্বনিম্ন উত্তোলনের পরিমাণ ৳১০০। আপনার বর্তমান ব্যালেন্স ৳" + userBalance + "। সর্বনিম্ন পরিমাণ পৌঁছাতে আরো জমা দিন বা আরো বেট জিতুন।"
    };
    
    return {
      message: messages[language as keyof typeof messages] || messages.en,
      type: 'text'
    };
  }

  const messages = {
    en: `Great! You can withdraw up to ৳${userBalance.toLocaleString()}. Please provide your withdrawal details:\n\n• Amount (minimum ৳100)\n• Wallet address (USDT/Crypto)\n• Preferred method (Binance, Coinbase, etc.)\n\nI'll submit your request for admin approval.`,
    bn: `চমৎকার! আপনি ৳${userBalance.toLocaleString()} পর্যন্ত উত্তোলন করতে পারেন। অনুগ্রহ করে আপনার উত্তোলনের বিবরণ দিন:\n\n• পরিমাণ (সর্বনিম্ন ৳১০০)\n• ওয়ালেট ঠিকানা (USDT/ক্রিপ্টো)\n• পছন্দের পদ্ধতি (Binance, Coinbase, ইত্যাদি)\n\nআমি অ্যাডমিন অনুমোদনের জন্য আপনার অনুরোধ জমা দেব।`
  };
  
  return {
    message: messages[language as keyof typeof messages] || messages.en,
    type: 'payout_form',
    data: { maxAmount: userBalance }
  };
}

async function handleAdminQuery(message: string, language: string) {
  // Simple admin responses - in production, you'd verify admin status
  const messages = {
    en: "Admin mode detected. You can:\n• Create new contests\n• Update odds\n• Manage user accounts\n• Grade completed matches\n• Approve withdrawal requests\n\nWhat would you like to do?",
    bn: "অ্যাডমিন মোড শনাক্ত করা হয়েছে। আপনি পারেন:\n• নতুন প্রতিযোগিতা তৈরি করতে\n• অডস আপডেট করতে\n• ব্যবহারকারীর অ্যাকাউন্ট পরিচালনা করতে\n• সম্পূর্ণ ম্যাচের গ্রেড করতে\n• উত্তোলনের অনুরোধ অনুমোদন করতে\n\nআপনি কী করতে চান?"
  };
  
  return {
    message: messages[language as keyof typeof messages] || messages.en,
    type: 'text'
  };
}

async function callOpenAI(message: string, language: string, userBalance: number) {
  if (!openAIApiKey) {
    return {
      message: "AI service temporarily unavailable. Please try basic commands like 'odds', 'balance', or 'deposit'.",
      type: 'text'
    };
  }

  try {
    const systemPrompt = language === 'bn' 
      ? `আপনি মিকি, একটি বাংলাদেশী সত্যিকারের টাকার বেটিং AI সহায়ক। শুধুমাত্র আসল টাকা দিয়ে বাজি ধরা যায়। বাজি ধরতে জমা প্রয়োজন। ২০০% স্বাগত বোনাস প্রথম জমায়। USDT, bKash, Nagad গ্রহণযোগ্য। কোনো বিনামূল্যে খেলা নেই। ব্যবহারকারীর ব্যালেন্স: ৳${userBalance}`
      : `You are Mikey, a Bangladeshi real-money sports betting AI assistant. Only real money betting - deposit required to place bets. 200% Welcome Bonus on first deposit. Accept USDT, bKash, Nagad. No free play. No sweepstakes. User balance: ৳${userBalance}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    
    return {
      message: data.choices[0].message.content,
      type: 'text'
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      message: language === 'bn' 
        ? "দুঃখিত, এই মুহূর্তে AI সেবা পাওয়া যাচ্ছে না।"
        : "Sorry, AI service is unavailable right now.",
      type: 'text'
    };
  }
}