/**
 * Pure acquisition-attribution model: parse a landing into a touch, merge
 * first/last touches, and encode them for localStorage and a first-party
 * cookie. No window/document access here — the browser glue lives in
 * lib/acquisition.ts and the checkout route reads the cookies server-side.
 *
 * Persistence rules (as built):
 * - Every landing produces a touch, including direct visits
 *   (source "direct", medium "none", entry "direct", landingPath set).
 * - First touch is written once and kept 90 days from when it was first seen
 *   (localStorage `rrn_ft_v2` + cookie `rrn_ft`). A later campaign or referral
 *   landing never overwrites it, with one exception: a *direct* first touch is
 *   upgraded once by the first campaign/referral touch that arrives within
 *   30 minutes of it (the same visit). The upgraded touch keeps the original
 *   firstSeenAt and expiry.
 * - Last touch is the latest campaign/referral landing, kept 30 days from that
 *   landing (localStorage `rrn_lt_v2` + cookie `rrn_lt`). Direct landings never
 *   replace it.
 * - Referrers from our own hosts and from Stripe are treated as internal
 *   navigation: they are never a source, and they suppress the in-app
 *   user-agent guess (a Stripe cancel/success return is not a new visit).
 */

export type AttributionEntry = "campaign" | "referral" | "direct";

export type Touch = {
  /** utm_source, else derived from click id / referrer / in-app browser; "direct" for direct. */
  source: string | null;
  /** utm_medium, else derived ("cpc", "social", "organic", "email", "referral"); "none" for direct. */
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  /** Path + query of the landing page, with PII-looking params removed. "" when unknown. */
  landingPath: string;
  /** External referrer host (no www.), never our own hosts or Stripe. */
  referrerHost: string | null;
  entry: AttributionEntry;
  /** In-app browser detected from the user agent ("instagram", "facebook", ...). */
  inApp: string | null;
  /** ISO time the touch was first seen. */
  firstSeenAt: string;
};

/** The shape stored before v2 and still accepted by the checkout route. */
export type LegacyAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  landingPath: string;
  referrerHost: string | null;
};

export type TouchRecord = {
  touch: Touch;
  /** Epoch ms after which the record is ignored. */
  expiresAt: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const FIRST_TOUCH_TTL_MS = 90 * DAY_MS;
export const LAST_TOUCH_TTL_MS = 30 * DAY_MS;
/** 90 days, the cookie Max-Age for a freshly written first touch. */
export const FIRST_TOUCH_MAX_AGE_S = 7_776_000;
export const DIRECT_UPGRADE_WINDOW_MS = 30 * 60 * 1000;

export const FIRST_TOUCH_STORAGE_KEY = "rrn_ft_v2";
export const LAST_TOUCH_STORAGE_KEY = "rrn_lt_v2";
export const FIRST_TOUCH_COOKIE = "rrn_ft";
export const LAST_TOUCH_COOKIE = "rrn_lt";
/** Pre-v2 sessionStorage key (per tab); migrated on first read. */
export const LEGACY_SESSION_KEY = "rrn_first_touch_attribution";

const MAX_VALUE = 180;
const MAX_PATH = 360;
const MAX_IN_APP = 40;

function clean(value: unknown, max = MAX_VALUE): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function toIso(ms: number): string | null {
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null;
  return new Date(ms).toISOString();
}

function isoOrNull(value: unknown): string | null {
  if (typeof value === "number") return toIso(value);
  if (typeof value !== "string" || value.length > 64) return null;
  return toIso(Date.parse(value));
}

// ---------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

/**
 * Our own hosts: apex + subdomains, localhost, and this project's own Vercel
 * previews. Any other *.vercel.app site is somebody else's and is a real
 * referrer. The Vercel project is "realryanichols-personal" (one n), so both
 * spellings are matched as a prefix.
 */
export function isOwnHost(host: string, extra: readonly string[] = []): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "0.0.0.0")
    return true;
  if (h === "realryannichols.com" || h.endsWith(".realryannichols.com")) return true;
  if (h.endsWith(".vercel.app") && /^realryann?ichols/.test(h)) return true;
  return extra.some((e) => {
    const x = normalizeHost(e);
    return Boolean(x) && (h === x || h.endsWith(`.${x}`));
  });
}

