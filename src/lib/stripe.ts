const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/cNi4gz2EDaLuc185B2e3e03";

interface StripeCheckoutUrlOptions {
  email?: string | null;
  userId?: string | null;
}

export const getStripeCheckoutUrl = ({ email, userId }: StripeCheckoutUrlOptions = {}) => {
  const url = new URL(STRIPE_CHECKOUT_URL);

  if (email) {
    url.searchParams.set("prefilled_email", email);
  }

  if (userId) {
    url.searchParams.set("client_reference_id", userId);
  }

  return url.toString();
};
