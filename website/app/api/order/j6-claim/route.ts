import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { buildJ6ClaimEmails } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  slug: z.string().min(1).max(120),
  shipping: z.object({}).passthrough().optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
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
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: verified } = await supabase.rpc("is_verified_j6_defendant", {
    uid: auth.user.id,
  });
  if (verified !== true) {
    return NextResponse.json(
      { error: "This free claim is for verified January 6 defendants." },
      { status: 403 },
    );
  }

  // Resolve the product (RLS exposes active rows only).
  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name, active")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (!product || !product.active) {
    return NextResponse.json({ error: "Unavailable." }, { status: 400 });
  }

  // Service-role writes (bypass RLS) for the $0 order.
  const svc = getSupabaseServiceClient();
  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      user_id: auth.user.id,
      email: auth.user.email ?? null,
      amount_cents: 0,
      status: "j6_free",
      shipping_json: parsed.data.shipping ?? null,
      notes: `Verified J6 defendant — free claim. ${parsed.data.notes ?? ""}`.trim(),
    })
    .select("id")
    .single();
  if (orderErr || !order) {
    return NextResponse.json(
      { error: "Could not record your claim." },
      { status: 500 },
    );
  }
  await svc.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    product_slug: product.slug,
    qty: 1,
    unit_amount_cents: 0,
  });

  // Best-effort emails — the claim still succeeds if email isn't configured.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const { admin, user } = buildJ6ClaimEmails({
    productName: product.name,
    claimantEmail: auth.user.email ?? "(unknown)",
    orderId: order.id,
    shipping: parsed.data.shipping,
    notes: parsed.data.notes,
  });
  const adminAlert = await sendAdminAlert({
    subject: admin.subject,
    html: admin.html,
    text: admin.text,
  });
  if (!adminAlert.sent) {
    console.warn("j6_claim_admin_alert_failed", adminAlert);
  }
  if (apiKey && from && auth.user.email) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: auth.user.email,
        subject: user.subject,
        html: user.html,
        text: user.text,
      });
    } catch {
      /* non-blocking */
    }
  }

  return NextResponse.json({ ok: true, order_id: order.id });
}