/** Payment hosts that send buyers back to us (cancel_url / success_url). */
export function isPaymentHost(host: string): boolean {
  const h = normalizeHost(host);
  return (
    h === "stripe.com" ||
    h.endsWith(".stripe.com") ||
    h === "stripe.network" ||
    h.endsWith(".stripe.network")
  );
}

// ---------------------------------------------------------------------------
// Referrer + in-app classification
// ---------------------------------------------------------------------------

type Channel = { source: string; medium: string };

const REFERRER_RULES: ReadonlyArray<readonly [RegExp, string, string]> = [
  [/^mail\.google\.com$/, "gmail", "email"],
  [/^outlook\.(live|office|office365)\.com$/, "outlook", "email"],
  [/^mail\.yahoo\.com$/, "yahoo_mail", "email"],
  [/^google\.(com?\.)?[a-z]{2,3}$/, "google", "organic"],
  [/^(cn\.)?bing\.com$/, "bing", "organic"],
  [/^duckduckgo\.com$/, "duckduckgo", "organic"],
  [/^search\.yahoo\.com$/, "yahoo", "organic"],
  [/^search\.brave\.com$/, "brave", "organic"],
  [/^ecosia\.org$/, "ecosia", "organic"],
  [/^yandex\.[a-z]{2,3}$/, "yandex", "organic"],
  [/^messenger\.com$/, "messenger", "social"],
  [/^([a-z0-9-]+\.)?facebook\.com$|^fb\.me$/, "facebook", "social"],
  [/^([a-z0-9-]+\.)?instagram\.com$/, "instagram", "social"],
  [/^(t\.co|x\.com|twitter\.com|mobile\.twitter\.com)$/, "x", "social"],
  [/^([a-z0-9-]+\.)?linkedin\.com$|^lnkd\.in$/, "linkedin", "social"],
  [/^(m\.)?youtube\.com$|^youtu\.be$/, "youtube", "social"],
  [/^([a-z0-9-]+\.)?reddit\.com$/, "reddit", "social"],
  [/^([a-z0-9-]+\.)?tiktok\.com$/, "tiktok", "social"],
  [/^([a-z0-9-]+\.)?pinterest\.(com|[a-z]{2}|co\.uk)$|^pin\.it$/, "pinterest", "social"],
  [/^threads\.(net|com)$/, "threads", "social"],
  [/^([a-z0-9-]+\.)?snapchat\.com$/, "snapchat", "social"],
  [/^(t\.me|telegram\.org|web\.telegram\.org)$/, "telegram", "social"],
  [/^(wa\.me|([a-z0-9-]+\.)?whatsapp\.com)$/, "whatsapp", "social"],
  [/^truthsocial\.com$/, "truthsocial", "social"],
  [/^rumble\.com$/, "rumble", "social"],
  [/^gab\.com$/, "gab", "social"],
  [/^gettr\.com$/, "gettr", "social"],
  [/^bsky\.app$/, "bluesky", "social"],
  [/^([a-z0-9-]+\.)?discord\.com$/, "discord", "social"],
];

const ANDROID_APP_REFERRERS: Readonly<Record<string, Channel>> = {
  "com.google.android.gm": { source: "gmail", medium: "email" },
  "com.google.android.googlequicksearchbox": { source: "google", medium: "organic" },
  "com.facebook.katana": { source: "facebook", medium: "social" },
  "com.facebook.orca": { source: "messenger", medium: "social" },
  "com.instagram.android": { source: "instagram", medium: "social" },
  "com.twitter.android": { source: "x", medium: "social" },
  "com.linkedin.android": { source: "linkedin", medium: "social" },
  "com.reddit.frontpage": { source: "reddit", medium: "social" },
  "com.zhiliaoapp.musically": { source: "tiktok", medium: "social" },
  "com.snapchat.android": { source: "snapchat", medium: "social" },
  "com.pinterest": { source: "pinterest", medium: "social" },
  "org.telegram.messenger": { source: "telegram", medium: "social" },
  "com.whatsapp": { source: "whatsapp", medium: "social" },
};

