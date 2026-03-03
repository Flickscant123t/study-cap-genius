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

  const normalizedPromoCode = promoCode?.trim();
  if (normalizedPromoCode) {
    url.searchParams.set("prefilled_promo_code", normalizedPromoCode);
  }

  return url.toString();
};

type StripeCheckoutRedirectOptions = Omit<StripeCheckoutUrlOptions, "promoCode">;

export const redirectToStripeCheckout = ({ email, userId }: StripeCheckoutRedirectOptions = {}) => {
  const promoCode = window.prompt("Enter promo code (optional):");
  window.location.href = getStripeCheckoutUrl({ email, userId, promoCode });
};
