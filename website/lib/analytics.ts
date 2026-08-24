import { track as vercelTrack } from "@vercel/analytics";
import { getVisitorId } from "@/lib/client-ids";

// One call → every analytics sink we run: Vercel Web Analytics, the Meta
// Pixel, GA4, TikTok, X/Twitter, and our own first-party page_events table.
// Use this for key conversions (intent, source, subscribe, share, claim) so
// they show up everywhere at once. Safe to call anywhere client-side; each
// sink is guarded so a missing pixel never throws. Every first-party event
// also carries the persistent visitor_id, so a person is tracked across
// sessions, not just within one visit.
type Props = Record<string, string | number | boolean | null>;
const X_PURCHASE_EVENT_ID =
  process.env.NEXT_PUBLIC_TWITTER_PURCHASE_EVENT_ID;

export function trackEvent(name: string, props: Props = {}): void {
  if (typeof window === "undefined") return;

  try {
    vercelTrack(name, props);
  } catch {
    /* noop */
  }
  try {
    if (name === "purchase") {
      window.fbq?.("track", "Purchase", {
        value: props.value ?? props.amount ?? 0,
        currency: props.currency ?? "USD",
      });
    } else {
      window.fbq?.("trackCustom", name, props);
    }
  } catch {
    /* noop */
  }
  try {
    window.gtag?.("event", name, props);
  } catch {
    /* noop */
  }
  try {
    window.ttq?.track?.(name === "purchase" ? "CompletePayment" : name, props);
  } catch {
    /* noop */
  }
  try {
    if (name === "purchase") {
      if (X_PURCHASE_EVENT_ID) {
        window.twq?.("event", X_PURCHASE_EVENT_ID, {
          value: props.value ?? props.amount ?? 0,
          currency: props.currency ?? "USD",
          conversion_id: props.event_id ?? null,
        });
      }
    } else {
      window.twq?.("event", name, props);
    }
  } catch {
    /* noop */
  }
  // First-party: fold into the same page_events stream as clicks/scroll,
  // stamped with the persistent visitor_id for cross-session identity.
  try {
    const sid = window.sessionStorage.getItem("rn_session_id") ?? "";
    if (sid) {
      const body = JSON.stringify({
        session_id: sid,
        visitor_id: getVisitorId() || null,
        path: `${window.location.pathname}${window.location.search}`,
        kind: name,
        target: JSON.stringify(props).slice(0, 480),
      });
      if (navigator.sendBeacon) {
        const queued = navigator.sendBeacon(
          "/api/track-event",
          new Blob([body], { type: "application/json" }),
        );
        if (queued) return;
      }
      void fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* noop */
  }
}
