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
    const { email, password, username, role = "viewer", creatorEmail } = await req.json();

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: "Email, password, and username are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUsers?.users?.some((u) => u.email === email)) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if username is taken
    const { data: existingUsernames } = await supabaseAdmin
      .from("admin_profiles")
      .select("username")
      .eq("username", username);

    if (existingUsernames && existingUsernames.length > 0) {
      return new Response(
        JSON.stringify({ error: "Username already taken" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If creatorEmail provided, verify they are admin
    let creatorId: string | null = null;
    if (creatorEmail) {
      const { data: creatorUsers } = await supabaseAdmin.auth.admin.listUsers();
      const creator = creatorUsers?.users?.find((u) => u.email === creatorEmail);
      if (creator) {
        const { data: creatorProfile } = await supabaseAdmin
          .from("admin_profiles")
          .select("role")
          .eq("id", creator.id)
          .maybeSingle();

        if (creatorProfile?.role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Only admins can create accounts" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        creatorId = creator.id;
      }
    }

    // Create the auth user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !userData.user) {
      return new Response(
        JSON.stringify({ error: createError?.message ?? "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into admin_profiles with role
    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        id: userData.user.id,
        username,
        role,
        created_by: creatorId,
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
        email: userData.user.email,
        username,
        role,
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
