import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_TOUCH_TTL_MS,
  LAST_TOUCH_TTL_MS,
  encodeTouchCookie,
  parseLanding,
  type Touch,
} from "../lib/attribution";
import {
  STRIPE_METADATA_KEY_MAX,
  STRIPE_METADATA_MAX_KEYS,
  STRIPE_METADATA_VALUE_MAX,
  buildBookCheckoutMetadata,
  checkoutAttributionFields,
  enforceStripeMetadataLimits,
  resolveCheckoutAttribution,
  touchFromRefererHeader,
} from "../lib/book-checkout-attribution";

const NOW = Date.parse("2026-09-22T12:00:00Z");
const SITE = "https://realryannichols.com";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const INSTAGRAM_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0.0.32.112";

function landing(path: string, referrer: string | null = null, now = NOW): Touch {
  return parseLanding({ url: `${SITE}${path}`, referrer, userAgent: UA, now });
}

function parseBody(body: unknown) {
  const parsed = checkoutAttributionFields.safeParse(body);
  assert.ok(parsed.success, "attribution fields must never fail the body");
  return parsed.data;
}

const REQ = { cookieHeader: null, refererHeader: null, userAgent: UA, now: NOW };

// ---------------------------------------------------------------------------
// Body parsing + fallbacks
// ---------------------------------------------------------------------------

test("a v2 body uses the client's first and last touch", () => {
  const first = landing("/book/start?utm_source=fb&utm_campaign=launch", "https://l.facebook.com/", NOW - 86_400_000);
  const last = landing("/posts/x", "https://t.co/x", NOW - 3600_000);
  const body = parseBody({ firstTouch: first, lastTouch: last, attribution: null });
  const r = resolveCheckoutAttribution(body, REQ);
  assert.equal(r.capture, "client");
  assert.deepEqual(r.firstTouch, first);
  assert.deepEqual(r.lastTouch, last);
});

test("an old client's legacy attribution is still honored", () => {
  const body = parseBody({
    slug: "ignored-here",
    attribution: {
      source: "newsletter",
      medium: "email",
      campaign: null,
      content: null,
      term: null,
      clickId: null,
      landingPath: "/book?utm_source=newsletter",
      referrerHost: null,
    },
    sessionId: "abcdefgh1234",
  });
  const r = resolveCheckoutAttribution(body, REQ);
  assert.equal(r.capture, "client_legacy");
  assert.equal(r.firstTouch.source, "newsletter");
  assert.equal(r.firstTouch.entry, "campaign");
  assert.equal(r.lastTouch, null);
});

test("with no attribution in the body, the rrn_ft / rrn_lt cookies are used", () => {
  const first = landing("/book?utm_source=tiktok&ttclid=1", null, NOW - 5 * 86_400_000);
  const last = landing("/posts/y", "https://www.google.com/", NOW - 86_400_000);
  const cookieHeader = [
    "sb-x-auth-token=zzz",
    `rrn_ft=${encodeTouchCookie({ touch: first, expiresAt: NOW - 5 * 86_400_000 + FIRST_TOUCH_TTL_MS })}`,
    `rrn_lt=${encodeTouchCookie({ touch: last, expiresAt: NOW - 86_400_000 + LAST_TOUCH_TTL_MS })}`,
  ].join("; ");
  const body = parseBody({ attribution: null });
  const r = resolveCheckoutAttribution(body, { ...REQ, cookieHeader });
  assert.equal(r.capture, "cookie");
  assert.deepEqual(r.firstTouch, first);
  assert.deepEqual(r.lastTouch, last);
});

test("the last-touch cookie fills in when the body has only a first touch", () => {
  const last = landing("/posts/y", "https://www.google.com/", NOW - 86_400_000);
  const cookieHeader = `rrn_lt=${encodeTouchCookie({ touch: last, expiresAt: NOW + 1000 })}`;
  const body = parseBody({ firstTouch: landing("/book") });
  const r = resolveCheckoutAttribution(body, { ...REQ, cookieHeader });
  assert.equal(r.capture, "client");
  assert.equal(r.firstTouch.entry, "direct");
  assert.equal(r.lastTouch?.source, "google");
});

