import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { requireAdminApi } from "@/lib/admin-guard";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().url().optional().or(z.literal("")),
  type: z.enum(["physical", "digital", "service"]).optional(),
  price_cents: z.number().int().min(0).optional(),
  inventory: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
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
  const d = parsed.data;
  const svc = getSupabaseServiceClient();

  const { data: existing, error: loadErr } = await svc
    .from("products")
    .select("id, stripe_product_id, stripe_price_id, price_cents")
    .eq("id", d.id)
    .single();
  if (loadErr || !existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.name !== undefined) update.name = d.name;
  if (d.description !== undefined) update.description = d.description || null;
  if (d.image_url !== undefined) update.image_url = d.image_url || null;
  if (d.type !== undefined) update.type = d.type;
  if (d.inventory !== undefined) update.inventory = d.inventory;
  if (d.active !== undefined) update.active = d.active;
  if (d.sort_order !== undefined) update.sort_order = d.sort_order;

  // Stripe Prices are immutable: on a price change, mint a new Price and
  // archive the old one, then point the row at the new Price.
  if (
    d.price_cents !== undefined &&
    d.price_cents !== existing.price_cents &&
    process.env.STRIPE_SECRET_KEY &&
    existing.stripe_product_id
  ) {
    const stripe = requireStripe();
    const newPrice = await stripe.prices.create({
      product: existing.stripe_product_id,
      unit_amount: d.price_cents,
      currency: "usd",
    });
    if (existing.stripe_price_id) {
      try {
        await stripe.prices.update(existing.stripe_price_id, { active: false });
      } catch {
        /* archiving the old price is best-effort */
      }
    }
    update.stripe_price_id = newPrice.id;
    update.price_cents = d.price_cents;
  } else if (d.price_cents !== undefined) {
    update.price_cents = d.price_cents;
  }

  if (d.name !== undefined && process.env.STRIPE_SECRET_KEY && existing.stripe_product_id) {
    try {
      const stripe = requireStripe();
      await stripe.products.update(existing.stripe_product_id, { name: d.name });
    } catch {
      /* best-effort */
    }
  }

  const { error: updErr } = await svc
    .from("products")
    .update(update)
    .eq("id", d.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
