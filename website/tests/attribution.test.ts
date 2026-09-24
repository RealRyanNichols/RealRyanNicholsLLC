import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COOKIE_VALUE_MAX,
  DIRECT_UPGRADE_WINDOW_MS,
  FIRST_TOUCH_MAX_AGE_S,
  FIRST_TOUCH_TTL_MS,
  LAST_TOUCH_TTL_MS,
  decodeTouchCookie,
  decodeTouchRecordJson,
  detectInApp,
  encodeTouchCookie,
  encodeTouchRecordJson,
  mergeFirstTouch,
  mergeLastTouch,
  parseCookieHeader,
  parseLanding,
  pickFirstRecord,
  pickLastRecord,
  sanitizeTouch,
  serializeTouchCookie,
  toLegacyAttribution,
  touchFromLegacy,
  type Touch,
  type TouchRecord,
} from "../lib/attribution";

const NOW = Date.parse("2026-09-22T12:00:00Z");
const SITE = "https://realryannichols.com";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const UAS = {
  facebookIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]",
  messengerIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/470.0;FBBV/1;FBDV/iPhone14,5]",
  messengerAndroid:
    "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/470.0.0;]",
  instagramIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0.0.32.112 (iPhone14,5; iOS 17_0; en_US; en; scale=3.00; 1170x2532; 548339486)",
  tiktokIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_31.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US",
  tiktokAndroid:
    "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0 Mobile Safari/537.36 trill_310503 BytedanceWebview/d8a21c6",
  snapchat:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.90.0.46 (like Safari/8617.1.17.10.7, panda)",
  linkedin:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.29.8000",
  pinterest:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
  line: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.16.0",
  twitterAndroid:
    "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0 Mobile Safari/537.36 TwitterAndroid",
  gsa: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/330.0.683183989 Mobile/15E148 Safari/604.1",
  iosWebview:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
};

function landing(path: string, referrer: string | null = null, userAgent: string | null = SAFARI_IOS, now = NOW): Touch {
  return parseLanding({ url: `${SITE}${path}`, referrer, userAgent, now });
}

function record(touch: Touch, expiresAt: number): TouchRecord {
  return { touch, expiresAt };
}

// ---------------------------------------------------------------------------
// Landing parse
// ---------------------------------------------------------------------------

test("utm landing is a campaign touch with the raw utm values", () => {
  const t = landing(
    "/book/start?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch&utm_content=video1&utm_term=j6",
    "https://l.facebook.com/",
  );
  assert.equal(t.entry, "campaign");
  assert.equal(t.source, "facebook");
  assert.equal(t.medium, "paid_social");
  assert.equal(t.campaign, "launch");
  assert.equal(t.content, "video1");
  assert.equal(t.term, "j6");
  assert.equal(t.referrerHost, "l.facebook.com");
  assert.equal(
    t.landingPath,
    "/book/start?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch&utm_content=video1&utm_term=j6",
  );
  assert.equal(t.firstSeenAt, "2026-09-22T12:00:00.000Z");
});

test("utm params are read case-insensitively", () => {
  const t = landing("/book?UTM_SOURCE=Newsletter&Utm_Medium=email");
  assert.equal(t.source, "Newsletter");
  assert.equal(t.medium, "email");
});

test("click ids alone classify the network", () => {
  assert.deepEqual(
    [landing("/book?gclid=abc").source, landing("/book?gclid=abc").medium],
    ["google", "cpc"],
  );
  assert.equal(landing("/book?msclkid=abc").source, "bing");
  assert.equal(landing("/book?ttclid=abc").source, "tiktok");
  assert.equal(landing("/book?twclid=abc").source, "x");
  assert.equal(landing("/book?ScCid=abc").source, "snapchat");
  const fb = landing("/book?fbclid=IwAR0abc");
  assert.equal(fb.entry, "campaign");
  assert.equal(fb.source, "facebook");
  assert.equal(fb.medium, "social");
  assert.equal(fb.clickId, "IwAR0abc");
});

test("fbclid inside Instagram is attributed to instagram", () => {
  const byUa = landing("/book?fbclid=IwAR0abc", null, UAS.instagramIos);
  assert.equal(byUa.source, "instagram");
  assert.equal(byUa.inApp, "instagram");
  const byReferrer = landing("/book?fbclid=IwAR0abc", "https://l.instagram.com/", CHROME_DESKTOP);
  assert.equal(byReferrer.source, "instagram");
  const byShare = landing("/book?fbclid=IwAR0abc&igshid=xyz", null, CHROME_DESKTOP);
  assert.equal(byShare.source, "instagram");
});

