import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret || !process.env.STRIPE_SECRET_KEY) {
    return new Response("config", { status: 500 });
  }
  const stripe = requireStripe();
  const rawBody = await req.text(); // raw body REQUIRED for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  // Idempotency: the primary key collides on a re-delivered event.
  const { error: insertErr } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (insertErr) {
    return new Response("already processed", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, supabase, event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(supabase, event);
        break;
      case "charge.refunded":
        await handleRefund(supabase, event);
        break;
      // payment_intent.succeeded is intentionally a no-op —
      // checkout.session.completed is the canonical money event.
    }
    await supabase
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", event.id);
  } catch (e) {
    await supabase
      .from("stripe_events")
      .update({ error: String((e as Error)?.message ?? e) })
      .eq("event_id", event.id);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  supabase: SupabaseClient,
  event: Stripe.Event,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const kind = session.metadata?.kind;

  if (session.mode === "subscription") {
    // Link the subscription to the signed-in profile captured at checkout.
    const userId = session.client_reference_id;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;
    const subId =
      typeof session.subscription === "string" ? session.subscription : null;
    if (userId) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("supporter_since")
        .eq("id", userId)
        .maybeSingle();
      await supabase
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          is_supporter: true,
          supporter_since: existing?.supporter_since ?? new Date().toISOString(),
        })
        .eq("id", userId);
    }
    return;
  }

  if (session.mode === "payment" && kind === "donation") {
    await supabase.from("donations").upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        email: session.customer_details?.email ?? null,
        name: session.customer_details?.name ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        recurring: false,
        campaign: session.metadata?.campaign || null,
        source: session.metadata?.source || null,
      },
      { onConflict: "stripe_session_id" },
    );
    return;
  }

  if (session.mode === "payment" && kind === "order") {
    const { data: order } = await supabase
      .from("orders")
      .upsert(
        {
          stripe_session_id: session.id,
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          email: session.customer_details?.email ?? null,
          name: session.customer_details?.name ?? null,
          amount_cents: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
          status: "paid",
          shipping_json: session.customer_details ?? null,
        },
        { onConflict: "stripe_session_id" },
      )
      .select("id")
      .single();

    if (order) {
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 100 },
      );
      for (const li of lineItems.data) {
        const priceId =
          typeof li.price?.id === "string" ? li.price.id : null;
        let productId: string | null = null;
        let productSlug: string | null = null;
        if (priceId) {
          const { data: prod } = await supabase
            .from("products")
            .select("id, slug")
            .eq("stripe_price_id", priceId)
            .maybeSingle();
          productId = prod?.id ?? null;
          productSlug = prod?.slug ?? null;
        }
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: productId,
          product_slug: productSlug,
          qty: li.quantity ?? 1,
          unit_amount_cents: li.amount_total ?? li.price?.unit_amount ?? 0,
        });
      }
    }
    return;
  }
}

async function handleSubscriptionChange(
  supabase: SupabaseClient,
  event: Stripe.Event,
) {
  const sub = event.data.object as Stripe.Subscription;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  if (!customerId) return;
  const active = sub.status === "active" || sub.status === "trialing";

  const update: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    is_supporter: active,
  };
  if (!active) update.supporter_canceled_at = new Date().toISOString();

  await supabase
    .from("profiles")
    .update(update)
    .eq("stripe_customer_id", customerId);
}

async function handleRefund(supabase: SupabaseClient, event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const pi =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;
  if (!pi) return;
  await supabase
    .from("donations")
    .update({ refunded_at: new Date().toISOString() })
    .eq("stripe_payment_intent", pi);
  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent", pi);
}
