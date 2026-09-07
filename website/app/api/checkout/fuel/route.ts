import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import {
  FUEL_CAMPAIGN,
  FUEL_MAX_CENTS,
  FUEL_MONTHLY,
  FUEL_PURPOSE,
  formatFuelMessage,
  resolveFuelAmount,
  usdWhole,
} from "@/lib/fuel";
import { getFuelBill } from "@/lib/fuel-server";

export const runtime = "nodejs";

// Token Fund checkout. The amount is resolved server-side from the tier list
// (or a custom amount above the floor); the client never sets a price. A
// support_intents row captures who they are and what they asked for before
// the redirect, so an abandoned checkout still leaves a lead, and a paid one
// becomes an item of work Ryan owes. "monthly" opens a Stripe subscription
// for the Keeper amount; its invoices are recorded by the webhook.
const schema = z.object({
  tier: z.string().max(40).optional().nullable(),
  amount_cents: z.number().int().min(0).max(FUEL_MAX_CENTS).optional().nullable(),
  cadence: z.enum(["once", "monthly"]).default("once"),
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  ask: z.string().max(1800).optional().or(z.literal("")),
  display_as: z.enum(["name", "anonymous"]).default("anonymous"),
  publish_message: z.boolean().default(false),
});

function hashIp(ip: string): string {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "support-intent";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
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

  const rl = await checkRateLimit({
    request,
    bucket: "fuel_checkout",
    windowMinutes: 60,
    maxRequests: 10,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const monthly = parsed.data.cadence === "monthly";
  const { tiers } = await getFuelBill();
  const resolved = monthly
    ? { ok: true as const, amountCents: FUEL_MONTHLY.amountCents, tier: FUEL_MONTHLY }
    : resolveFuelAmount(tiers, {
        tier: parsed.data.tier ?? null,
        amountCents: parsed.data.amount_cents ?? null,
      });
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const ask = parsed.data.ask?.trim() || "";
  if (resolved.tier?.askRequired && !ask) {
    return NextResponse.json(
      { error: `${resolved.tier.title} needs the topic before checkout.` },
      { status: 400 },
    );
  }

  const tierTitle = monthly
    ? `${FUEL_MONTHLY.title} (monthly)`
    : (resolved.tier?.title ?? `Custom ${usdWhole(resolved.amountCents)}`);
  const displayName = parsed.data.display_name?.trim() || null;
  const email = parsed.data.email?.trim() || null;

  // Lead capture first. If this insert fails the checkout still proceeds;
  // the donation row from Stripe is the money record either way.
  const intentId = randomUUID();
  let intentSaved = false;
  try {
    const supabase = getSupabaseStaticClient();
    const { error } = await supabase.from("support_intents").insert({
      id: intentId,
      purpose: FUEL_PURPOSE,
      intended_amount: String(Math.round(resolved.amountCents / 100)),
      display_name: displayName,
      email,
      message: formatFuelMessage(tierTitle, ask),
      publish_message: parsed.data.publish_message,
      display_as: parsed.data.display_as,
      show_amount: true,
      ip_hash: hashIp(clientIp(request)),
      status: "started",
    });
    intentSaved = !error;
  } catch {
    intentSaved = false;
  }

  const metadata = {
    kind: "donation",
    campaign: FUEL_CAMPAIGN,
    source: "fuel",
    tier: monthly ? FUEL_MONTHLY.slug : (resolved.tier?.slug ?? "custom"),
    cadence: parsed.data.cadence,
    intent_id: intentSaved ? intentId : "",
  };
  const productData = {
    name: `Token Fund: ${tierTitle}`,
    description:
      "Pays for the AI tokens that build and run realryannichols.com. Goes to Ryan Nichols directly.",
  };

  const stripe = requireStripe();
  const session = monthly
    ? await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: resolved.amountCents,
              recurring: { interval: "month" },
              product_data: productData,
            },
          },
        ],
        customer_email: email ?? undefined,
        // The subscription carries the same metadata so every invoice it
        // raises can be recognised as fuel by the webhook.
        subscription_data: { metadata },
        success_url: `${SITE.url}/fuel/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE.url}/fuel?canceled=1`,
        metadata,
      })
    : await stripe.checkout.sessions.create({
        mode: "payment",
        submit_type: "donate",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: resolved.amountCents,
              product_data: productData,
            },
          },
        ],
        customer_email: email ?? undefined,
        success_url: `${SITE.url}/fuel/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE.url}/fuel?canceled=1`,
        metadata,
      });
  return NextResponse.json({ url: session.url });
}
