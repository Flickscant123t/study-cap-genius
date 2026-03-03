import { supabase } from "@/integrations/supabase/client";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/cNi4gz2EDaLuc185B2e3e03";
const STRIPE_ENTERPRISE_CHECKOUT_URL =
  import.meta.env.VITE_STRIPE_ENTERPRISE_CHECKOUT_URL || "";

interface StripeCheckoutUrlOptions {
  email?: string | null;
  userId?: string | null;
  promoCode?: string | null;
  plan?: "premium" | "enterprise";
}

export const getStripeCheckoutUrl = ({
  email,
  userId,
  promoCode,
  plan = "premium",
}: StripeCheckoutUrlOptions = {}) => {
  const checkoutBaseUrl =
    plan === "enterprise" && STRIPE_ENTERPRISE_CHECKOUT_URL
      ? STRIPE_ENTERPRISE_CHECKOUT_URL
      : STRIPE_CHECKOUT_URL;
  const url = new URL(checkoutBaseUrl);

  if (email) {
    url.searchParams.set("prefilled_email", email);
  }

  if (userId) {
    url.searchParams.set("client_reference_id", userId);
  }

  if (promoCode) {
    url.searchParams.set("prefilled_promo_code", promoCode);
  }

  return url.toString();
};

export const redirectToStripeCheckout = async ({
  email,
  userId,
  promoCode,
  plan = "premium",
}: StripeCheckoutUrlOptions = {}) => {
  const { data, error } = await supabase.functions.invoke("stripe-create-checkout", {
    body: {
      email,
      userId,
      promoCode,
      plan,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: window.location.href,
    },
  });

  if (error || !data?.url) {
    if (plan === "enterprise" && !STRIPE_ENTERPRISE_CHECKOUT_URL) {
      console.error("Enterprise checkout failed and no enterprise fallback URL is configured.");
      return;
    }

    // Fallback to static payment link if edge function is not deployed yet.
    window.location.href = getStripeCheckoutUrl({ email, userId, promoCode, plan });
    return;
  }

  window.location.href = data.url;
};
