import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StripeCustomer = {
  id: string;
};

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number | null;
};

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getStripeCustomerIdsByEmail = async (stripeSecretKey: string, email: string) => {
  const response = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Failed to query Stripe customers");
  }

  return (payload.data ?? []) as StripeCustomer[];
};

const getStripeSubscriptionsByCustomerId = async (
  stripeSecretKey: string,
  customerId: string,
) => {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Failed to query Stripe subscriptions");
  }

  return (payload.data ?? []) as StripeSubscription[];
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

    if (userError || !user?.email) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const customers = await getStripeCustomerIdsByEmail(STRIPE_SECRET_KEY, user.email);
    if (customers.length === 0) {
      return jsonResponse(200, { synced: false, premium: false, reason: "no_stripe_customer" });
    }

    let matchedSubscription: StripeSubscription | null = null;

    for (const customer of customers) {
      const subscriptions = await getStripeSubscriptionsByCustomerId(STRIPE_SECRET_KEY, customer.id);
      const premiumSubscription = subscriptions.find((subscription) =>
        PREMIUM_STATUSES.has(subscription.status)
      );

      if (premiumSubscription) {
        matchedSubscription = premiumSubscription;
        break;
      }
    }

    if (!matchedSubscription) {
      return jsonResponse(200, { synced: false, premium: false, reason: "no_active_subscription" });
    }

    const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const currentPeriodEnd = matchedSubscription.current_period_end
      ? new Date(matchedSubscription.current_period_end * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabaseAdminClient
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          stripe_customer_id: matchedSubscription.customer,
          stripe_subscription_id: matchedSubscription.id,
          status: matchedSubscription.status,
          plan: "premium",
          current_period_end: currentPeriodEnd,
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      console.error("Failed to upsert synced subscription:", upsertError);
      return jsonResponse(500, { error: "Failed to sync subscription" });
    }

    return jsonResponse(200, {
      synced: true,
      premium: true,
      status: matchedSubscription.status,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("stripe-sync-subscription function error:", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