type ParsedReferrer = { host: string; androidApp: boolean };

export function parseReferrer(referrer: string | null | undefined): ParsedReferrer | null {
  if (!referrer || typeof referrer !== "string" || referrer.length > 2048) return null;
  try {
    const u = new URL(referrer);
    const host = normalizeHost(u.hostname);
    if (!host) return null;
    if (u.protocol === "http:" || u.protocol === "https:") return { host, androidApp: false };
    if (u.protocol === "android-app:") return { host, androidApp: true };
    return null;
  } catch {
    return null;
  }
}

/** Map a referrer host (or Android app package) to a source + medium. */
export function classifyReferrer(host: string, androidApp = false): Channel {
  const h = normalizeHost(host);
  if (androidApp) {
    return ANDROID_APP_REFERRERS[h] ?? { source: h.slice(0, MAX_VALUE), medium: "referral" };
  }
  for (const [pattern, source, medium] of REFERRER_RULES) {
    if (pattern.test(h)) return { source, medium };
  }
  return { source: h.slice(0, MAX_VALUE), medium: "referral" };
}

// Order matters: Instagram and Messenger before the generic Facebook tokens,
// and the generic webview checks last.
const IN_APP_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/Instagram/i, "instagram"],
  [/FBAN\/Messenger|FB_IAB\/MESSENGER|Orca-Android/i, "messenger"],
  [/FBAN\/|FBAV\/|FB_IAB\/|FBIOS|FB4A/i, "facebook"],
  [/musical_ly|BytedanceWebview|TikTok|trill_\d/i, "tiktok"],
  [/Snapchat/i, "snapchat"],
  [/LinkedInApp/i, "linkedin"],
  [/Pinterest/i, "pinterest"],
  [/\bLine\/\d/, "line"],
  [/TwitterAndroid|Twitter for iP(hone|ad)|\bTwitter\/\d/i, "x"],
  [/\bGSA\/\d/, "google_app"],
  [/; wv\)/, "webview"],
  [/\((iPhone|iPod|iPad)[^)]*\).*AppleWebKit\/[\d.]+(?!.*Safari\/)/, "webview"],
];

const IN_APP_CHANNEL: Readonly<Record<string, Channel>> = {
  instagram: { source: "instagram", medium: "social" },
  messenger: { source: "messenger", medium: "social" },
  facebook: { source: "facebook", medium: "social" },
  tiktok: { source: "tiktok", medium: "social" },
  snapchat: { source: "snapchat", medium: "social" },
  linkedin: { source: "linkedin", medium: "social" },
  pinterest: { source: "pinterest", medium: "social" },
  line: { source: "line", medium: "social" },
  x: { source: "x", medium: "social" },
  google_app: { source: "google", medium: "organic" },
};

