import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🤖 Auto-grading cron job triggered");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if auto-grading is enabled
    const { data: config, error: configError } = await supabase
      .from('auto_grading_config')
      .select('*')
      .single();

    if (configError) {
      console.error("Error fetching auto-grading config:", configError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch config" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config?.enabled) {
      console.log("Auto-grading is disabled, skipping");
      return new Response(
        JSON.stringify({ message: "Auto-grading disabled", skipped: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the auto-grade-events function
    const { data: gradingResult, error: gradingError } = await supabase.functions
      .invoke('auto-grade-events');

    if (gradingError) {
      console.error("Error calling auto-grade-events:", gradingError);
      
      // Log the error
      await supabase
        .from('auto_grading_logs')
        .insert({
          event_id: `cron_error_${Date.now()}`,
          sport_type: 'system',
          final_result: 0,
          positions_graded: 0,
          total_payout: 0,
          grading_method: 'auto',
          status: 'failed',
          error_message: `Cron job failed: ${gradingError.message}`
        });

      return new Response(
        JSON.stringify({ error: "Auto-grading failed", details: gradingError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Auto-grading cron job completed successfully");
    console.log("Result:", gradingResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Auto-grading completed",
        result: gradingResult 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-grading cron job error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});