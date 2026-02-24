import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() ?? "";

const findUserByEmail = async (supabase: any, email: string) => {
  const normalizedTargetEmail = normalizeEmail(email);
  if (!normalizedTargetEmail) {
    return null;
  }

  const perPage = 200;
  let page = 1;

  while (true) {
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (userError) {
      throw userError;
    }

    const matchedUser = userData.users.find((candidate: any) =>
      normalizeEmail(candidate.email) === normalizedTargetEmail
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (userData.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
};

const resolveCheckoutUserId = async (supabase: any, session: any) => {
  const clientReferenceId =
    typeof session.client_reference_id === "string" ? session.client_reference_id.trim() : "";

  if (clientReferenceId && UUID_REGEX.test(clientReferenceId)) {
    const { data: userByIdData, error: userByIdError } = await supabase.auth.admin.getUserById(
      clientReferenceId,
    );

    if (!userByIdError && userByIdData?.user) {
      return userByIdData.user.id;
    }

    if (userByIdError) {
      console.warn("Unable to resolve client_reference_id:", userByIdError.message);
    }
  }

  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    return null;
  }

  const userByEmail = await findUserByEmail(supabase, customerEmail);
  return userByEmail?.id ?? null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Stripe webhook received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log("Checkout completed for:", customerEmail);

        const userId = await resolveCheckoutUserId(supabase, session);

        if (userId) {
          console.log("Found user:", userId);

          // Upsert subscription record
          const { error: subError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              plan: "premium",
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }, {
              onConflict: "user_id"
            });

          if (subError) {
            console.error("Error upserting subscription:", subError);
            throw subError;
          }

          console.log("Subscription activated for user:", userId);
        } else {
          console.log("No matching user found for checkout session", {
            customerEmail,
            clientReferenceId: session.client_reference_id,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        console.log("Subscription update:", customerId, status);

        // Update subscription status
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: status === "active" ? "active" : "inactive",
            plan: status === "active" ? "premium" : "free",
            current_period_end: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log("Payment succeeded for customer:", customerId);

        // Extend subscription
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan: "premium",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error extending subscription:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log("Payment failed for customer:", customerId);

        // Mark subscription as inactive
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating subscription status:", error);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
