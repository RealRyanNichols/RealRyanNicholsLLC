"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const SESSION_KEY = "rn_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
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

export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const viewIdRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>("");
  const scrollMaxRef = useRef<number>(0);
  const lastFlushRef = useRef<number>(0);

  useEffect(() => {
    const sid = getSessionId();
    sessionIdRef.current = sid;
    if (!sid) return;

    const fullPath = pathname + (search.toString() ? `?${search.toString()}` : "");
    const ref = typeof document !== "undefined" ? document.referrer : null;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    scrollMaxRef.current = 0;
    viewIdRef.current = null;

    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("record_page_view", {
        p_session_id: sid,
        p_path: fullPath,
        p_ref: ref || null,
        p_ua: ua || null,
      })
      .then(({ data }) => {
        viewIdRef.current = typeof data === "number" ? data : null;
      });

    function touch(force = false) {
      const id = viewIdRef.current;
      if (!id) return;
      const now = Date.now();
      const scroll = Math.max(scrollMaxRef.current, getScrollPct());
      // Throttle to once per 10s unless forced (visibility change / unload).
      if (!force && now - lastFlushRef.current < 10_000) return;
      lastFlushRef.current = now;
      scrollMaxRef.current = scroll;
      void supabase.rpc("touch_page_view", { p_id: id, p_scroll_max: scroll });
    }

    function onScroll() {
      scrollMaxRef.current = Math.max(scrollMaxRef.current, getScrollPct());
      touch(false);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") touch(true);
    }
    function onPagehide() {
      touch(true);
    }
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a, button");
      if (!anchor) return;
      const label =
        anchor.getAttribute("data-track") ||
        anchor.getAttribute("aria-label") ||
        anchor.textContent?.trim().slice(0, 80) ||
        anchor.tagName.toLowerCase();
      const kind =
        anchor.tagName === "A"
          ? (anchor as HTMLAnchorElement).hostname &&
            (anchor as HTMLAnchorElement).hostname !== window.location.hostname
            ? "outbound"
            : "click"
          : "click";
      void supabase.rpc("record_page_event", {
        p_session_id: sid,
        p_kind: kind,
        p_target: label,
        p_path: fullPath,
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPagehide);
    document.addEventListener("click", onClick, { capture: true });

    const heartbeat = window.setInterval(() => touch(false), 30_000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPagehide);
      document.removeEventListener("click", onClick, { capture: true });
      window.clearInterval(heartbeat);
      touch(true);
    };
  }, [pathname, search]);

  return null;
}