test("utm_source beats click-id and referrer inference", () => {
  const t = landing("/book?utm_source=ig_story&fbclid=abc", "https://l.facebook.com/");
  assert.equal(t.source, "ig_story");
  assert.equal(t.medium, "social");
});

test("external referrers become referral touches with a normalized source", () => {
  const cases: Array<[string, string, string, string]> = [
    ["https://www.google.com/", "google", "organic", "google.com"],
    ["https://www.google.co.uk/", "google", "organic", "google.co.uk"],
    ["https://lm.facebook.com/l.php?u=x", "facebook", "social", "lm.facebook.com"],
    ["https://t.co/abc", "x", "social", "t.co"],
    ["https://truthsocial.com/@someone", "truthsocial", "social", "truthsocial.com"],
    ["https://mail.google.com/", "gmail", "email", "mail.google.com"],
    ["https://news.example.org/story", "news.example.org", "referral", "news.example.org"],
    ["android-app://com.google.android.gm/", "gmail", "email", "com.google.android.gm"],
  ];
  for (const [ref, source, medium, host] of cases) {
    const t = landing("/book", ref);
    assert.equal(t.entry, "referral", ref);
    assert.equal(t.source, source, ref);
    assert.equal(t.medium, medium, ref);
    assert.equal(t.referrerHost, host, ref);
    assert.equal(t.landingPath, "/book");
  }
});

test("a direct visit always produces a touch with its landing path", () => {
  const t = landing("/book");
  assert.deepEqual(t, {
    source: "direct",
    medium: "none",
    campaign: null,
    content: null,
    term: null,
    clickId: null,
    landingPath: "/book",
    referrerHost: null,
    entry: "direct",
    inApp: null,
    firstSeenAt: "2026-09-22T12:00:00.000Z",
  });
  assert.equal(landing("/book", "").entry, "direct");
  assert.equal(landing("/book", "not a url").entry, "direct");
  assert.equal(landing("/book", "about:blank").entry, "direct");
});

test("self-referrals are ignored", () => {
  for (const ref of [
    "https://realryannichols.com/posts/x",
    "https://www.realryannichols.com/",
    "https://app.realryannichols.com/",
    "http://localhost:3000/",
    "https://realryannichols-git-feature-rrn.vercel.app/",
  ]) {
    const t = landing("/book/preorder", ref);
    assert.equal(t.entry, "direct", ref);
    assert.equal(t.referrerHost, null, ref);
  }
  // A custom host passed as own is honored too.
  const custom = parseLanding({
    url: "https://books.example.com/book",
    referrer: "https://books.example.com/",
    now: NOW,
  });
  assert.equal(custom.entry, "direct");
});

test("another site's vercel.app host is a real referrer", () => {
  const t = landing("/book", "https://jane-blog.vercel.app/post");
  assert.equal(t.entry, "referral");
  assert.equal(t.referrerHost, "jane-blog.vercel.app");
  const preview = landing("/book", "https://realryanichols-personal-git-main-realryannichols.vercel.app/");
  assert.equal(preview.entry, "direct");
});

test("a Stripe cancel/success return is never a referrer", () => {
  for (const ref of ["https://checkout.stripe.com/c/pay/cs_live_x", "https://stripe.com/"]) {
    const t = landing("/book/preorder", ref, UAS.instagramIos);
    assert.equal(t.entry, "direct", ref);
    assert.equal(t.source, "direct");
    assert.equal(t.referrerHost, null);
    // The in-app UA is still recorded, but does not become the source.
    assert.equal(t.inApp, "instagram");
  }
});

