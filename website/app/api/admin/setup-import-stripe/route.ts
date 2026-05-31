// One-shot reconciliation: same logic as /api/admin/funding/import-stripe,
// but gated by STRIPE_IMPORT_SETUP_TOKEN instead of admin session. Remove
// after first run.

import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { recordDonationFromSession } from "@/lib/donations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const setupToken = process.env.STRIPE_IMPORT_SETUP_TOKEN;
  const provided = request.headers.get("x-setup-token");
  if (!setupToken || !provided || provided !== setupToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe isn't configured." }, { status: 503 });
  }
  const stripe = requireStripe();
  const svc = getSupabaseServiceClient();

  const now = new Date();
  const monthStart = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000,
  );

  let recorded = 0;
  let recordedCents = 0;
  let untrackedPaid = 0;
  let untrackedPaidCents = 0;
  const untrackedSessions: Array<{
    id: string;
    amount_total: number | null;
    customer_email: string | null;
    created: number;
  }> = [];
  let startingAfter: string | undefined;

  try {
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
          untrackedPaid++;
          untrackedPaidCents += session.amount_total ?? 0;
          untrackedSessions.push({
            id: session.id,
            amount_total: session.amount_total,
            customer_email: session.customer_details?.email ?? null,
            created: session.created,
          });
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
    untracked_sessions: untrackedSessions,
  });
}
