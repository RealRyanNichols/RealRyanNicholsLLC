import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { BOOK, BOOK_TIERS, tierPriceUsd, type BookTierSlug } from "@/lib/book";

export const runtime = "nodejs";

const SLUGS = BOOK_TIERS.map((t) => t.slug) as [BookTierSlug, ...BookTierSlug[]];
const nullableShort = z.string().trim().max(180).nullable();
const schema = z.object({
  slug: z.enum(SLUGS),
  sessionId: z.string().trim().min(8).max(64).nullable().optional(),
  visitorId: z.string().trim().min(8).max(80).nullable().optional(),
  attribution: z
    .object({
      source: nullableShort,
      medium: nullableShort,
      campaign: nullableShort,
      content: nullableShort,
      term: nullableShort,
      clickId: nullableShort,
      landingPath: z.string().trim().min(1).max(360),
      referrerHost: nullableShort,
    })
    .nullable()
    .optional(),
});

function metadataValue(value: string | null | undefined): string {
  return value?.slice(0, 480) ?? "";
}

// Tiers that ship a physical copy need a shipping address + phone.
const PHYSICAL: Set<BookTierSlug> = new Set([
  "signed_paperback_preorder",
  "founding_supporter_edition",
]);

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
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
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  // The amount is taken from our trusted server-side tier data — never from the
  // client — so the price cannot be tampered with.
  const tier = BOOK_TIERS.find((t) => t.slug === parsed.data.slug);
  if (!tier) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const isPhysical = PHYSICAL.has(tier.slug);
  const stripe = requireStripe();
  const attribution = parsed.data.attribution;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            // tierPriceUsd is the enforced price: sale while the window is
            // open, list after. Math.round guards float drift (17.76 * 100).
            unit_amount: Math.round(tierPriceUsd(tier) * 100),
            product_data: {
              name: `${BOOK.title} — ${tier.name}`,
              description: tier.tagline,
            },
          },
        },
      ],
      shipping_address_collection: isPhysical
        ? { allowed_countries: ["US"] }
        : undefined,
      phone_number_collection: isPhysical ? { enabled: true } : undefined,
      // Founding Supporter Edition can be listed in the book — collect the
      // opt-in display name at checkout.
      custom_fields:
        tier.slug === "founding_supporter_edition"
          ? [
              {
                key: "supporter_name",
                label: {
                  type: "custom",
                  custom: "Name to list as a supporter (optional)",
                },
                type: "text",
                optional: true,
              },
            ]
          : undefined,
      success_url: `${SITE.url}/book/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/book/preorder`,
      // Phase 4 (webhook) reads this to record the order in book_orders.
      metadata: {
        kind: "book_preorder",
        product_slug: tier.slug,
        product_name: tier.name,
        amount_usd: String(tierPriceUsd(tier)),
        attribution_source: metadataValue(attribution?.source),
        attribution_medium: metadataValue(attribution?.medium),
        attribution_campaign: metadataValue(attribution?.campaign),
        attribution_content: metadataValue(attribution?.content),
        attribution_term: metadataValue(attribution?.term),
        attribution_click_id: metadataValue(attribution?.clickId),
        attribution_landing_path: metadataValue(attribution?.landingPath),
        attribution_referrer_host: metadataValue(attribution?.referrerHost),
        analytics_session_id: metadataValue(parsed.data.sessionId),
        analytics_visitor_id: metadataValue(parsed.data.visitorId),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.warn(
      "book_checkout_failed",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