test("in-app browsers are detected from the user agent", () => {
  assert.equal(detectInApp(UAS.facebookIos), "facebook");
  assert.equal(detectInApp(UAS.facebookAndroid), "facebook");
  assert.equal(detectInApp(UAS.messengerIos), "messenger");
  assert.equal(detectInApp(UAS.messengerAndroid), "messenger");
  assert.equal(detectInApp(UAS.instagramIos), "instagram");
  assert.equal(detectInApp(UAS.tiktokIos), "tiktok");
  assert.equal(detectInApp(UAS.tiktokAndroid), "tiktok");
  assert.equal(detectInApp(UAS.snapchat), "snapchat");
  assert.equal(detectInApp(UAS.linkedin), "linkedin");
  assert.equal(detectInApp(UAS.pinterest), "pinterest");
  assert.equal(detectInApp(UAS.line), "line");
  assert.equal(detectInApp(UAS.twitterAndroid), "x");
  assert.equal(detectInApp(UAS.gsa), "google_app");
  assert.equal(detectInApp(UAS.iosWebview), "webview");
  assert.equal(detectInApp(SAFARI_IOS), null);
  assert.equal(detectInApp(CHROME_DESKTOP), null);
  assert.equal(detectInApp("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"), null);
  assert.equal(detectInApp("Pinterestbot/1.0"), null);
  assert.equal(detectInApp(null), null);
});

test("an in-app visit with no referrer is a referral from that app", () => {
  const t = landing("/book", null, UAS.facebookIos);
  assert.equal(t.entry, "referral");
  assert.equal(t.source, "facebook");
  assert.equal(t.medium, "social");
  assert.equal(t.inApp, "facebook");
  assert.equal(t.referrerHost, null);
  assert.equal(landing("/book", null, UAS.tiktokIos).source, "tiktok");
  // A generic webview says nothing about the source: still direct.
  const wv = landing("/book", null, UAS.iosWebview);
  assert.equal(wv.entry, "direct");
  assert.equal(wv.inApp, "webview");
});

test("landingPath drops params that look like personal data", () => {
  const t = landing("/book?utm_source=mail&email=reader%40example.com&name=Jo&x=1&note=hi%20a%40b.co");
  assert.equal(t.landingPath, "/book?utm_source=mail&x=1");
  const clean = landing("/book?utm_campaign=a%20b");
  assert.equal(clean.landingPath, "/book?utm_campaign=a%20b");
  // Stripe's success redirect carries session_id; it is dropped.
  assert.equal(landing("/book/thank-you?session_id=cs_live_abc").landingPath, "/book/thank-you");
});

test("utm values that look like an email address are dropped, handles are kept", () => {
  const t = landing("/book?utm_source=%40ryan&utm_term=reader%40example.com&utm_campaign=launch");
  assert.equal(t.source, "@ryan");
  assert.equal(t.term, null);
  assert.equal(t.campaign, "launch");
  assert.equal(t.landingPath, "/book?utm_source=%40ryan&utm_campaign=launch");
});

test("sanitizeTouch re-applies the PII filter to client-sent touches", () => {
  const t = sanitizeTouch({
    entry: "campaign",
    source: "fb",
    content: "reader@example.com",
    landingPath: "/book?utm_source=fb&email=reader%40example.com",
    firstSeenAt: NOW,
  });
  assert.equal(t?.content, null);
  assert.equal(t?.landingPath, "/book?utm_source=fb");
  assert.equal(
    sanitizeTouch({ entry: "direct", landingPath: "//evil.example/x?a=1", firstSeenAt: NOW })?.landingPath,
    "",
  );
});

test("long values are truncated", () => {
  const t = landing(`/book?utm_campaign=${"c".repeat(500)}&fbclid=${"f".repeat(500)}`);
  assert.equal(t.campaign?.length, 180);
  assert.equal(t.clickId?.length, 180);
  assert.ok(t.landingPath.length <= 360);
});

// ---------------------------------------------------------------------------
// Merge rules
// ---------------------------------------------------------------------------

test("first touch is written once and a later campaign does not overwrite it", () => {
  const referral = landing("/posts/x", "https://www.google.com/");
  const first = mergeFirstTouch(null, referral, NOW);
  assert.ok(first);
  assert.equal(first.expiresAt, NOW + FIRST_TOUCH_TTL_MS);
  const later = landing("/book?utm_source=fb", null, SAFARI_IOS, NOW + 60_000);
  assert.equal(mergeFirstTouch(first, later, NOW + 60_000), first);
  const dayTwo = landing("/book?utm_source=fb", null, SAFARI_IOS, NOW + 86_400_000);
  assert.equal(mergeFirstTouch(first, dayTwo, NOW + 86_400_000), first);
});

