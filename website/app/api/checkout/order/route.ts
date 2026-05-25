import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const schema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(120),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
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

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  // Resolve every slug from the DB (RLS only exposes active products), and
  // build line items from our own price IDs — never from client-sent prices.
  const slugs = parsed.data.items.map((i) => i.slug);
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, name, stripe_price_id, price_cents, active, type, inventory")
    .in("slug", slugs);
  if (error) {
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }

  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const line_items: { price: string; quantity: number }[] = [];
  let anyPhysical = false;
  for (const item of parsed.data.items) {
    const p = bySlug.get(item.slug);
    if (!p || !p.active) {
      return NextResponse.json({ error: `Unavailable: ${item.slug}` }, { status: 400 });
    }
    if (!p.stripe_price_id) {
      return NextResponse.json(
        { error: `Not purchasable yet: ${item.slug}` },
        { status: 409 },
      );
    }
    if (p.inventory != null && p.inventory < item.qty) {
      return NextResponse.json({ error: `Out of stock: ${item.slug}` }, { status: 409 });
    }
    if (p.type === "physical") anyPhysical = true;
    line_items.push({ price: p.stripe_price_id, quantity: item.qty });
  }

  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    customer_email: auth.user?.email ?? undefined,
    client_reference_id: auth.user?.id ?? undefined,
    shipping_address_collection: anyPhysical
      ? { allowed_countries: ["US"] }
      : undefined,
    success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/checkout/cancel`,
    metadata: { kind: "order", slugs: slugs.join(",") },
  });
  return NextResponse.json({ url: session.url });
}
