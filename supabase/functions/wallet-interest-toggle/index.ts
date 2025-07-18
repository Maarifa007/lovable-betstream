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

    const { userId, enabled } = await req.json();
    console.log('Toggling interest for user:', userId, 'enabled:', enabled);

    if (!userId || typeof enabled !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'User ID and enabled status are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has an interest settings record
    const { data: existingSettings } = await supabaseClient
      .from('interest_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingSettings) {
      // Update existing record
      const { error: updateError } = await supabaseClient
        .from('interest_settings')
        .update({ 
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Interest update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update interest settings' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseClient
        .from('interest_settings')
        .insert({
          user_id: userId,
          enabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Interest insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create interest settings' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Log the interest toggle action
    await supabaseClient
      .from('admin_logs')
      .insert({
        admin_id: userId, // For now, user can toggle their own interest
        action: 'interest_toggle',
        details: { enabled, timestamp: new Date().toISOString() },
        target_user_id: userId
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Interest earning ${enabled ? 'enabled' : 'disabled'} for user ${userId}` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Interest toggle error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});