/** Detect an in-app browser from the user agent. Crawlers never count. */
export function detectInApp(userAgent: string | null | undefined): string | null {
  if (!userAgent || typeof userAgent !== "string") return null;
  const ua = userAgent.slice(0, 1024);
  if (/bot\b|bot\/|crawler|spider|facebookexternalhit/i.test(ua)) return null;
  for (const [pattern, name] of IN_APP_RULES) {
    if (pattern.test(ua)) return name;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Landing parse
// ---------------------------------------------------------------------------

const CLICK_IDS: ReadonlyArray<{ param: string; source: string; medium: string }> = [
  { param: "gclid", source: "google", medium: "cpc" },
  { param: "gbraid", source: "google", medium: "cpc" },
  { param: "wbraid", source: "google", medium: "cpc" },
  { param: "dclid", source: "google", medium: "display" },
  { param: "msclkid", source: "bing", medium: "cpc" },
  { param: "fbclid", source: "facebook", medium: "social" },
  { param: "ttclid", source: "tiktok", medium: "social" },
  { param: "twclid", source: "x", medium: "social" },
  { param: "li_fat_id", source: "linkedin", medium: "social" },
  { param: "sccid", source: "snapchat", medium: "social" },
  { param: "epik", source: "pinterest", medium: "social" },
];

// Query params that can carry personal data (or secrets) and must never ride
// into Stripe metadata as part of landing_path.
const SENSITIVE_PARAM =
  /^(e-?mail|email_?address|mail|phone|tel|mobile|name|first_?name|last_?name|full_?name|fname|lname|address|zip|zip_?code|postal_?code|token|access_token|id_token|refresh_token|auth|code|password|pass|pwd|secret|api_?key|key|session_id|checkout_session_id|sig|signature|otp|mc_eid|_hsenc|_hsmi|ck_subscriber_id|subscriber_id|contact_id|user_id|uid)$/i;

// An email address anywhere in a value (some ESPs put it in utm_term/content).
const EMAIL_LIKE = /[^\s@/?&=]+@[^\s@/?&=]+\.[a-z]{2,}/i;

/** A query value, or null when it looks like an email address. */
function cleanParam(value: string | null | undefined): string | null {
  const v = clean(value ?? null);
  return v && EMAIL_LIKE.test(v) ? null : v;
}

/** pathname + query, minus params that look like PII. Truncated to 360. */
export function sanitizeLandingPath(url: URL): string {
  const params = url.searchParams;
  let removed = false;
  const kept = new URLSearchParams();
  params.forEach((value, key) => {
    if (SENSITIVE_PARAM.test(key) || EMAIL_LIKE.test(value)) {
      removed = true;
      return;
    }
    kept.append(key, value);
  });
  const query = removed ? (kept.toString() ? `?${kept.toString()}` : "") : url.search;
  return `${url.pathname}${query}`.slice(0, MAX_PATH);
}

export type LandingInput = {
  /** Full URL of the landing page (location.href). */
  url: string;
  /** document.referrer, or the Referer header. */
  referrer?: string | null;
  userAgent?: string | null;
  /** Epoch ms. */
  now: number;
  /** Extra hosts to treat as our own (e.g. a SITE_URL override). */
  ownHosts?: readonly string[];
};

/** Parse one landing into a touch. Always returns a touch. */
export function parseLanding(input: LandingInput): Touch {
  const now = Number.isFinite(input.now) ? input.now : 0;
  const firstSeenAt = toIso(now) ?? new Date(0).toISOString();
  let url: URL | null = null;
  try {
    url = new URL(input.url);
  } catch {
    url = null;
  }

  // Case-insensitive param lookup (UTM_SOURCE, ScCid), first value wins.
  const params = new Map<string, string>();
  url?.searchParams.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!params.has(k)) params.set(k, value);
  });
  const get = (k: string) => cleanParam(params.get(k));

  const inApp = detectInApp(input.userAgent);
  const ref = parseReferrer(input.referrer);
  const landingHost = url ? normalizeHost(url.hostname) : "";
  let internal = false;
  let refHost: string | null = null;
  let refChannel: Channel | null = null;
  if (ref) {
    if (
      isOwnHost(ref.host, input.ownHosts) ||
      (landingHost && ref.host === landingHost) ||
      isPaymentHost(ref.host)
    ) {
      internal = true;
    } else {
      refHost = ref.host.slice(0, MAX_VALUE);
      refChannel = classifyReferrer(ref.host, ref.androidApp);
    }
  }

  const utm = {
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
    content: get("utm_content"),
    term: get("utm_term"),
  };
  let click: (typeof CLICK_IDS)[number] | null = null;
  let clickId: string | null = null;
  for (const c of CLICK_IDS) {
    const v = get(c.param);
    if (v) {
      click = c;
      clickId = v;
      break;
    }
  }
  const shareHint: Channel | null =
    params.has("igshid") || params.has("igsh")
      ? { source: "instagram", medium: "social" }
      : null;
  const appHint: Channel | null = inApp ? IN_APP_CHANNEL[inApp] ?? null : null;
  // With no referrer at all (in-app browsers strip it), the app is the best
  // evidence of where the visit came from. A self/Stripe referrer means this
  // is internal navigation, so the UA says nothing about the source.
  const hint = internal ? null : appHint ?? shareHint;

  const hasCampaign = Boolean(
    utm.source || utm.medium || utm.campaign || utm.content || utm.term || clickId,
  );

  let entry: AttributionEntry;
  let source: string | null;
  let medium: string | null;
  if (hasCampaign) {
    entry = "campaign";
    let clickChannel: Channel | null = click
      ? { source: click.source, medium: click.medium }
      : null;
    // Instagram links carry fbclid too.
    if (
      click?.param === "fbclid" &&
      (inApp === "instagram" || refChannel?.source === "instagram" || shareHint)
    ) {
      clickChannel = { source: "instagram", medium: "social" };
    }
    source = utm.source ?? clickChannel?.source ?? refChannel?.source ?? hint?.source ?? null;
    medium = utm.medium ?? clickChannel?.medium ?? refChannel?.medium ?? hint?.medium ?? null;
  } else if (refChannel) {
    entry = "referral";
    source = refChannel.source;
    medium = refChannel.medium;
  } else if (hint) {
    entry = "referral";
    source = hint.source;
    medium = hint.medium;
  } else {
    entry = "direct";
    source = "direct";
    medium = "none";
  }

  return {
    source,
    medium,
    campaign: utm.campaign,
    content: utm.content,
    term: utm.term,
    clickId,
    landingPath: url ? sanitizeLandingPath(url) : "",
    referrerHost: refHost,
    entry,
    inApp,
    firstSeenAt,
  };
}

