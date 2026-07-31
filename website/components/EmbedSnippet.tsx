"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// One embeddable widget: live preview + the copy-paste iframe snippet.
export function EmbedSnippet({
  title,
  blurb,
  path,
  height,
}: {
  title: string;
  blurb: string;
  path: string;
  height: number;
}) {
  const [copied, setCopied] = useState(false);
  const src = `https://realryannichols.com${path}`;
  const snippet = `<iframe src="${src}" width="100%" height="${height}" style="border:0;max-width:680px" loading="lazy" title="${title}"></iframe>`;

  function copy() {
    navigator.clipboard
      ?.writeText(snippet)
      .then(() => {
        trackEvent("embed_snippet_copy", { path });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
      <h2 className="font-display text-xl font-black text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{blurb}</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--color-line)]">
        <iframe
          src={path}
          width="100%"
          height={height}
          style={{ border: 0 }}
          loading="lazy"
          title={`${title} preview`}
        />
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
          Paste this anywhere HTML works
        </p>
        <pre className="mt-1.5 overflow-x-auto rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 text-xs leading-relaxed text-[var(--color-ink)]">
          {snippet}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="mt-2 rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-black text-[#fdf8ea] transition hover:bg-[var(--color-blue-strong)]"
          aria-live="polite"
        >
          {copied ? "Copied ✓" : "Copy embed code"}
        </button>
      </div>
    </section>
  );
}
