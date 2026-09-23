import { z } from "zod";
import {
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  decodeTouchCookie,
  detectInApp,
  directTouch,
  isOwnHost,
  parseCookieHeader,
  parseLanding,
  sanitizeTouch,
  touchFromLegacy,
  type Touch,
} from "./attribution";

/**
 * Attribution half of the POST /api/checkout/book body. Every field is
 * lenient (`.catch`): bad attribution degrades to null, it never blocks a
 * purchase. The route adds the strict `slug` field on top.
 */
const looseText = (max: number) =>
  z
    .string()
    .max(4000)
    .transform((v) => v.trim().slice(0, max) || null)
    .nullish()
    .catch(null);

const touchBody = z
  .object({
    source: looseText(180),
    medium: looseText(180),
    campaign: looseText(180),
    content: looseText(180),
    term: looseText(180),
    clickId: looseText(180),
    landingPath: z
      .string()
      .max(4000)
      .transform((v) => v.trim().slice(0, 360))
      .catch(""),
    referrerHost: looseText(180),
    entry: z.enum(["campaign", "referral", "direct"]),
    inApp: looseText(40),
    firstSeenAt: z.union([z.string().max(64), z.number()]).nullish().catch(null),
  })
  .nullish()
  .catch(null);

// The pre-v2 client shape, still accepted from cached bundles.
const legacyBody = z
  .object({
    source: looseText(180),
    medium: looseText(180),
    campaign: looseText(180),
    content: looseText(180),
    term: looseText(180),
    clickId: looseText(180),
    landingPath: z.string().trim().min(1).max(360),
    referrerHost: looseText(180),
  })
  .nullish()
  .catch(null);

// Ids come from storage that can fail in private modes / webviews; an empty
// or odd id must not turn a sale into a 400.
const looseId = (max: number) =>
  z.string().trim().min(8).max(max).nullish().catch(null);

export const checkoutAttributionFields = z.object({
  sessionId: looseId(64),
  visitorId: looseId(80),
  attribution: legacyBody,
  firstTouch: touchBody,
  lastTouch: touchBody,
});

export type CheckoutAttributionFields = z.infer<typeof checkoutAttributionFields>;

/** Where the first touch on an order came from. */
export type AttributionCapture = "client" | "client_legacy" | "cookie" | "referer";

export type ResolvedCheckoutAttribution = {
  firstTouch: Touch;
  lastTouch: Touch | null;
  capture: AttributionCapture;
};

/**
 * Minimal touch from the checkout request's Referer (the page the buy button
 * was on). Campaign params still on that page's URL count; otherwise direct.
 */
export function touchFromRefererHeader(
  referer: string | null | undefined,
  userAgent: string | null | undefined,
  now: number,
  ownHosts: readonly string[] = [],
): Touch {
  if (referer && typeof referer === "string" && referer.length <= 2048) {
    try {
      const url = new URL(referer);
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        isOwnHost(url.hostname, ownHosts)
      ) {
        // Referrer = our own origin marks this as internal: no source guess.
        return parseLanding({
          url: url.href,
          referrer: `${url.origin}/`,
          userAgent,
          now,
          ownHosts,
        });
      }
    } catch {
      // fall through
    }
  }
  return directTouch(now, "", detectInApp(userAgent));
}

/**
 * First touch, in order: the client's v2 touch, an old client's legacy
 * attribution, the `rrn_ft` cookie, then the Referer header. Last touch: the
 * client's, then the `rrn_lt` cookie. Always returns a first touch.
 */