/** A direct touch for when nothing else is known (server-side fallback). */
export function directTouch(now: number, landingPath = "", inApp: string | null = null): Touch {
  return {
    source: "direct",
    medium: "none",
    campaign: null,
    content: null,
    term: null,
    clickId: null,
    landingPath: landingPath.slice(0, MAX_PATH),
    referrerHost: null,
    entry: "direct",
    inApp: clean(inApp, MAX_IN_APP),
    firstSeenAt: toIso(now) ?? new Date(0).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Validation of untrusted touches (storage, cookies, request bodies)
// ---------------------------------------------------------------------------

function isEntry(value: unknown): value is AttributionEntry {
  return value === "campaign" || value === "referral" || value === "direct";
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Re-apply the landing-path PII filter to a stored or client-sent path. */
export function sanitizePathString(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.includes("?")) return trimmed.slice(0, MAX_PATH);
  try {
    const u = new URL(trimmed, "https://path.invalid");
    if (u.origin !== "https://path.invalid") return "";
    return sanitizeLandingPath(u);
  } catch {
    return trimmed.split("?")[0].slice(0, MAX_PATH);
  }
}

/**
 * Coerce an unknown value into a Touch, or null. Strings are trimmed and
 * truncated; an invalid firstSeenAt falls back to `now` when given.
 */
export function sanitizeTouch(raw: unknown, now?: number): Touch | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!isEntry(r.entry)) return null;
  if (typeof r.landingPath !== "string") return null;
  const firstSeenAt =
    isoOrNull(r.firstSeenAt) ?? (now !== undefined ? toIso(now) : null);
  if (!firstSeenAt) return null;
  const direct = r.entry === "direct";
  return {
    source: cleanParam(textOrNull(r.source)) ?? (direct ? "direct" : null),
    medium: cleanParam(textOrNull(r.medium)) ?? (direct ? "none" : null),
    campaign: cleanParam(textOrNull(r.campaign)),
    content: cleanParam(textOrNull(r.content)),
    term: cleanParam(textOrNull(r.term)),
    clickId: cleanParam(textOrNull(r.clickId)),
    landingPath: sanitizePathString(r.landingPath),
    referrerHost: clean(r.referrerHost),
    entry: r.entry,
    inApp: clean(r.inApp, MAX_IN_APP),
    firstSeenAt,
  };
}