test("a direct first touch is upgraded once within 30 minutes", () => {
  const direct = mergeFirstTouch(null, landing("/book"), NOW);
  assert.ok(direct);
  const t1 = NOW + 10 * 60_000;
  const campaign = landing("/book/start?utm_source=ig", null, SAFARI_IOS, t1);
  const upgraded = mergeFirstTouch(direct, campaign, t1);
  assert.ok(upgraded);
  assert.equal(upgraded.touch.entry, "campaign");
  assert.equal(upgraded.touch.source, "ig");
  assert.equal(upgraded.touch.landingPath, "/book/start?utm_source=ig");
  // Keeps when the visitor was first seen, and the original expiry.
  assert.equal(upgraded.touch.firstSeenAt, direct.touch.firstSeenAt);
  assert.equal(upgraded.expiresAt, direct.expiresAt);
  // Only once: a second campaign in the window does not replace it.
  const t2 = NOW + 20 * 60_000;
  const again = landing("/book?utm_source=tiktok", null, SAFARI_IOS, t2);
  assert.equal(mergeFirstTouch(upgraded, again, t2), upgraded);
});

test("a direct first touch is not upgraded after the window", () => {
  const direct = mergeFirstTouch(null, landing("/book"), NOW);
  const late = NOW + DIRECT_UPGRADE_WINDOW_MS + 1;
  const campaign = landing("/book?utm_source=ig", null, SAFARI_IOS, late);
  assert.equal(mergeFirstTouch(direct, campaign, late), direct);
});

test("an expired first touch is replaced, including by a direct touch", () => {
  const old = mergeFirstTouch(null, landing("/book?utm_source=old"), NOW);
  assert.ok(old);
  const after = old.expiresAt + 1;
  const fresh = mergeFirstTouch(old, landing("/book", null, SAFARI_IOS, after), after);
  assert.ok(fresh);
  assert.equal(fresh.touch.entry, "direct");
  assert.equal(fresh.expiresAt, after + FIRST_TOUCH_TTL_MS);
  assert.equal(mergeFirstTouch(old, null, after), null);
});

test("last touch follows campaign/referral landings and ignores direct ones", () => {
  const a = mergeLastTouch(null, landing("/book?utm_source=a"), NOW);
  assert.ok(a);
  assert.equal(a.expiresAt, NOW + LAST_TOUCH_TTL_MS);
  const t1 = NOW + 86_400_000;
  assert.equal(mergeLastTouch(a, landing("/book", null, SAFARI_IOS, t1), t1), a);
  assert.equal(mergeLastTouch(a, null, t1), a);
  const b = mergeLastTouch(a, landing("/posts/x", "https://t.co/x", SAFARI_IOS, t1), t1);
  assert.equal(b?.touch.source, "x");
  // Expires after 30 days.
  const expired = a.expiresAt + 1;
  assert.equal(mergeLastTouch(a, landing("/book", null, SAFARI_IOS, expired), expired), null);
  assert.equal(mergeLastTouch(null, landing("/book"), NOW), null);
});

test("pickFirstRecord takes the earliest live record; pickLastRecord the latest", () => {
  const early = record(landing("/a?utm_source=early", null, SAFARI_IOS, NOW - 5000), NOW + 1000);
  const late = record(landing("/b?utm_source=late"), NOW + 1000);
  const expired = record(landing("/c?utm_source=gone", null, SAFARI_IOS, NOW - 9000), NOW - 1);
  assert.equal(pickFirstRecord([late, null, early, expired], NOW), early);
  assert.equal(pickLastRecord([early, late, expired, undefined], NOW), late);
  assert.equal(pickFirstRecord([expired], NOW), null);
  // Same moment: a non-direct record beats a direct one.
  const direct = record(landing("/d"), NOW + 1000);
  const upgraded = record({ ...landing("/d?utm_source=x"), firstSeenAt: direct.touch.firstSeenAt }, NOW + 1000);
  assert.equal(pickFirstRecord([direct, upgraded], NOW), upgraded);
  // A direct record is never a last touch.
  assert.equal(pickLastRecord([direct], NOW), null);
});

test("the full localStorage record beats its truncated cookie copy", () => {
  // Sub-second timestamp: the cookie keeps whole seconds, so its copy looks
  // a few ms earlier. It must still not replace the richer record.
  const at = NOW + 789;
  const touch = landing(`/book?utm_source=fb&utm_campaign=${"c".repeat(170)}`, null, SAFARI_IOS, at);
  const full = record(touch, at + FIRST_TOUCH_TTL_MS);
  const fromCookie = decodeTouchCookie(encodeTouchCookie(full), at);
  assert.ok(fromCookie);
  assert.ok((fromCookie.touch.campaign ?? "").length < (touch.campaign ?? "").length);
  assert.equal(pickFirstRecord([full, fromCookie], at), full);
  const last = record(touch, at + LAST_TOUCH_TTL_MS);
  const lastCookie = decodeTouchCookie(encodeTouchCookie(last), at);
  assert.equal(pickLastRecord([last, lastCookie], at), last);
});

