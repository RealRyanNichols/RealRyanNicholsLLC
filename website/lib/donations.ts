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
  // Subscription sessions are recorded from their invoices instead (below),
  // so the first month is never counted twice.
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

// A paid invoice on a recurring donation (the Token Fund "Keeper" lane).
// Every invoice, the first one included, lands here once via invoice.paid;
// the invoice id fills the unique stripe_session_id slot so a re-delivered
// event is a no-op. Invoices that are not fuel donations are ignored.
export async function recordFuelInvoice(
  invoice: Stripe.Invoice,
  client?: SupabaseClient,
): Promise<void> {
  const metadata = invoice.parent?.subscription_details?.metadata ?? null;
  if (metadata?.kind !== "donation") return;
  if (!metadata.campaign) return;
  if (invoice.status !== "paid") return;
  if (!(invoice.amount_paid > 0)) return;

  // The SDK moved the payment intent off the invoice and onto its payments
  // list; read either shape without depending on the API version.
  const loose = invoice as unknown as {
    payment_intent?: unknown;
    payments?: { data?: Array<{ payment?: { payment_intent?: unknown } }> };
  };
  const candidate = loose.payments?.data?.[0]?.payment?.payment_intent ?? loose.payment_intent;
  const paymentIntent =
    typeof candidate === "string"
      ? candidate
      : candidate && typeof candidate === "object" && "id" in candidate
        ? String((candidate as { id: unknown }).id)
        : null;

  const supabase = client ?? getSupabaseServiceClient();
  await supabase.from("donations").upsert(
    {
      stripe_session_id: invoice.id,
      stripe_payment_intent: paymentIntent,
      email: invoice.customer_email ?? null,
      name: invoice.customer_name ?? null,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      recurring: true,
      campaign: metadata.campaign,
      source: metadata.source || null,
    },
    { onConflict: "stripe_session_id" },
  );
}
