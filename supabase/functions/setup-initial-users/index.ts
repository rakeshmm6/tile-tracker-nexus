
// supabase/functions/setup-initial-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

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
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      // Supabase API URL - env var exported by default when deployed to Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE_ROLE KEY - env var exported by default when deployed to Supabase
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create admin user if it doesn't exist
    const { data: adminExists, error: adminCheckError } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = adminExists?.users.find(u => u.email === 'admin@example.com');

    if (!adminUser) {
      // Create admin user
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@example.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          username: 'admin',
          role: 'admin'
        }
      });

      if (adminError) {
        console.error('Error creating admin user:', adminError);
      } else {
        // Ensure profile exists for admin
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: adminData.user.id,
            username: 'admin',
            role: 'admin'
          });
      }
    }

    // Create guest user if it doesn't exist
    const guestUser = adminExists?.users.find(u => u.email === 'guest@example.com');

    if (!guestUser) {
      // Create guest user
      const { data: guestData, error: guestError } = await supabaseAdmin.auth.admin.createUser({
        email: 'guest@example.com',
        password: 'guest123',
        email_confirm: true,
        user_metadata: {
          username: 'guest',
          role: 'guest'
        }
      });

      if (guestError) {
        console.error('Error creating guest user:', guestError);
      } else {
        // Ensure profile exists for guest
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: guestData.user.id,
            username: 'guest',
            role: 'guest'
          });
      }
    }

    return new Response(
      JSON.stringify({ message: "Initial users setup complete" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in setup-initial-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