test("garbage cookies fall through to the Referer header", () => {
  const body = parseBody({});
  const r = resolveCheckoutAttribution(body, {
    ...REQ,
    cookieHeader: "rrn_ft=%%%garbage; rrn_lt=eyJ2IjoyfQ",
    refererHeader: `${SITE}/book/preorder`,
  });
  assert.equal(r.capture, "referer");
  assert.equal(r.firstTouch.entry, "direct");
  assert.equal(r.firstTouch.source, "direct");
  assert.equal(r.firstTouch.landingPath, "/book/preorder");
  assert.equal(r.lastTouch, null);
});

test("Referer fallback keeps campaign params on the buy page but never guesses a source", () => {
  const withUtm = touchFromRefererHeader(`${SITE}/book/start?utm_source=ig&utm_campaign=launch`, INSTAGRAM_UA, NOW);
  assert.equal(withUtm.entry, "campaign");
  assert.equal(withUtm.source, "ig");
  assert.equal(withUtm.landingPath, "/book/start?utm_source=ig&utm_campaign=launch");
  const plain = touchFromRefererHeader(`${SITE}/book/preorder`, INSTAGRAM_UA, NOW);
  assert.equal(plain.entry, "direct");
  assert.equal(plain.inApp, "instagram");
  // Foreign or missing Referer: direct with an unknown ("") landing path.
  assert.equal(touchFromRefererHeader("https://evil.example/book", UA, NOW).landingPath, "");
  assert.equal(touchFromRefererHeader(null, UA, NOW).landingPath, "");
  assert.equal(touchFromRefererHeader("::::", UA, NOW).entry, "direct");
  // A SITE_URL override host counts as ours.
  const custom = touchFromRefererHeader("https://books.example.com/book", UA, NOW, ["books.example.com"]);
  assert.equal(custom.landingPath, "/book");
});

test("nothing at all still yields a direct first touch", () => {
  const r = resolveCheckoutAttribution(parseBody({}), REQ);
  assert.equal(r.capture, "referer");
  assert.equal(r.firstTouch.entry, "direct");
  assert.equal(r.firstTouch.firstSeenAt, "2026-09-22T12:00:00.000Z");
});

test("malformed attribution degrades to null instead of failing the body", () => {
  const body = parseBody({
    attribution: { source: 5, landingPath: "" },
    firstTouch: { entry: "bogus", landingPath: "/x" },
    lastTouch: "nope",
    sessionId: "",
    visitorId: 12,
  });
  assert.equal(body.attribution, null);
  assert.equal(body.firstTouch, null);
  assert.equal(body.lastTouch, null);
  assert.equal(body.sessionId, null);
  assert.equal(body.visitorId, null);
  const long = parseBody({
    firstTouch: { ...landing("/book"), source: "x".repeat(1000), firstSeenAt: "not a date" },
  });
  const r = resolveCheckoutAttribution(long, REQ);
  assert.equal(r.capture, "client");
  assert.equal(r.firstTouch.source?.length, 180);
  assert.equal(r.firstTouch.firstSeenAt, "2026-09-22T12:00:00.000Z");
});

test("a direct last touch from the client is not treated as a last touch", () => {
  const body = parseBody({ firstTouch: landing("/book"), lastTouch: landing("/book") });
  assert.equal(resolveCheckoutAttribution(body, REQ).lastTouch, null);
});

// ---------------------------------------------------------------------------
// Stripe metadata
// ---------------------------------------------------------------------------

const BASE = { productSlug: "ebook_preorder", productName: "Ebook", amountUsd: "17.76" };