/** Convert a pre-v2 attribution object (sessionStorage / old clients). */
export function touchFromLegacy(
  raw: unknown,
  now: number,
  ownHosts: readonly string[] = [],
): Touch | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.landingPath !== "string") return null;
  let referrerHost = clean(r.referrerHost);
  // Old captures could record our own host or Stripe as the "referrer".
  if (referrerHost && (isOwnHost(referrerHost, ownHosts) || isPaymentHost(referrerHost))) {
    referrerHost = null;
  }
  const t = {
    source: cleanParam(textOrNull(r.source)),
    medium: cleanParam(textOrNull(r.medium)),
    campaign: cleanParam(textOrNull(r.campaign)),
    content: cleanParam(textOrNull(r.content)),
    term: cleanParam(textOrNull(r.term)),
    clickId: cleanParam(textOrNull(r.clickId)),
  };
  const hasCampaign = Object.values(t).some(Boolean);
  const channel = referrerHost ? classifyReferrer(referrerHost) : null;
  const entry: AttributionEntry = hasCampaign ? "campaign" : channel ? "referral" : "direct";
  return {
    ...t,
    source: t.source ?? channel?.source ?? (entry === "direct" ? "direct" : null),
    medium: t.medium ?? channel?.medium ?? (entry === "direct" ? "none" : null),
    landingPath: sanitizePathString(r.landingPath),
    referrerHost: referrerHost ? normalizeHost(referrerHost) : null,
    entry,
    inApp: null,
    firstSeenAt: toIso(now) ?? new Date(0).toISOString(),
  };
}

/** The pre-v2 shape, for the checkout body's backward-compatible field. */
export function toLegacyAttribution(touch: Touch | null): LegacyAttribution | null {
  if (!touch || !touch.landingPath) return null;
  return {
    source: touch.source,
    medium: touch.medium,
    campaign: touch.campaign,
    content: touch.content,
    term: touch.term,
    clickId: touch.clickId,
    landingPath: touch.landingPath,
    referrerHost: touch.referrerHost,
  };
}

// ---------------------------------------------------------------------------
// Merge rules
// ---------------------------------------------------------------------------

function isLive(record: TouchRecord | null | undefined, now: number): record is TouchRecord {
  return Boolean(record && Number.isFinite(record.expiresAt) && record.expiresAt > now);
}

/**
 * When a touch was seen, in whole seconds: the cookie keeps second precision,
 * so the cookie and localStorage copies of one record must compare equal.
 */
function seenSec(touch: Touch): number {
  const ms = Date.parse(touch.firstSeenAt);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : Number.POSITIVE_INFINITY;
}

/**
 * First touch: keep a live record; otherwise start one from `incoming`.
 * A direct record is upgraded once by a non-direct touch that arrives within
 * DIRECT_UPGRADE_WINDOW_MS of it (keeping its firstSeenAt and expiry). After
 * that it is non-direct, so it can never be replaced again until it expires.
 */
export function mergeFirstTouch(
  existing: TouchRecord | null,
  incoming: Touch | null,
  now: number,
): TouchRecord | null {
  if (!isLive(existing, now)) {
    return incoming ? { touch: incoming, expiresAt: now + FIRST_TOUCH_TTL_MS } : null;
  }
  if (incoming && existing.touch.entry === "direct" && incoming.entry !== "direct") {
    const age = now - Date.parse(existing.touch.firstSeenAt);
    if (Number.isFinite(age) && age >= 0 && age <= DIRECT_UPGRADE_WINDOW_MS) {
      return {
        touch: { ...incoming, firstSeenAt: existing.touch.firstSeenAt },
        expiresAt: existing.expiresAt,
      };
    }
  }
  return existing;
}

