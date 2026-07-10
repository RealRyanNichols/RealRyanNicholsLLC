import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Rally-points feed for the Situation Room board. Deliberately returns ONLY
// the derived points figure ($1 = 1 point — the same number the public board
// already displays), never the raw revenue breakdown. The old shape exposed
// exact gross cents, distinct-buyer count, and charge count to anyone who
// curled the endpoint — a financial-privacy leak with no consumer for the
// extra fields. Raw aggregates stay in Stripe and the admin dashboards.
type RaisedData = {
  points: number;
  configured: boolean;
};

let cache: { at: number; data: RaisedData } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ points: 0, configured: false });
  }
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }
  try {
    const stripe = requireStripe();
    let raised = 0;
    let startingAfter: string | undefined;
    // Paginate succeeded charges (cap at 20 pages = 2,000 charges).
    for (let i = 0; i < 20; i += 1) {
      const params: Stripe.ChargeListParams = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const page = await stripe.charges.list(params);
      for (const ch of page.data) {
        if (ch.status === "succeeded" && ch.paid) {
          raised += (ch.amount ?? 0) - (ch.amount_refunded ?? 0);
        }
      }
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
    const data: RaisedData = {
      points: Math.max(0, Math.floor(raised / 100)),
      configured: true,
    };
    cache = { at: Date.now(), data };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    // Never break the board — fall back to "unknown" and let it use the DB value.
    return NextResponse.json({ points: 0, configured: false });
  }
}
