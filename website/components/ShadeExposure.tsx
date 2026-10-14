"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getSessionId } from "@/lib/client-ids";
import { SHADE_BOOT_SCRIPT, isShade } from "@/lib/shade";

const LOGGED_KEY = "rrn_shade_logged";

// One `shade_exposure` event per browser session, carrying the shade the
// boot script in app/layout.tsx assigned. /admin/shade-test joins it to the
// session's page views and events by session_id. Back-office and embed
// pages are not part of the test.
export function ShadeExposure() {
  const pathname = usePathname();

  useEffect(() => {
    // The boot script runs once per full page load. A client-side hop to a
    // ?shade= preview link (the /admin/shade-test links) runs the same
    // script again so the preview applies without a reload.
    if (/[?&]shade=/.test(window.location.search)) {
      try {
        new Function(SHADE_BOOT_SCRIPT)();
      } catch {
        /* the theater stays */
      }
    }
    if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) return;
    const shade = document.documentElement.getAttribute("data-shade");
    if (!isShade(shade)) return;
    try {
      if (window.sessionStorage.getItem(LOGGED_KEY) === shade) return;
      // trackEvent only writes first-party rows once a session id exists.
      if (!getSessionId()) return;
      window.sessionStorage.setItem(LOGGED_KEY, shade);
    } catch {
      return;
    }
    trackEvent("shade_exposure", { shade });
  }, [pathname]);

  return null;
}
