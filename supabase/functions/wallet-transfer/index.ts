import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fromUserId, toUserId, amount } = await req.json();
    console.log('Processing transfer:', { fromUserId, toUserId, amount });

    if (!fromUserId || !toUserId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid transfer parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check sender's balance
    const { data: senderWallet, error: senderError } = await supabaseClient
      .from('wallets')
      .select('bet_points')
      .eq('user_id', fromUserId)
      .single();

    if (senderError || !senderWallet || senderWallet.bet_points < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify recipient exists
    const { data: recipientWallet, error: recipientError } = await supabaseClient
      .from('wallets')
      .select('user_id')
      .eq('user_id', toUserId)
      .single();

    if (recipientError || !recipientWallet) {
      return new Response(
        JSON.stringify({ error: 'Recipient wallet not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform transfer using wallet balance update function
    const { error: debitError } = await supabaseClient
      .rpc('update_wallet_balance', {
        p_user_id: fromUserId,
        p_amount: -amount,
        p_transaction_type: 'transfer_out',
        p_description: `Transfer to user ${toUserId}`,
        p_reference_id: toUserId
      });

    if (debitError) {
      console.error('Debit error:', debitError);
      return new Response(
        JSON.stringify({ error: 'Transfer failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { error: creditError } = await supabaseClient
      .rpc('update_wallet_balance', {
        p_user_id: toUserId,
        p_amount: amount,
        p_transaction_type: 'transfer_in',
        p_description: `Transfer from user ${fromUserId}`,
        p_reference_id: fromUserId
      });

    if (creditError) {
      console.error('Credit error:', creditError);
      // TODO: Implement rollback mechanism
      return new Response(
        JSON.stringify({ error: 'Transfer partially failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully transferred ${amount} from ${fromUserId} to ${toUserId}` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Transfer error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});