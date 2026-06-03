import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if default admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_profiles")
      .select("username")
      .eq("username", "wilbert01740")
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: "Default admin already exists" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create default admin user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@wilbloan.local",
      password: "Animalka123",
      email_confirm: true,
    });

    if (createError || !userData.user) {
      return new Response(
        JSON.stringify({ error: createError?.message ?? "Failed to create default admin" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into admin_profiles with admin role
    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        id: userData.user.id,
        username: "wilbert01740",
        role: "admin",
        is_active: true,
      });

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Default admin account created",
        username: "wilbert01740",
        password: "Animalka123",
        email: userData.user.email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
