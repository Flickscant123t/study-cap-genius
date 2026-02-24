import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StripeSubscription = {
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
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

const fetchStripeSubscription = async (
  subscriptionId: string,
  stripeSecretKey: string,
) => {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(readStripeErrorMessage(payload, "Unable to fetch subscription"));
  }

  return payload as StripeSubscription;
};

const cancelStripeAutoRenewal = async (
  subscriptionId: string,
  stripeSecretKey: string,
) => {
  const body = new URLSearchParams({ cancel_at_period_end: "true" });
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(readStripeErrorMessage(payload, "Unable to cancel auto-renewal"));
  }

  return payload as StripeSubscription;
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      return jsonResponse(500, { error: "Server configuration error" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let action: "status" | "cancel" = "cancel";
    try {
      const body = await req.json();
      if (body?.action === "status" || body?.action === "cancel") {
        action = body.action;
      }
    } catch {
      // Keep default action when body is missing/invalid.
    }

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

    const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subscription, error: subscriptionError } = await supabaseAdminClient
      .from("subscriptions")
      .select("stripe_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error("Failed to read subscription:", subscriptionError);
      return jsonResponse(500, { error: "Failed to load subscription" });
    }

    const stripeSubscriptionId = subscription?.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return jsonResponse(404, { error: "No active Stripe subscription found" });
    }

    const stripeSubscription = action === "cancel"
      ? await cancelStripeAutoRenewal(stripeSubscriptionId, STRIPE_SECRET_KEY)
      : await fetchStripeSubscription(stripeSubscriptionId, STRIPE_SECRET_KEY);

    const currentPeriodEnd = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : subscription.current_period_end;

    if (currentPeriodEnd && currentPeriodEnd !== subscription.current_period_end) {
      await supabaseAdminClient
        .from("subscriptions")
        .update({ current_period_end: currentPeriodEnd })
        .eq("user_id", user.id);
    }

    return jsonResponse(200, {
      success: true,
      action,
      status: stripeSubscription.status,
      cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("stripe-renewal function error:", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
