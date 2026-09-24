import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_STORAGE_KEY,
  FIRST_TOUCH_TTL_MS,
  LAST_TOUCH_COOKIE,
  LAST_TOUCH_STORAGE_KEY,
  LAST_TOUCH_TTL_MS,
  LEGACY_SESSION_KEY,
  decodeTouchCookie,
  decodeTouchRecordJson,
  encodeTouchCookie,
  encodeTouchRecordJson,
  mergeFirstTouch,
  mergeLastTouch,
  parseCookieHeader,
  parseLanding,
  pickFirstRecord,
  pickLastRecord,
  serializeTouchCookie,
  toLegacyAttribution,
  touchFromLegacy,
  type LegacyAttribution,
  type Touch,
  type TouchRecord,
} from "./attribution";

/**
 * Browser glue for first/last-touch attribution. The rules live in
 * lib/attribution.ts; this file only reads and writes the stores:
 * localStorage (`rrn_ft_v2`, `rrn_lt_v2`) and first-party cookies (`rrn_ft`,
 * `rrn_lt`) so the touch survives tab close, new tabs and later days, and the
 * checkout route can read it server-side. Every storage access is guarded:
 * Safari private mode and in-app webviews can throw on any of them.
 */

export type AcquisitionAttribution = LegacyAttribution;
export type CheckoutAttribution = { firstTouch: Touch | null; lastTouch: Touch | null };

// Per-document state. Nothing touches window at module scope (SSR-safe).
let landingSeen = false;
let memoryFirst: TouchRecord | null = null;
let memoryLast: TouchRecord | null = null;

function localGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function localSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readCookies(): Record<string, string> {
  try {
    return parseCookieHeader(document.cookie);
  } catch {
    return parseCookieHeader(null);
  }
}

function writeCookie(name: string, record: TouchRecord, now: number): void {
  try {
    document.cookie = serializeTouchCookie(
      name,
      encodeTouchCookie(record),
      (record.expiresAt - now) / 1000,
      window.location.protocol === "https:",
    );
  } catch {
    // best effort
  }
}

/** The pre-v2 per-tab first touch, if this tab still has one. */
function readLegacy(now: number): Touch | null {
  try {
    const raw = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw || raw.length > 8192) return null;
    return touchFromLegacy(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

function dropLegacy(): void {
  try {
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Record this page load's touch and return the persisted first and last
 * touches. The first call per document is the landing (URL + referrer +
 * user agent); later client-side route changes only count when their URL
 * carries campaign params, because document.referrer does not change on
 * client navigation. Safe to call on every route change.
 */
export function captureAttribution(): CheckoutAttribution {
  if (typeof window === "undefined") return { firstTouch: null, lastTouch: null };
  try {
    const now = Date.now();
    const isLanding = !landingSeen;
    landingSeen = true;
    const incoming = parseLanding({
      url: window.location.href,
      referrer: isLanding ? document.referrer : `${window.location.origin}/`,
      userAgent: navigator.userAgent,
      now,
    });
    const candidate = isLanding || incoming.entry === "campaign" ? incoming : null;

    const cookies = readCookies();
    // A v2 record always beats the legacy one: the legacy touch has no real
    // timestamp, so it only fills an empty slot.
    const legacy = readLegacy(now);
    const storedFirst = pickFirstRecord(
      [
        memoryFirst,
        decodeTouchRecordJson(localGet(FIRST_TOUCH_STORAGE_KEY), now),
        decodeTouchCookie(cookies[FIRST_TOUCH_COOKIE], now),
      ],
      now,
    );
    const storedLast = pickLastRecord(
      [
        memoryLast,
        decodeTouchRecordJson(localGet(LAST_TOUCH_STORAGE_KEY), now),
        decodeTouchCookie(cookies[LAST_TOUCH_COOKIE], now),
      ],
      now,
    );
    const existingFirst =
      storedFirst ?? (legacy ? { touch: legacy, expiresAt: now + FIRST_TOUCH_TTL_MS } : null);
    const existingLast =
      storedLast ??
      (legacy && legacy.entry !== "direct"
        ? { touch: legacy, expiresAt: now + LAST_TOUCH_TTL_MS }
        : null);

    const first = mergeFirstTouch(existingFirst, candidate, now);
    const last = mergeLastTouch(existingLast, candidate, now);
    memoryFirst = first;
    memoryLast = last;

    // Rewrite on every call: it keeps localStorage and the cookie in sync,
    // and re-arms Safari's 7-day cap on script-written cookies. Expiry is
    // fixed by the record, so rewriting never extends it.
    let saved = false;
    if (first) {
      saved = localSet(FIRST_TOUCH_STORAGE_KEY, encodeTouchRecordJson(first));
      writeCookie(FIRST_TOUCH_COOKIE, first, now);
    }
    if (last) {
      localSet(LAST_TOUCH_STORAGE_KEY, encodeTouchRecordJson(last));
      writeCookie(LAST_TOUCH_COOKIE, last, now);
    }
    if (legacy && saved) dropLegacy();

    return { firstTouch: first?.touch ?? null, lastTouch: last?.touch ?? null };
  } catch {
    return {
      firstTouch: memoryFirst?.touch ?? null,
      lastTouch: memoryLast?.touch ?? null,
    };
  }
}

/** First and last touch for a checkout request (captures the current page). */
export function getCheckoutAttribution(): CheckoutAttribution {
  return captureAttribution();
}

/** Save the first touch for later pages; returns it in the pre-v2 shape. */
export function captureFirstTouchAttribution(): AcquisitionAttribution | null {
  return toLegacyAttribution(captureAttribution().firstTouch);
}

/** Return the persisted first touch (pre-v2 shape), capturing if needed. */
export function getFirstTouchAttribution(): AcquisitionAttribution | null {
  return captureFirstTouchAttribution();
}
