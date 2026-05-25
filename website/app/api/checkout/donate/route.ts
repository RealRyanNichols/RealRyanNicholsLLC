import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe, isValidDonationAmount } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const schema = z.object({
  amount_cents: z.number().int().positive(),
  campaign: z.string().max(80).optional(),
  source: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
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
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { amount_cents, campaign, source } = parsed.data;
  // Server-side allowlist + clamp. Never trust the client amount.
  if (!isValidDonationAmount(amount_cents)) {
    return NextResponse.json(
      { error: "Pick an amount between $5 and $10,000." },
      { status: 400 },
    );
  }

  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Donation to Ryan Nichols" },
          unit_amount: amount_cents,
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/checkout/cancel`,
    metadata: { kind: "donation", campaign: campaign ?? "", source: source ?? "" },
  });
  return NextResponse.json({ url: session.url });
}
