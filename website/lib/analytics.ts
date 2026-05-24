import { track as vercelTrack } from "@vercel/analytics";

// One call → every analytics sink we run: Vercel Web Analytics, the Meta
// Pixel, GA4, and our own first-party page_events table. Use this for key
// conversions (donate click, subscribe, share, claim) so they show up
// everywhere at once. Safe to call anywhere client-side; each sink is
// guarded so a missing pixel never throws.
type Props = Record<string, string | number | boolean>;

export function trackEvent(name: string, props: Props = {}): void {
  if (typeof window === "undefined") return;

  try {
    vercelTrack(name, props);
  } catch {
    /* noop */
  }
  try {
    window.fbq?.("trackCustom", name, props);
  } catch {
    /* noop */
  }
  try {
    window.gtag?.("event", name, props);
  } catch {
    /* noop */
  }
  // First-party: fold into the same page_events stream as clicks/scroll.
  try {
    const sid = window.sessionStorage.getItem("rn_session_id") ?? "";
    if (sid) {
      const body = JSON.stringify({
        session_id: sid,
        path: window.location.pathname,
        kind: name,
        target: JSON.stringify(props).slice(0, 480),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track-event",
          new Blob([body], { type: "application/json" }),
        );
      }
    }
  } catch {
    /* noop */
  }
}
