import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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
        const customerEmail = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log("Checkout completed for:", customerEmail);

        if (customerEmail) {
          // Find user by email
          const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
          
          if (userError) {
            console.error("Error fetching users:", userError);
            throw userError;
          }

          const user = userData.users.find(u => u.email === customerEmail);
          
          if (user) {
            console.log("Found user:", user.id);
            
            // Upsert subscription record
            const { error: subError } = await supabase
              .from("subscriptions")
              .upsert({
                user_id: user.id,
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

            console.log("Subscription activated for user:", user.id);
          } else {
            console.log("No user found with email:", customerEmail);
          }
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
