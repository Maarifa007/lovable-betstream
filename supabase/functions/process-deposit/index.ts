import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, method, language = 'en' } = await req.json();

    if (!userId || !amount || amount <= 0) {
      throw new Error('Invalid parameters');
    }

    console.log(`Processing ${method} deposit of ${amount} for user ${userId}`);

    // For demo purposes, we'll simulate successful payment processing
    // In production, you'd integrate with actual payment processors
    
    let paymentId;
    let description;

    switch (method) {
      case 'bkash':
        paymentId = `bkash_${Date.now()}`;
        description = language === 'bn' 
          ? `bKash জমা - ৳${amount}`
          : `bKash deposit - ৳${amount}`;
        break;
      case 'nagad':
        paymentId = `nagad_${Date.now()}`;
        description = language === 'bn' 
          ? `Nagad জমা - ৳${amount}`
          : `Nagad deposit - ৳${amount}`;
        break;
      case 'usdt':
        paymentId = `usdt_${Date.now()}`;
        description = language === 'bn' 
          ? `USDT জমা - ৳${amount}`
          : `USDT deposit - ৳${amount}`;
        break;
      default:
        throw new Error('Invalid payment method');
    }

    // Update wallet balance using the built-in function
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: 'deposit',
      p_description: description,
      p_reference_id: paymentId
    });

    if (walletError) {
      console.error('Wallet update error:', walletError);
      throw new Error('Failed to update wallet balance');
    }

    // Update total deposited in wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        total_deposited: supabase.sql`total_deposited + ${amount}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating total deposited:', updateError);
    }

    // Apply 200% bonus for first deposit
    const { data: existingDeposits } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'deposit')
      .limit(1);

    if (!existingDeposits || existingDeposits.length === 1) {
      // This is the first deposit, apply bonus
      const bonusAmount = amount * 2; // 200% bonus
      
      const { error: bonusError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: bonusAmount,
        p_transaction_type: 'bonus',
        p_description: language === 'bn' 
          ? `200% স্বাগতম বোনাস - ৳${bonusAmount}`
          : `200% Welcome Bonus - ৳${bonusAmount}`,
        p_reference_id: paymentId
      });

      if (bonusError) {
        console.error('Bonus error:', bonusError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      paymentId,
      amount,
      method,
      message: language === 'bn' 
        ? `৳${amount} সফলভাবে জমা হয়েছে`
        : `৳${amount} deposited successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing deposit:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});