test("metadata keeps the existing keys and adds entry, in-app, first-seen and last touch", () => {
  const first = parseLanding({
    url: `${SITE}/book/start?utm_source=fb&utm_medium=paid&utm_campaign=launch&fbclid=IwAR0`,
    referrer: null,
    userAgent: INSTAGRAM_UA,
    now: NOW,
  });
  const last = landing("/posts/x", "https://www.google.com/");
  const meta = buildBookCheckoutMetadata({
    ...BASE,
    firstTouch: first,
    lastTouch: last,
    capture: "client",
    sessionId: "sess12345",
    visitorId: "visit12345",
  });
  assert.deepEqual(meta, {
    kind: "book_preorder",
    product_slug: "ebook_preorder",
    product_name: "Ebook",
    amount_usd: "17.76",
    attribution_source: "fb",
    attribution_medium: "paid",
    attribution_campaign: "launch",
    attribution_content: "",
    attribution_term: "",
    attribution_click_id: "IwAR0",
    attribution_landing_path:
      "/book/start?utm_source=fb&utm_medium=paid&utm_campaign=launch&fbclid=IwAR0",
    attribution_referrer_host: "",
    attribution_entry: "campaign",
    attribution_in_app: "instagram",
    attribution_first_seen_at: "2026-09-22T12:00:00.000Z",
    attribution_capture: "client",
    last_touch_source: "google",
    last_touch_medium: "organic",
    last_touch_campaign: "",
    last_touch_referrer_host: "google.com",
    analytics_session_id: "sess12345",
    analytics_visitor_id: "visit12345",
  });
});

test("metadata for a direct visit records entry and landing path instead of blanks", () => {
  const meta = buildBookCheckoutMetadata({
    ...BASE,
    firstTouch: landing("/book"),
    lastTouch: null,
    capture: "client",
  });
  assert.equal(meta.attribution_source, "direct");
  assert.equal(meta.attribution_medium, "none");
  assert.equal(meta.attribution_entry, "direct");
  assert.equal(meta.attribution_landing_path, "/book");
  assert.equal(meta.last_touch_source, "");
  assert.equal(meta.analytics_session_id, "");
});

test("metadata turns nulls into empty strings and respects Stripe limits", () => {
  const meta = buildBookCheckoutMetadata({
    ...BASE,
    firstTouch: null,
    lastTouch: null,
    capture: null,
    sessionId: null,
    visitorId: undefined,
  });
  for (const [key, value] of Object.entries(meta)) {
    assert.equal(typeof value, "string", key);
    assert.ok(key.length <= STRIPE_METADATA_KEY_MAX, key);
    assert.ok(value.length <= STRIPE_METADATA_VALUE_MAX, key);
  }
  assert.ok(Object.keys(meta).length <= STRIPE_METADATA_MAX_KEYS);
  assert.equal(meta.kind, "book_preorder");
  assert.equal(meta.attribution_source, "");
  assert.equal(meta.attribution_entry, "");

  const long: Touch = { ...landing("/book"), source: "s".repeat(2000), landingPath: "/".repeat(2000) };
  const capped = buildBookCheckoutMetadata({ ...BASE, firstTouch: long, lastTouch: long, capture: "client" });
  assert.equal(capped.attribution_source.length, 480);
  assert.equal(capped.attribution_landing_path.length, 480);
});

test("enforceStripeMetadataLimits drops bad keys, caps values and key count", () => {
  const input: Record<string, string> = { kind: "book_preorder" };
  input["k".repeat(41)] = "too long a key";
  input["bad[key]"] = "brackets";
  input.big = "v".repeat(900);
  for (let i = 0; i < 80; i += 1) input[`extra_${i}`] = String(i);
  const out = enforceStripeMetadataLimits(input);
  assert.equal(Object.keys(out).length, STRIPE_METADATA_MAX_KEYS);
  assert.equal(out.kind, "book_preorder");
  assert.equal(out.big.length, STRIPE_METADATA_VALUE_MAX);
  assert.ok(!("bad[key]" in out));
  assert.ok(!(("k".repeat(41)) in out));
});
