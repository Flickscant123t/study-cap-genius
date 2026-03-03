import { supabase } from "@/integrations/supabase/client";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/cNi4gz2EDaLuc185B2e3e03";

interface StripeCheckoutUrlOptions {
  email?: string | null;
  userId?: string | null;
  promoCode?: string | null;
}

export const getStripeCheckoutUrl = ({ email, userId, promoCode }: StripeCheckoutUrlOptions = {}) => {
  const url = new URL(STRIPE_CHECKOUT_URL);

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

export const redirectToStripeCheckout = async ({ email, userId, promoCode }: StripeCheckoutUrlOptions = {}) => {
  const { data, error } = await supabase.functions.invoke("stripe-create-checkout", {
    body: {
      email,
      userId,
      promoCode,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: window.location.href,
    },
  });

  if (error || !data?.url) {
    // Fallback to static payment link if edge function is not deployed yet.
    window.location.href = getStripeCheckoutUrl({ email, userId, promoCode });
    return;
  }

  window.location.href = data.url;
};
