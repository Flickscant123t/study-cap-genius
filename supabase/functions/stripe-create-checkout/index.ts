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

const readStripeErrorMessage = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallback;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
      return jsonResponse(500, { error: "Server configuration error" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const body = await req.json().catch(() => ({}));
    const successUrl =
      typeof body?.successUrl === "string" && body.successUrl.startsWith("http")
        ? body.successUrl
        : `${new URL(req.url).origin}/success`;
    const cancelUrl =
      typeof body?.cancelUrl === "string" && body.cancelUrl.startsWith("http")
        ? body.cancelUrl
        : `${new URL(req.url).origin}/`;

    const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("success_url", successUrl);
    form.set("cancel_url", cancelUrl);
    form.set("line_items[0][price]", STRIPE_PRICE_ID);
    form.set("line_items[0][quantity]", "1");
    form.set("allow_promotion_codes", "true");
    form.set("client_reference_id", user.id);
    form.set("customer_email", user.email ?? "");
    form.set("metadata[user_id]", user.id);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok || typeof stripePayload?.url !== "string") {
      const message = readStripeErrorMessage(stripePayload, "Unable to create checkout session");
      return jsonResponse(400, { error: message });
    }

    return jsonResponse(200, { url: stripePayload.url });
  } catch (error) {
    console.error("stripe-create-checkout function error:", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
