import { isShade, type Shade } from "@/lib/shade";

// Pure scoring for the shade test (lib/shade.ts). app/admin/shade-test does
// the reads; this turns rows into one comparable line per shade.
//
// Most raw sessions on this site are automated (since September 2026 the
// first-party table is dominated by desktop sessions with a few seconds of
// dwell and one page). Bots that run JavaScript get a shade like anyone else,
// so they dilute both arms equally. The verdict uses ENGAGED sessions only:
// at least ENGAGED_DWELL_SECONDS on a page, or any click or video play.

export const ENGAGED_DWELL_SECONDS = 10;

export type ExposureRow = { session_id: string; target: string | null };
export type ViewRow = {
  session_id: string;
  started_at: string;
  last_activity_at: string | null;
  scroll_max: number | null;
};
export type EventRow = { session_id: string; kind: string };

export type ShadeLine = {
  shade: Shade;
  sessions: number;
  engaged: number;
  engagedRate: number; // 0..1
  pagesPerEngaged: number;
  medianDwellEngaged: number; // seconds
  scroll75Rate: number; // share of engaged sessions that reached 75% on any page
  clicksPer100: number; // per 100 engaged sessions
  videoPlaysPer100: number;
  conversions: number; // list signups, checkout starts, purchases (CONVERSION_KINDS)
};

// The money and list events the site already fires (grep trackEvent).
const CONVERSION_KINDS = new Set([
  "subscribe_success",
  "book_checkout_start",
  "book_signup_success",
  "checkout_start",
  "blueprint_checkout_start",
  "support_checkout_open",
  "purchase",
  "follow_capture_success",
  "tip_submit_success",
]);

/** The shade an exposure row carries ({"shade":"dusk"}), or null. */
export function shadeOf(target: string | null): Shade | null {
  if (!target) return null;
  try {
    const parsed = JSON.parse(target) as { shade?: unknown };
    return isShade(parsed.shade) ? parsed.shade : null;
  } catch {
    return null;
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function dwellSeconds(view: ViewRow): number {
  if (!view.last_activity_at) return 0;
  const ms = Date.parse(view.last_activity_at) - Date.parse(view.started_at);
  // One tab left open overnight should not decide a color test.
  return Number.isFinite(ms) ? Math.min(Math.max(ms / 1000, 0), 30 * 60) : 0;
}

export function scoreShades(
  exposures: ExposureRow[],
  views: ViewRow[],
  events: EventRow[],
): ShadeLine[] {
  // A session keeps the first shade it logged (a mid-session ?shade= preview
  // does not move it to another arm).
  const shadeBySession = new Map<string, Shade>();
  for (const row of exposures) {
    const shade = shadeOf(row.target);
    if (shade && !shadeBySession.has(row.session_id)) shadeBySession.set(row.session_id, shade);
  }

  type Acc = { views: ViewRow[]; clicks: number; plays: number; conversions: number };
  const bySession = new Map<string, Acc>();
  const acc = (sid: string): Acc => {
    let a = bySession.get(sid);
    if (!a) {
      a = { views: [], clicks: 0, plays: 0, conversions: 0 };
      bySession.set(sid, a);
    }
    return a;
  };
  for (const v of views) if (shadeBySession.has(v.session_id)) acc(v.session_id).views.push(v);
  for (const e of events) {
    if (!shadeBySession.has(e.session_id)) continue;
    if (e.kind === "click") acc(e.session_id).clicks++;
    else if (e.kind === "video_play") acc(e.session_id).plays++;
    else if (CONVERSION_KINDS.has(e.kind)) acc(e.session_id).conversions++;
  }

  const lines = new Map<Shade, { sessions: number; engaged: Acc[] }>();
  for (const [sid, shade] of shadeBySession) {
    const line = lines.get(shade) ?? { sessions: 0, engaged: [] };
    line.sessions++;
    const a = bySession.get(sid);
    if (a) {
      const longest = Math.max(0, ...a.views.map(dwellSeconds));
      if (longest >= ENGAGED_DWELL_SECONDS || a.clicks > 0 || a.plays > 0) line.engaged.push(a);
    }
    lines.set(shade, line);
  }

  return [...lines.entries()]
    .map(([shade, { sessions, engaged }]) => {
      const n = engaged.length;
      const per100 = (count: number) => (n ? Math.round((count / n) * 1000) / 10 : 0);
      return {
        shade,
        sessions,
        engaged: n,
        engagedRate: sessions ? n / sessions : 0,
        pagesPerEngaged: n ? engaged.reduce((s, a) => s + a.views.length, 0) / n : 0,
        medianDwellEngaged: median(
          engaged.map((a) => a.views.reduce((s, v) => s + dwellSeconds(v), 0)),
        ),
        scroll75Rate: n
          ? engaged.filter((a) => a.views.some((v) => (v.scroll_max ?? 0) >= 75)).length / n
          : 0,
        clicksPer100: per100(engaged.reduce((s, a) => s + a.clicks, 0)),
        videoPlaysPer100: per100(engaged.reduce((s, a) => s + a.plays, 0)),
        conversions: engaged.reduce((s, a) => s + a.conversions, 0),
      };
    })
    .sort((a, b) => a.shade.localeCompare(b.shade));
}

/**
 * Two-proportion z-test on the engaged rate of `arm` against `control`.
 * |z| >= 1.96 is the usual 95% bar. Returns null when either arm is too thin
 * to say anything (fewer than `minPerArm` sessions).
 */
export function engagedRateZ(
  control: ShadeLine | undefined,
  arm: ShadeLine | undefined,
  minPerArm = 200,
): number | null {
  if (!control || !arm) return null;
  if (control.sessions < minPerArm || arm.sessions < minPerArm) return null;
  const pooled = (control.engaged + arm.engaged) / (control.sessions + arm.sessions);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / control.sessions + 1 / arm.sessions));
  if (!se) return null;
  return (arm.engagedRate - control.engagedRate) / se;
}
