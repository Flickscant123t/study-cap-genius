import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(500, { error: "Server configuration error" });
    }

    // Authenticate the calling user via their JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Missing authorization header" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the user's JWT and get their ID
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseAuth = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return jsonResponse(401, { error: "Invalid or expired token" });
    }

    // Check admin role server-side
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return jsonResponse(403, { error: "Forbidden: admin role required" });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("enterprise_coach_questions")
        .select("id, user_id, user_email, question, answer, answered_at, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse(400, { error: error.message });
      }

      return jsonResponse(200, { questions: data ?? [] });
    }

    if (action === "answer") {
      const questionId = body?.questionId;
      const answer = body?.answer;

      if (typeof questionId !== "string" || typeof answer !== "string" || !answer.trim()) {
        return jsonResponse(400, { error: "questionId and answer are required" });
      }

      const { error } = await supabaseAdmin
        .from("enterprise_coach_questions")
        .update({
          answer: answer.trim(),
          answered_at: new Date().toISOString(),
        })
        .eq("id", questionId);

      if (error) {
        return jsonResponse(400, { error: error.message });
      }

      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(400, { error: "Unsupported action" });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
