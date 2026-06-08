import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// The accurate "raised" number — straight from Stripe (the source of truth),
// not the DB tables (which only capture some payment types). Sums all
// succeeded charges minus refunds, counts distinct supporters, and caches the
// result in-module for 10 minutes so we never hammer the API on a busy board.
type RaisedData = {
  raised_cents: number;
  supporters: number;
  charges: number;
  configured: boolean;
};

let cache: { at: number; data: RaisedData } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ raised_cents: 0, supporters: 0, charges: 0, configured: false });
  }
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }
  try {
    const stripe = requireStripe();
    let raised = 0;
    let charges = 0;
    const supporters = new Set<string>();
    let startingAfter: string | undefined;
    // Paginate succeeded charges (cap at 20 pages = 2,000 charges).
    for (let i = 0; i < 20; i += 1) {
      const params: Stripe.ChargeListParams = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const page = await stripe.charges.list(params);
      for (const ch of page.data) {
        if (ch.status === "succeeded" && ch.paid) {
          raised += (ch.amount ?? 0) - (ch.amount_refunded ?? 0);
          charges += 1;
          const cust = typeof ch.customer === "string" ? ch.customer : ch.customer?.id;
          supporters.add(cust || ch.id);
        }
      }
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
    const data: RaisedData = {
      raised_cents: raised,
      supporters: supporters.size,
      charges,
      configured: true,
    };
    cache = { at: Date.now(), data };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    // Never break the board — fall back to "unknown" and let it use the DB value.
    return NextResponse.json({ raised_cents: 0, supporters: 0, charges: 0, configured: false });
  }
}
