import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OddsAPIResult {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Array<{
    name: string;
    score: string;
  }> | null;
  last_update: string;
}

interface BetPosition {
  id: string;
  user_id: string;
  match_id: string;
  market: string;
  bet_type: string;
  bet_price: number;
  stake_amount: number;
  potential_payout: number;
  status: string;
}

interface GradingResult {
  position_id: string;
  user_id: string;
  original_stake: number;
  profit_loss: number;
  final_payout: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🤖 Auto-grading service started");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const oddsApiKey = Deno.env.get('ODDS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if auto-grading is enabled
    const { data: config } = await supabase
      .from('auto_grading_config')
      .select('*')
      .single();

    if (!config?.enabled) {
      console.log("Auto-grading is disabled");
      return new Response(
        JSON.stringify({ message: "Auto-grading is disabled" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!oddsApiKey) {
      console.error("ODDS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "ODDS_API_KEY not configured" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gradedEvents: string[] = [];
    const supportedSports = config.supported_sports || ['football', 'soccer', 'basketball'];

    // Process each supported sport
    for (const sport of supportedSports) {
      console.log(`🔍 Checking results for ${sport}`);
      
      try {
        // Fetch recent results from Odds API
        const resultsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${oddsApiKey}&daysFrom=1`;
        const resultsResponse = await fetch(resultsUrl);
        
        if (!resultsResponse.ok) {
          console.error(`Failed to fetch results for ${sport}: ${resultsResponse.status}`);
          continue;
        }

        const results: OddsAPIResult[] = await resultsResponse.json();
        const completedEvents = results.filter(event => event.completed && event.scores);

        console.log(`Found ${completedEvents.length} completed events for ${sport}`);

        // Process each completed event
        for (const event of completedEvents) {
          const eventId = event.id;
          
          // Check if we already graded this event
          const { data: existingLog } = await supabase
            .from('auto_grading_logs')
            .select('id')
            .eq('event_id', eventId)
            .eq('status', 'success')
            .single();

          if (existingLog) {
            console.log(`Event ${eventId} already graded, skipping`);
            continue;
          }

          // Get open positions for this event
          const { data: openPositions, error: positionsError } = await supabase
            .from('bet_positions')
            .select('*')
            .eq('match_id', eventId)
            .eq('status', 'open');

          if (positionsError) {
            console.error(`Error fetching positions for event ${eventId}:`, positionsError);
            continue;
          }

          if (!openPositions || openPositions.length === 0) {
            console.log(`No open positions found for event ${eventId}`);
            continue;
          }

          console.log(`🎯 Grading ${openPositions.length} positions for event ${eventId}`);

          // Determine winner and calculate results
          const homeScore = event.scores?.find(s => s.name === event.home_team)?.score;
          const awayScore = event.scores?.find(s => s.name === event.away_team)?.score;
          
          if (!homeScore || !awayScore) {
            console.log(`Missing scores for event ${eventId}`);
            continue;
          }

          const homeScoreNum = parseInt(homeScore);
          const awayScoreNum = parseInt(awayScore);
          let winner = 'draw';
          
          if (homeScoreNum > awayScoreNum) {
            winner = 'home';
          } else if (awayScoreNum > homeScoreNum) {
            winner = 'away';
          }

          // Grade each position
          const gradingResults: GradingResult[] = [];
          let totalPayout = 0;

          for (const position of openPositions) {
            let profitLoss = 0;
            let finalPayout = 0;

            // Simple win/loss/draw grading logic
            if (position.bet_type === 'win') {
              if ((position.market === 'home' && winner === 'home') ||
                  (position.market === 'away' && winner === 'away') ||
                  (position.market === 'draw' && winner === 'draw')) {
                // Win: return stake + profit
                profitLoss = position.potential_payout - position.stake_amount;
                finalPayout = position.potential_payout;
              } else {
                // Loss: lose stake
                profitLoss = -position.stake_amount;
                finalPayout = 0;
              }
            }

            gradingResults.push({
              position_id: position.id,
              user_id: position.user_id,
              original_stake: position.stake_amount,
              profit_loss: profitLoss,
              final_payout: finalPayout
            });

            totalPayout += finalPayout;

            // Update position in database
            await supabase
              .from('bet_positions')
              .update({
                status: 'settled',
                final_result: homeScoreNum - awayScoreNum, // Point spread
                profit_loss: profitLoss,
                settled_at: new Date().toISOString()
              })
              .eq('id', position.id);

            // Update user wallet
            if (finalPayout > 0) {
              await supabase.rpc('update_wallet_balance', {
                p_user_id: position.user_id,
                p_amount: finalPayout,
                p_transaction_type: 'bet_win',
                p_description: `Bet win payout for event ${eventId}`,
                p_reference_id: position.id
              });
            }
          }

          // Log the grading activity
          await supabase
            .from('auto_grading_logs')
            .insert({
              event_id: eventId,
              sport_type: sport,
              final_result: homeScoreNum - awayScoreNum,
              positions_graded: openPositions.length,
              total_payout: totalPayout,
              grading_method: 'auto',
              status: 'success'
            });

          gradedEvents.push(eventId);
          console.log(`✅ Successfully graded event ${eventId} with ${openPositions.length} positions`);
        }
      } catch (error) {
        console.error(`Error processing sport ${sport}:`, error);
        
        // Log the error
        await supabase
          .from('auto_grading_logs')
          .insert({
            event_id: `error_${sport}_${Date.now()}`,
            sport_type: sport,
            final_result: 0,
            positions_graded: 0,
            total_payout: 0,
            grading_method: 'auto',
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error)
          });
      }
    }

    console.log(`🎉 Auto-grading completed. Graded ${gradedEvents.length} events total`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        graded_events: gradedEvents.length,
        events: gradedEvents 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-grading service error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});