/** Last touch: every campaign/referral landing replaces it; direct never does. */
export function mergeLastTouch(
  existing: TouchRecord | null,
  incoming: Touch | null,
  now: number,
): TouchRecord | null {
  if (incoming && incoming.entry !== "direct") {
    return { touch: incoming, expiresAt: now + LAST_TOUCH_TTL_MS };
  }
  return isLive(existing, now) ? existing : null;
}

/**
 * Among the stores that hold a first touch, the earliest live one wins.
 * On a tie (same second) a non-direct record wins (one store saw the
 * upgrade, one did not), else the earlier candidate is kept: pass the richest
 * store first (memory, localStorage, then the size-capped cookie).
 */
export function pickFirstRecord(
  candidates: ReadonlyArray<TouchRecord | null | undefined>,
  now: number,
): TouchRecord | null {
  let best: TouchRecord | null = null;
  for (const c of candidates) {
    if (!isLive(c, now)) continue;
    if (!best) {
      best = c;
      continue;
    }
    const a = seenSec(c.touch);
    const b = seenSec(best.touch);
    const upgradeTie = a === b && best.touch.entry === "direct" && c.touch.entry !== "direct";
    if (a < b || upgradeTie) best = c;
  }
  return best;
}

/**
 * Among the stores that hold a last touch, the most recent live one wins;
 * on a tie the earlier candidate (the richer store) is kept.
 */
export function pickLastRecord(
  candidates: ReadonlyArray<TouchRecord | null | undefined>,
  now: number,
): TouchRecord | null {
  let best: TouchRecord | null = null;
  for (const c of candidates) {
    if (!isLive(c, now) || c.touch.entry === "direct") continue;
    if (!best || seenSec(c.touch) > seenSec(best.touch)) best = c;
  }
  return best;
}

// ---------------------------------------------------------------------------
// localStorage codec (JSON with expiry)
// ---------------------------------------------------------------------------

export function encodeTouchRecordJson(record: TouchRecord): string {
  return JSON.stringify({ v: 2, exp: record.expiresAt, touch: record.touch });
}

