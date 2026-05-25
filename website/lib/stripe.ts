import Stripe from "stripe";

// Server-only Stripe client. Never import this from a client component.
// API version is left at the account default so we don't pin to a literal the
// installed SDK might not type; lock it explicitly in the dashboard if desired.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

export function requireStripe(): Stripe {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");
  return stripe;
}

// Donation tiers are a server-side allowlist; custom amounts are clamped
// server-side. Never trust a client-sent amount beyond these checks.
export const DONATION_TIERS_CENTS = [1000, 2500, 5000, 10000, 25000] as const;
export const DONATION_MIN_CENTS = 500; // $5
export const DONATION_MAX_CENTS = 1_000_000; // $10,000

export function isValidDonationAmount(cents: number): boolean {
  if (!Number.isInteger(cents)) return false;
  if ((DONATION_TIERS_CENTS as readonly number[]).includes(cents)) return true;
  return cents >= DONATION_MIN_CENTS && cents <= DONATION_MAX_CENTS;
}
