"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `view-counted:${slug}`;
    // Dedupe by session — a refresh or revisit in the same tab/session
    // doesn't re-count.
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(key)) return;
    } catch {
      // If sessionStorage is unavailable, fall through and increment anyway.
    }
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("increment_post_views", { post_slug: slug })
      .then(() => {
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      });
  }, [slug]);

  return null;
}
