import Stripe from "stripe";
import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { recordDonationFromSession } from "@/lib/donations";

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
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        await handleServiceInvoiceChange(supabase, event);
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
    if (kind === "service_payment_plan") {
      await handleServicePaymentPlanCheckout(stripe, supabase, session);
      return;
    }

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
    // Shared with the /checkout/success backstop — idempotent on session id.
    await recordDonationFromSession(session, supabase);
    return;
  }

  if (session.mode === "payment" && kind === "book_preorder") {
    await handleBookPreorder(supabase, session);
    return;
  }

  if (session.mode === "payment" && kind === "blueprint_purchase") {
    await handleBlueprintPurchase(supabase, session);
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

const BOOK_PHYSICAL_SLUGS = new Set([
  "signed_paperback_preorder",
  "founding_supporter_edition",
]);

async function handleBookPreorder(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const details = session.customer_details;
  const supporterField = session.custom_fields?.find(
    (f) => f.key === "supporter_name",
  );
  const supporterName = supporterField?.text?.value?.trim() || null;
  const slug = session.metadata?.product_slug ?? null;
  const isPhysical = slug ? BOOK_PHYSICAL_SLUGS.has(slug) : false;

  // Idempotent on the session id (in addition to the event-level dedupe above),
  // and `ignoreDuplicates` keeps the original download token if this re-runs.
  await supabase.from("book_orders").upsert(
    {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      customer_email: details?.email ?? null,
      customer_name: details?.name ?? null,
      product_slug: slug,
      product_name: session.metadata?.product_name ?? null,
      amount_paid: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      payment_status: session.payment_status ?? "paid",
      preorder_status: "preordered",
      download_token: randomBytes(24).toString("hex"),
      supporter_name_opt_in: Boolean(supporterName),
      supporter_display_name: supporterName,
      notes: isPhysical
        ? "Physical edition — shipping address collected at checkout (see the Stripe session)."
        : null,
    },
    { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true },
  );
}

async function handleBlueprintPurchase(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const details = session.customer_details;
  const intakeId = session.metadata?.intake_id || null;
  await supabase.from("blueprint_orders").upsert(
    {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      customer_email: details?.email ?? null,
      customer_name: details?.name ?? null,
      package_slug: session.metadata?.package_slug ?? null,
      package_name: session.metadata?.package_name ?? null,
      amount_paid: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      payment_status: session.payment_status ?? "paid",
      intake_id: intakeId,
      notes:
        session.metadata?.is_deposit === "true"
          ? "50% deposit. Balance due before final handoff."
          : null,
    },
    { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true },
  );
  if (intakeId) {
    await supabase
      .from("blueprint_intake")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", intakeId);
  }
}

async function handleServicePaymentPlanCheckout(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const localId = session.metadata?.service_invoice_id;
  if (!localId) return;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const cancelAfter = session.metadata?.cancel_after_timestamp;

  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    const metadata = sub.metadata ?? {};
    const cancelAt = Number(metadata.cancel_after_timestamp ?? cancelAfter);
    if (Number.isFinite(cancelAt) && cancelAt > Math.floor(Date.now() / 1000)) {
      await stripe.subscriptions.update(subId, {
        cancel_at: Math.floor(cancelAt),
        metadata: {
          ...metadata,
          service_invoice_id: localId,
          kind: "service_payment_plan",
        },
      });
    }
  }

  await supabase
    .from("service_invoices")
    .update({
      updated_at: new Date().toISOString(),
      status: "open",
      stripe_customer_id: customerId,
      stripe_subscription_id: subId,
      stripe_checkout_session_id: session.id,
      stripe_last_error: null,
    })
    .eq("id", localId);
}

async function handleSubscriptionChange(
  supabase: SupabaseClient,
  event: Stripe.Event,
) {
  const sub = event.data.object as Stripe.Subscription;
  if (sub.metadata?.kind === "service_payment_plan") return;

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
  await supabase
    .from("book_orders")
    .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", pi);
  await supabase
    .from("blueprint_orders")
    .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", pi);
}

async function handleServiceInvoiceChange(
  supabase: SupabaseClient,
  event: Stripe.Event,
) {
  const invoice = event.data.object as Stripe.Invoice;
  const metadata =
    invoice.metadata?.kind === "service_invoice" ||
    invoice.metadata?.kind === "service_payment_plan"
      ? invoice.metadata
      : invoice.parent?.subscription_details?.metadata ?? null;
  if (
    metadata?.kind !== "service_invoice" &&
    metadata?.kind !== "service_payment_plan"
  ) {
    return;
  }

  const invoiceId = invoice.id;
  const localId = metadata?.service_invoice_id;
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id ?? null;
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : event.type === "invoice.paid"
      ? new Date().toISOString()
      : null;

  const status =
    event.type === "invoice.paid"
      ? "paid"
      : event.type === "invoice.payment_failed"
        ? "open"
        : event.type === "invoice.voided"
          ? "void"
          : "uncollectible";

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    status,
    stripe_hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    stripe_invoice_pdf: invoice.invoice_pdf ?? null,
  };
  if (metadata.kind === "service_invoice") {
    update.amount_paid_cents = invoice.amount_paid ?? 0;
  } else if (event.type === "invoice.paid") {
    let currentPaid = 0;
    let totalCents = Number(metadata.total_cents ?? 0);
    const query = localId
      ? supabase
          .from("service_invoices")
          .select("amount_cents, amount_paid_cents")
          .eq("id", localId)
      : supabase
          .from("service_invoices")
          .select("amount_cents, amount_paid_cents")
          .eq("stripe_subscription_id", subscriptionId);
    const { data: local } = await query.maybeSingle();
    currentPaid = Number(local?.amount_paid_cents ?? 0);
    totalCents = Number(local?.amount_cents ?? totalCents);
    const nextPaid = currentPaid + (invoice.amount_paid ?? 0);
    update.amount_paid_cents = totalCents > 0 ? Math.min(totalCents, nextPaid) : nextPaid;
    if (totalCents > 0 && nextPaid >= totalCents) {
      update.status = "paid";
      update.paid_at = paidAt ?? new Date().toISOString();
    } else {
      update.status = "open";
    }
  }
  if (metadata.kind === "service_invoice" && paidAt) update.paid_at = paidAt;
  if (event.type === "invoice.payment_failed") {
    update.stripe_last_error = "Stripe reported a failed invoice payment.";
  } else {
    update.stripe_last_error = null;
  }

  let query = supabase.from("service_invoices").update(update);
  query = localId
    ? query.eq("id", localId)
    : subscriptionId
      ? query.eq("stripe_subscription_id", subscriptionId)
      : query.eq("stripe_invoice_id", invoiceId);
  await query;
}
