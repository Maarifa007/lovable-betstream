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
    const { contestId, result } = await req.json();

    if (!contestId || !result) {
      throw new Error('Contest ID and result are required');
    }

    console.log(`Grading contest ${contestId} with result: ${result}`);

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      throw new Error('Contest not found');
    }

    // Get all predictions for this contest
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .eq('contest_id', contestId);

    if (predictionsError) {
      throw new Error('Failed to fetch predictions');
    }

    if (!predictions || predictions.length === 0) {
      console.log('No predictions found for contest');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Contest graded but no predictions to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let winnersCount = 0;
    let totalPayout = 0;

    // Process each prediction
    for (const prediction of predictions) {
      let isWinner = false;
      let payout = 0;

      // Simple result matching - in production, you'd have more sophisticated logic
      try {
        const predictionData = prediction.prediction_data;
        
        // Check if prediction matches result
        if (predictionData && predictionData.prediction) {
          const userPrediction = predictionData.prediction.toLowerCase();
          const actualResult = result.toLowerCase();
          
          if (userPrediction.includes(actualResult) || actualResult.includes(userPrediction)) {
            isWinner = true;
            payout = prediction.potential_payout || (prediction.bet_amount * 1.8);
            winnersCount++;
            totalPayout += payout;
          }
        }
      } catch (error) {
        console.error('Error processing prediction:', error);
        continue;
      }

      // Update prediction status
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          status: isWinner ? 'won' : 'lost',
          actual_payout: payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', prediction.id);

      if (updateError) {
        console.error('Error updating prediction:', updateError);
        continue;
      }

      // If winner, credit their account
      if (isWinner && payout > 0) {
        const { error: payoutError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: prediction.user_id,
          p_amount: payout,
          p_transaction_type: 'bet_win',
          p_description: `Winning payout for ${contest.title}`,
          p_reference_id: prediction.id
        });

        if (payoutError) {
          console.error('Error processing payout:', payoutError);
        }
      }
    }

    console.log(`Contest graded: ${winnersCount} winners, ৳${totalPayout} total payout`);

    return new Response(JSON.stringify({ 
      success: true,
      winnersCount,
      totalPayout,
      totalPredictions: predictions.length,
      message: `Contest graded successfully. ${winnersCount} winners received ৳${totalPayout} total payout.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error grading contest:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});