export function decodeTouchRecordJson(
  raw: string | null | undefined,
  now: number,
): TouchRecord | null {
  if (!raw || typeof raw !== "string" || raw.length > 8192) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (p.v !== 2 || typeof p.exp !== "number" || !Number.isFinite(p.exp)) return null;
    const touch = sanitizeTouch(p.touch);
    if (!touch) return null;
    const record = { touch, expiresAt: p.exp };
    return isLive(record, now) ? record : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie codec (compact base64url JSON, readable server-side)
// ---------------------------------------------------------------------------

/** Upper bound for one encoded cookie value (the whole cookie stays < 1.3KB). */
export const COOKIE_VALUE_MAX = 1200;

const COOKIE_CAPS = {
  s: 80,
  m: 60,
  c: 100,
  ct: 80,
  t: 80,
  k: 120,
  p: 160,
  r: 100,
  a: 24,
} as const;

type CompactTouch = {
  v: 2;
  e: "c" | "r" | "d";
  f: number;
  x: number;
  s?: string;
  m?: string;
  c?: string;
  ct?: string;
  t?: string;
  k?: string;
  p?: string;
  r?: string;
  a?: string;
};

const ENTRY_CODE: Record<AttributionEntry, CompactTouch["e"]> = {
  campaign: "c",
  referral: "r",
  direct: "d",
};
const CODE_ENTRY: Record<string, AttributionEntry> = {
  c: "campaign",
  r: "referral",
  d: "direct",
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function capped(value: string | null, max: number): string | undefined {
  return value ? value.slice(0, max) : undefined;
}

function compact(record: TouchRecord): CompactTouch {
  const t = record.touch;
  const out: CompactTouch = {
    v: 2,
    e: ENTRY_CODE[t.entry],
    f: Math.floor(Date.parse(t.firstSeenAt) / 1000) || 0,
    x: Math.floor(record.expiresAt / 1000),
  };
  const fields: Array<[keyof typeof COOKIE_CAPS, string | null]> = [
    ["s", t.source],
    ["m", t.medium],
    ["c", t.campaign],
    ["ct", t.content],
    ["t", t.term],
    ["k", t.clickId],
    ["p", t.landingPath],
    ["r", t.referrerHost],
    ["a", t.inApp],
  ];
  for (const [key, value] of fields) {
    const v = capped(value, COOKIE_CAPS[key]);
    if (v) out[key] = v;
  }
  return out;
}

/**
 * Encode a record for the `rrn_ft` / `rrn_lt` cookie. Values are truncated per
 * field, then the least useful fields are shed until the value fits
 * COOKIE_VALUE_MAX (multi-byte UTF-8 can blow past the per-field caps).
 */
export function encodeTouchCookie(record: TouchRecord): string {
  const c = compact(record);
  let encoded = toBase64Url(JSON.stringify(c));
  const shed: Array<(x: CompactTouch) => void> = [
    (x) => delete x.ct,
    (x) => delete x.t,
    (x) => {
      if (x.p) x.p = x.p.split("?")[0].slice(0, 80);
    },
    (x) => delete x.k,
    (x) => {
      if (x.c) x.c = x.c.slice(0, 40);
    },
    (x) => {
      if (x.r) x.r = x.r.slice(0, 40);
      if (x.a) x.a = x.a.slice(0, 12);
    },
    (x) => {
      if (x.s) x.s = x.s.slice(0, 24);
      if (x.m) x.m = x.m.slice(0, 16);
      if (x.p) x.p = x.p.slice(0, 24);
      if (x.c) x.c = x.c.slice(0, 16);
      if (x.r) x.r = x.r.slice(0, 24);
    },
  ];
  for (const step of shed) {
    if (encoded.length <= COOKIE_VALUE_MAX) break;
    step(c);
    encoded = toBase64Url(JSON.stringify(c));
  }
  return encoded;
}

/** Decode a cookie value; null for anything malformed or expired. Never throws. */
export function decodeTouchCookie(
  value: string | null | undefined,
  now: number,
): TouchRecord | null {
  if (!value || typeof value !== "string" || value.length > 4096) return null;
  const json = fromBase64Url(value);
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const c = parsed as Record<string, unknown>;
  if (c.v !== 2 || typeof c.e !== "string" || !CODE_ENTRY[c.e]) return null;
  if (typeof c.f !== "number" || typeof c.x !== "number") return null;
  if (!Number.isFinite(c.f) || !Number.isFinite(c.x)) return null;
  const expiresAt = c.x * 1000;
  const touch = sanitizeTouch({
    source: c.s,
    medium: c.m,
    campaign: c.c,
    content: c.ct,
    term: c.t,
    clickId: c.k,
    landingPath: typeof c.p === "string" ? c.p : "",
    referrerHost: c.r,
    entry: CODE_ENTRY[c.e],
    inApp: c.a,
    firstSeenAt: c.f * 1000,
  });
  if (!touch) return null;
  const record = { touch, expiresAt };
  return isLive(record, now) ? record : null;
}

/** Parse a Cookie header (or document.cookie). Garbage-tolerant. */
export function parseCookieHeader(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = Object.create(null);
  if (!header || typeof header !== "string") return out;
  for (const part of header.slice(0, 16_384).split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const key = part.slice(0, i).trim();
    if (!key || key in out) continue;
    let value = part.slice(i + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep the raw value
    }
    out[key] = value;
  }
  return out;
}

/** Serialize a first-party cookie for document.cookie. */
export function serializeTouchCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  secure: boolean,
): string {
  const maxAge = Math.max(0, Math.min(FIRST_TOUCH_MAX_AGE_S, Math.floor(maxAgeSeconds)));
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
