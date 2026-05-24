import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 503 },
    );
  }
  const priceId = process.env.STRIPE_SUPPORTER_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Supporter membership isn't configured yet." },
      { status: 503 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: auth.user?.email ?? undefined,
    // Lets the webhook link the subscription back to the signed-in profile.
    client_reference_id: auth.user?.id ?? undefined,
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/checkout/cancel`,
    metadata: { kind: "supporter" },
  });
  return NextResponse.json({ url: session.url });
}