export function resolveCheckoutAttribution(
  body: Pick<CheckoutAttributionFields, "attribution" | "firstTouch" | "lastTouch">,
  request: {
    cookieHeader: string | null | undefined;
    refererHeader: string | null | undefined;
    userAgent: string | null | undefined;
    now: number;
    ownHosts?: readonly string[];
  },
): ResolvedCheckoutAttribution {
  const { now, ownHosts = [] } = request;
  const cookies = parseCookieHeader(request.cookieHeader);

  let firstTouch: Touch | null = sanitizeTouch(body.firstTouch, now);
  let capture: AttributionCapture = "client";
  if (!firstTouch && body.attribution) {
    firstTouch = touchFromLegacy(body.attribution, now, ownHosts);
    capture = "client_legacy";
  }
  if (!firstTouch) {
    firstTouch = decodeTouchCookie(cookies[FIRST_TOUCH_COOKIE], now)?.touch ?? null;
    capture = "cookie";
  }
  if (!firstTouch) {
    firstTouch = touchFromRefererHeader(
      request.refererHeader,
      request.userAgent,
      now,
      ownHosts,
    );
    capture = "referer";
  }

  let lastTouch: Touch | null = sanitizeTouch(body.lastTouch, now);
  if (!lastTouch || lastTouch.entry === "direct") {
    lastTouch = decodeTouchCookie(cookies[LAST_TOUCH_COOKIE], now)?.touch ?? null;
  }
  if (lastTouch?.entry === "direct") lastTouch = null;

  return { firstTouch, lastTouch, capture };
}

// ---------------------------------------------------------------------------
// Stripe metadata
// ---------------------------------------------------------------------------

export const STRIPE_METADATA_MAX_KEYS = 50;
export const STRIPE_METADATA_KEY_MAX = 40;
export const STRIPE_METADATA_VALUE_MAX = 500;

/** Null becomes "" (Stripe drops null keys); values stay under 480 chars. */
export function metadataValue(value: string | null | undefined): string {
  return value?.slice(0, 480) ?? "";
}

/**
 * Final guard for Stripe's metadata limits: at most 50 keys, keys up to 40
 * characters without square brackets, values up to 500 characters.
 * Insertion order is kept, so `kind` (first) always survives.
 */
export function enforceStripeMetadataLimits(
  metadata: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, value] of Object.entries(metadata)) {
    if (count >= STRIPE_METADATA_MAX_KEYS) break;
    if (!key || key.length > STRIPE_METADATA_KEY_MAX || /[[\]]/.test(key)) continue;
    out[key] = typeof value === "string" ? value.slice(0, STRIPE_METADATA_VALUE_MAX) : "";
    count += 1;
  }
  return out;
}

/**
 * Metadata for a book Checkout Session. `attribution_*` is the first touch
 * (same keys as before, now always populated), `last_touch_*` the latest
 * campaign/referral touch. The webhook copies these into
 * book_orders.attribution. No buyer PII goes in here.
 */
export function buildBookCheckoutMetadata(input: {
  productSlug: string;
  productName: string;
  amountUsd: string;
  firstTouch: Touch | null;
  lastTouch: Touch | null;
  capture: AttributionCapture | null;
  sessionId?: string | null;
  visitorId?: string | null;
}): Record<string, string> {
  const f = input.firstTouch;
  const l = input.lastTouch;
  return enforceStripeMetadataLimits({
    kind: "book_preorder",
    product_slug: input.productSlug,
    product_name: input.productName,
    amount_usd: input.amountUsd,
    attribution_source: metadataValue(f?.source),
    attribution_medium: metadataValue(f?.medium),
    attribution_campaign: metadataValue(f?.campaign),
    attribution_content: metadataValue(f?.content),
    attribution_term: metadataValue(f?.term),
    attribution_click_id: metadataValue(f?.clickId),
    attribution_landing_path: metadataValue(f?.landingPath),
    attribution_referrer_host: metadataValue(f?.referrerHost),
    attribution_entry: metadataValue(f?.entry),
    attribution_in_app: metadataValue(f?.inApp),
    attribution_first_seen_at: metadataValue(f?.firstSeenAt),
    attribution_capture: metadataValue(input.capture),
    last_touch_source: metadataValue(l?.source),
    last_touch_medium: metadataValue(l?.medium),
    last_touch_campaign: metadataValue(l?.campaign),
    last_touch_referrer_host: metadataValue(l?.referrerHost),
    analytics_session_id: metadataValue(input.sessionId),
    analytics_visitor_id: metadataValue(input.visitorId),
  });
}
