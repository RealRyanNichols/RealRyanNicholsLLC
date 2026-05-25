import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { requireAdminApi } from "@/lib/admin-guard";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, dashes."),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  type: z.enum(["physical", "digital", "service"]),
  price_cents: z.number().int().min(0),
  inventory: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe isn't configured." }, { status: 503 });
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

  const stripe = requireStripe();
  const product = await stripe.products.create({
    name: d.name,
    description: d.description || undefined,
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: d.price_cents,
    currency: "usd",
  });

  const svc = getSupabaseServiceClient();
  const { data: row, error } = await svc
    .from("products")
    .insert({
      slug: d.slug,
      name: d.name,
      description: d.description || null,
      image_url: d.image_url || null,
      type: d.type,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      price_cents: d.price_cents,
      inventory: d.inventory ?? null,
      active: d.active ?? false,
      sort_order: d.sort_order ?? 100,
    })
    .select("id")
    .single();
  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save product." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: row.id });
}
