"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { SITE } from "@/lib/site";

// Inline "demand an investigation" block, embedded via the {{demand}} shortcode.
// One tap to copy or post a pre-written call to the people who can act.
export function DemandAction({ slug }: { slug?: string }) {
  const [copied, setCopied] = useState(false);
  const url = slug ? `${SITE.url}/posts/${slug}` : SITE.url;
  const msg = `3.9M people have now read how D.C. Jail officers treated pretrial detainees — Americans presumed innocent. @TheJusticeDept Civil Rights Division, @Jim_Jordan, @RepTroyNehls: investigate Lt. Crystal Lancaster and Lt. Telly Allen under 18 U.S.C. §§ 241–242. The body-cam exists. The record is here: ${url}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(msg)}`;

  function copy() {
    try {
      navigator.clipboard?.writeText(msg);
      setCopied(true);
      trackEvent("demand_copy", {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="not-prose rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] p-6">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Demand an investigation
      </p>
      <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
        One tap. Put it in front of the people who can act.
      </h3>
      <p className="mt-3 text-sm leading-relaxed opacity-90 border-l-2 border-[var(--color-accent)] pl-3">
        {msg}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("demand_share_x", {})}
          className="rounded-full bg-[var(--color-accent)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)] transition"
        >
          Post the demand on X →
        </a>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border-2 border-white/40 px-5 py-2.5 text-sm font-bold text-[var(--color-paper)] hover:border-[var(--color-accent)] transition"
        >
          {copied ? "Copied ✓" : "Copy the text"}
        </button>
      </div>
    </div>
  );
}
