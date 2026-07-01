"use client";

import { useEffect } from "react";

// Registers the service worker so the site is installable (PWA) — the base for
// packaging to the app stores.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* best-effort */
      });
    }
  }, []);
  return null;
}
