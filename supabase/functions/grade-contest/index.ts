import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contestId, result } = await req.json()

    if (!contestId || !result) {
      throw new Error('Contest ID and result are required')
    }

    console.log(`Grading contest ${contestId} with result: ${result}`)

    // Update contest with result and completed status
    const { error: updateError } = await supabase
      .from('contests')
      .update({ 
        result: result,
        status: 'completed'
      })
      .eq('id', contestId)

    if (updateError) {
      throw updateError
    }

    // Get all predictions for this contest
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .eq('contest_id', contestId)

    if (predictionsError) {
      throw predictionsError
    }

    console.log(`Found ${predictions?.length || 0} predictions to grade`)

    // Process each prediction
    for (const prediction of predictions || []) {
      try {
        // Simple grading logic - you can make this more sophisticated
        const isWinner = prediction.prediction_data?.prediction === result
        const payout = isWinner ? prediction.potential_payout : 0

        // Update prediction with result
        const { error: predictionUpdateError } = await supabase
          .from('predictions')
          .update({
            status: 'graded',
            actual_payout: payout
          })
          .eq('id', prediction.id)

        if (predictionUpdateError) {
          console.error(`Error updating prediction ${prediction.id}:`, predictionUpdateError)
          continue
        }

        // If winner, credit their wallet
        if (isWinner && payout > 0) {
          const { error: balanceError } = await supabase
            .rpc('update_wallet_balance', {
              p_user_id: prediction.user_id,
              p_amount: payout,
              p_transaction_type: 'bet_win',
              p_description: `Contest win: ${result}`,
              p_reference_id: prediction.id
            })

          if (balanceError) {
            console.error(`Error updating balance for user ${prediction.user_id}:`, balanceError)
          } else {
            console.log(`Credited ${payout} to user ${prediction.user_id}`)
          }
        }
      } catch (error) {
        console.error(`Error processing prediction ${prediction.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contest graded successfully',
        predictionsProcessed: predictions?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error grading contest:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})