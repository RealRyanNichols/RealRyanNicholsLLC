// One-shot endpoint: ensures the Stripe webhook endpoint exists for this site
// and returns its signing secret. Gated by STRIPE_WEBHOOK_SETUP_TOKEN — a
// short-lived env var that is removed once the setup is complete.
//
// This route should be deleted after first successful use.

import { NextResponse } from "next/server";
import Stripe from "stripe";

const WEBHOOK_URL = "https://realryannichols.com/api/stripe/webhook";
const EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
];

export async function POST(request: Request) {
  const setupToken = process.env.STRIPE_WEBHOOK_SETUP_TOKEN;
  const provided = request.headers.get("x-setup-token");
  if (!setupToken || !provided || provided !== setupToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY missing" }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const all = await stripe.webhookEndpoints.list({ limit: 100 });
  let endpoint = all.data.find((e) => e.url === WEBHOOK_URL);
  let action = "kept";

  if (!endpoint) {
    endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: EVENTS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: "realryannichols.com — donation meter",
    });
    action = "created";
  } else if (!endpoint.secret) {
    await stripe.webhookEndpoints.del(endpoint.id);
    endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: EVENTS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: "realryannichols.com — donation meter",
    });
    action = "recreated_for_secret";
  }

  const whsec = endpoint.secret;
  if (!whsec || !whsec.startsWith("whsec_")) {
    return NextResponse.json({ error: "no signing secret obtained" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    action,
    endpoint_id: endpoint.id,
    url: endpoint.url,
    events: endpoint.enabled_events.length,
    secret: whsec,
  });
}
