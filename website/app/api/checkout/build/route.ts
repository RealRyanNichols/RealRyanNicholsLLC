import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

// Secure card checkout for the website-build offer — replaces the old
// Venmo/Cash App buttons with a real, professional Stripe Checkout. Collects
// the buyer's email so Ryan can follow up to scope the build.
const BUILD_PRICE_CENTS = 25000; // $250 founder rate

const schema = z.object({
  source: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Card payments aren't configured yet — use the contact form." },
      { status: 503 },
    );
  }
  let source: string | undefined;
  try {
    const parsed = schema.safeParse(await request.json());
    if (parsed.success) source = parsed.data.source;
  } catch {
    /* body optional */
  }

  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Website build — founder rate",
            description:
              "A custom, owned website built on the same stack as RealRyanNichols.com. Scoped with you after checkout.",
          },
          unit_amount: BUILD_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    billing_address_collection: "auto",
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/build`,
    metadata: { kind: "build", source: source ?? "build-page" },
  });
  return NextResponse.json({ url: session.url });
}
