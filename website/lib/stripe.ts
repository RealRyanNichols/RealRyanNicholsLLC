import Stripe from "stripe";

// Server-only Stripe client. Never import this from a client component.
// API version is left at the account default so we don't pin to a literal the
// installed SDK might not type; lock it explicitly in the dashboard if desired.
let stripeClient: Stripe | null = null;

export function requireStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  stripeClient = new Stripe(key);
  return stripeClient;
}

// Donations are retired site-wide — Ryan's call: a $1 pledge that eats a $15
// chargeback fee is a losing trade, and the site sells real things instead
// (book, services, store). The donate/rally checkout routes and their tier
// allowlists are deliberately gone; do not reintroduce them.

// Checkout uses Stripe dynamic payment methods when payment_method_types is not
// hardcoded. For service invoices, request the invoice-supported financing rails
// explicitly while letting Stripe hide anything not eligible for that customer,
// country, currency, amount, or Dashboard configuration.
export const STRIPE_INVOICE_PAYMENT_METHOD_TYPES: Stripe.InvoiceCreateParams.PaymentSettings.PaymentMethodType[] =
  ["card", "link", "affirm", "klarna"];
