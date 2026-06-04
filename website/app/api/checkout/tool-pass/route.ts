import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const schema = z.object({
  tool_slug: z.enum(["records-request", "timeline-builder", "next-three-moves"]),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  const priceId = process.env.STRIPE_TOOL_PASS_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "The tool pass is not turned on yet. Ryan is waiting for usage and heatmap data first." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tool." },
      { status: 400 },
    );
  }

  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE.url}/tools?tool_pass=success`,
    cancel_url: `${SITE.url}/tools?tool_pass=cancel`,
    allow_promotion_codes: true,
    metadata: {
      kind: "tool_pass",
      tool_slug: parsed.data.tool_slug,
    },
  });

  return NextResponse.json({ url: session.url });
}