test("legacy sessionStorage attribution is migrated and de-polluted", () => {
  const campaign = touchFromLegacy(
    {
      source: "facebook",
      medium: "paid",
      campaign: "launch",
      content: null,
      term: null,
      clickId: null,
      landingPath: "/book/start?utm_source=facebook",
      referrerHost: "l.facebook.com",
    },
    NOW,
  );
  assert.equal(campaign?.entry, "campaign");
  assert.equal(campaign?.source, "facebook");
  assert.equal(campaign?.referrerHost, "l.facebook.com");
  const referral = touchFromLegacy(
    { landingPath: "/posts/x", referrerHost: "google.com", source: null },
    NOW,
  );
  assert.equal(referral?.entry, "referral");
  assert.equal(referral?.source, "google");
  // Old captures could record a Stripe return or our own host as the referrer.
  const stripe = touchFromLegacy({ landingPath: "/book/preorder", referrerHost: "checkout.stripe.com" }, NOW);
  assert.equal(stripe?.entry, "direct");
  assert.equal(stripe?.referrerHost, null);
  const self = touchFromLegacy({ landingPath: "/", referrerHost: "realryannichols.com" }, NOW);
  assert.equal(self?.entry, "direct");
  assert.equal(touchFromLegacy({ source: "x" }, NOW), null);
  assert.equal(touchFromLegacy("garbage", NOW), null);
});

test("toLegacyAttribution keeps the pre-v2 body shape", () => {
  const t = landing("/book?utm_source=a", "https://www.google.com/");
  assert.deepEqual(toLegacyAttribution(t), {
    source: "a",
    medium: "organic",
    campaign: null,
    content: null,
    term: null,
    clickId: null,
    landingPath: "/book?utm_source=a",
    referrerHost: "google.com",
  });
  assert.equal(toLegacyAttribution(null), null);
  assert.equal(toLegacyAttribution({ ...t, landingPath: "" }), null);
});

// ---------------------------------------------------------------------------
// Storage codecs
// ---------------------------------------------------------------------------

test("localStorage JSON round-trips and rejects garbage or expired records", () => {
  const r = record(landing("/book?utm_source=a", null, UAS.tiktokIos), NOW + 1000);
  assert.deepEqual(decodeTouchRecordJson(encodeTouchRecordJson(r), NOW), r);
  assert.equal(decodeTouchRecordJson(encodeTouchRecordJson(r), NOW + 1000), null);
  for (const bad of [null, "", "{", "[]", "null", '{"v":1}', '{"v":2,"exp":"x","touch":{}}', '{"v":2,"exp":1e20,"touch":{"entry":"nope","landingPath":"/"}}']) {
    assert.equal(decodeTouchRecordJson(bad, NOW), null, String(bad));
  }
});

test("cookie encode/decode round-trips", () => {
  const touch = landing(
    "/book/start?utm_source=fb&utm_medium=paid&utm_campaign=launch&fbclid=IwAR0",
    "https://l.facebook.com/",
    UAS.facebookIos,
  );
  const r = record(touch, NOW + FIRST_TOUCH_TTL_MS);
  const value = encodeTouchCookie(r);
  assert.match(value, /^[A-Za-z0-9_-]+$/);
  const back = decodeTouchCookie(value, NOW);
  assert.deepEqual(back, r);
  // Expired → null.
  assert.equal(decodeTouchCookie(value, NOW + FIRST_TOUCH_TTL_MS + 1000), null);
  // Direct touches round-trip with their defaults.
  const direct = record(landing("/book"), NOW + 1000);
  assert.deepEqual(decodeTouchCookie(encodeTouchCookie(direct), NOW), direct);
});

