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

// Donation tiers are a server-side allowlist; custom amounts are clamped
// server-side. Never trust a client-sent amount beyond these checks.
// $50 floor: anything less is eaten by processing fees — not worth the donor's
// time or Ryan's. The unified "Fund the Truth" tool enforces the same minimum.
export const DONATION_TIERS_CENTS = [5000, 10000, 25000, 50000] as const;
export const DONATION_MIN_CENTS = 5000; // $50
export const DONATION_MAX_CENTS = 1_000_000; // $10,000

export function isValidDonationAmount(cents: number): boolean {
  if (!Number.isInteger(cents)) return false;
  if ((DONATION_TIERS_CENTS as readonly number[]).includes(cents)) return true;
  return cents >= DONATION_MIN_CENTS && cents <= DONATION_MAX_CENTS;
}

// Micro-pledge ("rally") tiers — deliberately BELOW the donation floor. These
// are the one-tap $1/$3/$5 amounts that drive participation and momentum, not
// net-of-fee revenue. Kept as a separate allowlist so the $50 donation floor
// (and the "Fund the Truth" tool that shares it) stays unchanged.
export const RALLY_TIERS_CENTS = [100, 300, 500, 1000] as const;
export const RALLY_MIN_CENTS = 100; // $1
export const RALLY_MAX_CENTS = 5000; // $50 — above this, hand off to the donation flow.

export function isValidRallyAmount(cents: number): boolean {
  if (!Number.isInteger(cents)) return false;
  return cents >= RALLY_MIN_CENTS && cents <= RALLY_MAX_CENTS;
}

// Checkout uses Stripe dynamic payment methods when payment_method_types is not
// hardcoded. For service invoices, request the invoice-supported financing rails
// explicitly while letting Stripe hide anything not eligible for that customer,
// country, currency, amount, or Dashboard configuration.
export const STRIPE_INVOICE_PAYMENT_METHOD_TYPES: Stripe.InvoiceCreateParams.PaymentSettings.PaymentMethodType[] =
  ["card", "link", "affirm", "klarna"];
