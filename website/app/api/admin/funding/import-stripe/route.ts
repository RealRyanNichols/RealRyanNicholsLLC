import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { recordDonationFromSession } from "@/lib/donations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-click reconciliation: pull this month's completed donation Checkout
// Sessions straight from Stripe into the donations table, so the public meter
// reflects real card gifts even when the webhook hasn't been delivering. Safe
// to run repeatedly — recordDonationFromSession upserts on the unique Stripe
// session id, so it never double-counts (and lines up with the live webhook).
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe isn't configured." }, { status: 503 });
  }
  const stripe = requireStripe();
  const svc = getSupabaseServiceClient();

  // Start of the current month in UTC — matches funding_snapshot()'s
  // date_trunc('month', now()) so the import lines up with the meter window.
  const now = new Date();
  const monthStart = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000,
  );

  let recorded = 0;
  let recordedCents = 0;
  let untrackedPaid = 0;
  let untrackedPaidCents = 0;
  let startingAfter: string | undefined;

  try {
    // Paginate this month's Checkout Sessions (cap pages as a safety valve).
    for (let page = 0; page < 20; page++) {
      const batch = await stripe.checkout.sessions.list({
        created: { gte: monthStart },
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const session of batch.data) {
        if (session.mode !== "payment" || session.payment_status !== "paid") continue;
        if (session.metadata?.kind === "donation") {
          await recordDonationFromSession(session, svc);
          recorded++;
          recordedCents += session.amount_total ?? 0;
        } else if (session.metadata?.kind !== "order") {
          // A paid one-time charge with no donation/order tag — most likely a
          // Stripe Payment Link gift. Surface it instead of silently missing it.
          untrackedPaid++;
          untrackedPaidCents += session.amount_total ?? 0;
        }
      }
      if (!batch.has_more) break;
      startingAfter = batch.data[batch.data.length - 1]?.id;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Stripe import failed: ${(e as Error)?.message ?? "unknown error"}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    recorded,
    recorded_cents: recordedCents,
    untracked_paid: untrackedPaid,
    untracked_paid_cents: untrackedPaidCents,
  });
}
