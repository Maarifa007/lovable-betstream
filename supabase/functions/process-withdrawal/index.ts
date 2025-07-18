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
    const { userId, amount } = await req.json();

    if (!userId || !amount || amount <= 0) {
      throw new Error('Invalid parameters');
    }

    if (amount < 100) {
      throw new Error('Minimum withdrawal amount is ৳100');
    }

    console.log(`Processing withdrawal of ${amount} for user ${userId}`);

    // Check current balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('bet_points')
      .eq('user_id', userId)
      .single();

    if (!wallet || wallet.bet_points < amount) {
      throw new Error('Insufficient balance');
    }

    // Create withdrawal transaction (negative amount)
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: -amount,
      p_transaction_type: 'withdrawal',
      p_description: `Withdrawal request - ৳${amount}`,
      p_reference_id: `withdrawal_${Date.now()}`
    });

    if (walletError) {
      console.error('Wallet update error:', walletError);
      throw new Error('Failed to process withdrawal');
    }

    // Update total withdrawn in wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        total_withdrawn: supabase.sql`total_withdrawn + ${amount}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating total withdrawn:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      amount,
      message: `Withdrawal of ৳${amount} has been requested and will be processed within 24 hours`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});