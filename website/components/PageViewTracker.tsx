"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "rn_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      ).replace(/-/g, "");
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function getScrollPct(): number {
  if (typeof window === "undefined") return 0;
  const doc = document.documentElement;
  const max = Math.max(0, doc.scrollHeight - doc.clientHeight);
  if (max <= 0) return 100;
  return Math.min(100, Math.round((window.scrollY / max) * 100));
}

// Fire-and-forget beacon to our own API route. sendBeacon is queued by
// the browser and delivered even after the page is navigated away or
// unloaded — which is exactly why dwell/scroll/click events now land
// where the old direct browser supabase.rpc() calls did not.
function beacon(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const url = "/api/track-event";
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // best-effort
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const scrollMaxRef = useRef<number>(0);
  const lastFlushRef = useRef<number>(0);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;

    const fullPath =
      pathname + (search.toString() ? `?${search.toString()}` : "");
    const ref = typeof document !== "undefined" ? document.referrer : null;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    scrollMaxRef.current = 0;
    lastFlushRef.current = 0;

    // Initial view → /api/track-pageview. The route reads Vercel's geo
    // headers + computes the daily visitor hash and creates the
    // page_views row. Dwell/scroll/clicks are then reported against
    // (session_id, path) via /api/track-event, so we never depend on
    // round-tripping the row id back to the browser.
    void fetch("/api/track-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sid,
        path: fullPath,
        ref: ref || null,
        ua: ua || null,
      }),
      keepalive: true,
    });

    // Send a dwell/scroll heartbeat (throttled) or, when kind is set, a
    // click/outbound event (always sent). Both carry the current scroll
    // depth so one click beacon also advances dwell.
    function flush(force = false, kind?: string, target?: string) {
      const now = Date.now();
      const scroll = Math.max(scrollMaxRef.current, getScrollPct());
      scrollMaxRef.current = scroll;
      if (!kind && !force && now - lastFlushRef.current < 10_000) return;
      lastFlushRef.current = now;
      beacon({
        session_id: sid,
        path: fullPath,
        scroll,
        ...(kind ? { kind, target } : {}),
      });
    }

    function onScroll() {
      scrollMaxRef.current = Math.max(scrollMaxRef.current, getScrollPct());
      flush(false);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush(true);
    }
    function onPagehide() {
      flush(true);
    }
    function onClick(e: MouseEvent) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const anchor = t.closest("a, button");
      if (!anchor) return;
      const label =
        anchor.getAttribute("data-track") ||
        anchor.getAttribute("aria-label") ||
        anchor.textContent?.trim().slice(0, 80) ||
        anchor.tagName.toLowerCase();
      const isOutbound =
        anchor.tagName === "A" &&
        !!(anchor as HTMLAnchorElement).hostname &&
        (anchor as HTMLAnchorElement).hostname !== window.location.hostname;
      flush(true, isOutbound ? "outbound" : "click", label);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPagehide);
    document.addEventListener("click", onClick, { capture: true });
    const heartbeat = window.setInterval(() => flush(false), 30_000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPagehide);
      document.removeEventListener("click", onClick, { capture: true });
      window.clearInterval(heartbeat);
      flush(true);
    };
  }, [pathname, search]);

  return null;
}
