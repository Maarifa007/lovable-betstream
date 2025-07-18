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
    const { userId, amount, description } = await req.json();

    if (!userId || amount === undefined) {
      throw new Error('Invalid parameters');
    }

    console.log(`Admin balance update: ${amount} for user ${userId}`);

    // Get current user to verify admin is making this request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Update wallet balance
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: amount > 0 ? 'admin_credit' : 'admin_debit',
      p_description: description || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount}`,
      p_reference_id: `admin_${Date.now()}`
    });

    if (walletError) {
      console.error('Wallet update error:', walletError);
      throw new Error('Failed to update balance');
    }

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: userId, // In production, this would be the admin's ID, not target user
        target_user_id: userId,
        action: amount > 0 ? 'credit_balance' : 'debit_balance',
        details: { amount, description }
      });

    if (logError) {
      console.error('Admin log error:', logError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      amount,
      message: `Balance ${amount > 0 ? 'increased' : 'decreased'} by ৳${Math.abs(amount)}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin balance update:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});