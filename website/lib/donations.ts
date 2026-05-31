import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

// Best-effort, idempotent recording of a completed donation Checkout Session
// into the donations table. Safe to call from BOTH the Stripe webhook and the
// /checkout/success page — the unique stripe_session_id makes a repeat call a
// no-op upsert. The success-page call is the backstop that keeps the public
// funding meter accurate even when the webhook secret is missing or the
// endpoint isn't registered yet in an environment, so donations are never
// silently lost between Stripe and the meter.
export async function recordDonationFromSession(
  session: Stripe.Checkout.Session,
  client?: SupabaseClient,
): Promise<void> {
  // Only paid, one-time donation sessions belong in the donations table.
  if (session.mode !== "payment") return;
  if (session.metadata?.kind !== "donation") return;
  if (session.payment_status !== "paid") return;

  const supabase = client ?? getSupabaseServiceClient();
  await supabase.from("donations").upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      email: session.customer_details?.email ?? null,
      name: session.customer_details?.name ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      recurring: false,
      campaign: session.metadata?.campaign || null,
      source: session.metadata?.source || null,
    },
    { onConflict: "stripe_session_id" },
  );
}