test("cookie values stay under the size cap, even with huge or multi-byte values", () => {
  const huge: Touch = {
    source: "s".repeat(180),
    medium: "m".repeat(180),
    campaign: "🔥".repeat(90),
    content: "ç".repeat(180),
    term: "t".repeat(180),
    clickId: "k".repeat(180),
    landingPath: `/book?${"p".repeat(354)}`,
    referrerHost: "r".repeat(180),
    entry: "campaign",
    inApp: "instagram",
    firstSeenAt: new Date(NOW).toISOString(),
  };
  const value = encodeTouchCookie(record(huge, NOW + 1000));
  assert.ok(value.length <= COOKIE_VALUE_MAX, `length ${value.length}`);
  const back = decodeTouchCookie(value, NOW);
  assert.ok(back);
  assert.equal(back.touch.entry, "campaign");
  assert.ok((back.touch.source ?? "").length <= 80);
  assert.ok(back.touch.landingPath.length <= 160);
  // Serialized cookie (value + attributes) stays well under 4KB.
  assert.ok(serializeTouchCookie("rrn_ft", value, FIRST_TOUCH_MAX_AGE_S, true).length < 1400);
});

test("cookie decode is robust to garbage", () => {
  const b64 = (s: string) => Buffer.from(s).toString("base64url");
  const bad = [
    undefined,
    null,
    "",
    "%%%",
    "not base64!",
    "a".repeat(5000),
    b64("not json"),
    b64("[]"),
    b64("null"),
    b64(JSON.stringify({ v: 1, e: "c", f: 1, x: 9e9 })),
    b64(JSON.stringify({ v: 2, e: "z", f: 1, x: 9e9 })),
    b64(JSON.stringify({ v: 2, e: "c", f: "1", x: 9e9 })),
    b64(JSON.stringify({ v: 2, e: "c", f: 1, x: 1 })),
    b64(JSON.stringify({ v: 2, e: "c", f: 1e300, x: 9e9 })),
  ];
  for (const v of bad) {
    assert.equal(decodeTouchCookie(v as string | null | undefined, NOW), null, String(v).slice(0, 40));
  }
  // Wrong field types are dropped, not trusted.
  const odd = decodeTouchCookie(
    b64(JSON.stringify({ v: 2, e: "r", f: NOW / 1000, x: NOW / 1000 + 60, s: 42, p: ["x"], r: "ok.example" })),
    NOW,
  );
  assert.equal(odd?.touch.source, null);
  assert.equal(odd?.touch.landingPath, "");
  assert.equal(odd?.touch.referrerHost, "ok.example");
});

test("parseCookieHeader tolerates garbage and keeps the first value", () => {
  const jar = parseCookieHeader(' a=1; b="two"; =x; junk; c=%E0%A4%A; a=3; __proto__=p; rrn_ft=abc_-');
  assert.equal(jar.a, "1");
  assert.equal(jar.b, "two");
  assert.equal(jar.c, "%E0%A4%A");
  assert.equal(jar.rrn_ft, "abc_-");
  assert.equal(jar.__proto__, "p");
  assert.equal(Object.keys(parseCookieHeader(null)).length, 0);
  assert.equal(Object.keys(parseCookieHeader("")).length, 0);
});

test("serializeTouchCookie sets path, max-age, SameSite and Secure on https", () => {
  assert.equal(
    serializeTouchCookie("rrn_ft", "v", FIRST_TOUCH_MAX_AGE_S, true),
    "rrn_ft=v; Path=/; Max-Age=7776000; SameSite=Lax; Secure",
  );
  assert.equal(
    serializeTouchCookie("rrn_lt", "v", 12.9, false),
    "rrn_lt=v; Path=/; Max-Age=12; SameSite=Lax",
  );
  assert.equal(serializeTouchCookie("x", "v", -5, false), "x=v; Path=/; Max-Age=0; SameSite=Lax");
  assert.equal(FIRST_TOUCH_MAX_AGE_S * 1000, FIRST_TOUCH_TTL_MS);
});

test("sanitizeTouch rejects malformed touches and fills direct defaults", () => {
  assert.equal(sanitizeTouch(null), null);
  assert.equal(sanitizeTouch([]), null);
  assert.equal(sanitizeTouch({ entry: "direct" }), null);
  assert.equal(sanitizeTouch({ entry: "direct", landingPath: "/", firstSeenAt: "nope" }), null);
  const withNow = sanitizeTouch({ entry: "direct", landingPath: "/", firstSeenAt: "nope" }, NOW);
  assert.equal(withNow?.source, "direct");
  assert.equal(withNow?.medium, "none");
  assert.equal(withNow?.firstSeenAt, "2026-09-22T12:00:00.000Z");
});
