"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CaseEntityType } from "@/lib/case";

export function CaseViewTracker({
  type,
  slug,
}: {
  type: CaseEntityType;
  slug: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `case-view-counted:${type}:${slug}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
    } catch {
      // ignore
    }
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("increment_case_views", { p_type: type, p_slug: slug })
      .then(() => {
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      });
  }, [type, slug]);

  return null;
}
