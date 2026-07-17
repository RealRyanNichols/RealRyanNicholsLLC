"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

// The Share Card Generator UI. Type a headline, pick a style, watch the real
// card render live (the preview IS the /og/make output — what you see is the
// exact PNG you download). Client-only form; the pixels come from the server.

type Style = "dark" | "cream";

const FIELD =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-navy)]";

const LABEL =
  "block text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]";

const PRESETS: { label: string; title: string; sub: string; stat?: string; statLabel?: string }[] = [
  {
    label: "The archive",
    title: "Every case. Every clue. One record.",
    sub: "1,571 January 6 defendants indexed — open, sourced, and free at realryannichols.com/case.",
  },
  {
    label: "1,463 days",
    title: "Detained 1,463 days. Pardoned. Dismissed with prejudice.",
    sub: "The full federal record of United States v. Nichols — preserved and public.",
    stat: "1,463",
    statLabel: "Days detained",
  },
  {
    label: "Demand the tape",
    title: "Release the bodycam.",
    sub: "Free tool: a correctly-formatted records request in 60 seconds. No lawyer needed.",
  },
];

const DEFAULT_PRESET = PRESETS[0]!;

export function ShareCardTool() {
  const [title, setTitle] = useState(DEFAULT_PRESET.title);
  const [sub, setSub] = useState(DEFAULT_PRESET.sub);
  const [stat, setStat] = useState("");
  const [statLabel, setStatLabel] = useState("");
  const [style, setStyle] = useState<Style>("dark");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce the preview URL so the card doesn't re-render per keystroke.
  const [previewSrc, setPreviewSrc] = useState("");
  const timer = useRef<number | undefined>(undefined);

  const cardPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("title", title.trim() || "The record doesn't lie.");
    if (sub.trim()) params.set("sub", sub.trim());
    if (stat.trim()) params.set("stat", stat.trim());
    if (stat.trim() && statLabel.trim()) params.set("statLabel", statLabel.trim());
    params.set("style", style);
    return `/og/make?${params.toString()}`;
  }, [title, sub, stat, statLabel, style]);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreviewSrc(cardPath), 450);
    return () => window.clearTimeout(timer.current);
  }, [cardPath]);

  async function download() {
    if (busy) return;
    setBusy(true);
    trackEvent("share_card_download", { style });
    try {
      const res = await fetch(cardPath);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "rrn-share-card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      // If the fetch fails, open the image directly as a fallback.
      window.open(cardPath, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    const abs = `${window.location.origin}${cardPath}`;
    navigator.clipboard
      ?.writeText(abs)
      .then(() => {
        trackEvent("share_card_copy_link", { style });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  function applyPreset(p: (typeof PRESETS)[number]) {
    setTitle(p.title);
    setSub(p.sub);
    setStat(p.stat ?? "");
    setStatLabel(p.statLabel ?? "");
    trackEvent("share_card_preset", { preset: p.label });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      {/* Form */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="sc-title" className={LABEL}>
              Headline
            </label>
            <textarea
              id="sc-title"
              rows={2}
              maxLength={110}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${FIELD} mt-1.5 resize-none font-bold`}
              placeholder="Say the thing. Short and heavy."
            />
          </div>
          <div>
            <label htmlFor="sc-sub" className={LABEL}>
              Subhead <span className="font-semibold normal-case">(optional)</span>
            </label>
            <textarea
              id="sc-sub"
              rows={2}
              maxLength={200}
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className={`${FIELD} mt-1.5 resize-none`}
              placeholder="One supporting line. Receipts, not adjectives."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sc-stat" className={LABEL}>
                Big number <span className="font-semibold normal-case">(optional)</span>
              </label>
              <input
                id="sc-stat"
                maxLength={16}
                value={stat}
                onChange={(e) => setStat(e.target.value)}
                className={`${FIELD} mt-1.5 font-bold`}
                placeholder="1,463"
              />
            </div>
            <div>
              <label htmlFor="sc-stat-label" className={LABEL}>
                Number label
              </label>
              <input
                id="sc-stat-label"
                maxLength={44}
                value={statLabel}
                onChange={(e) => setStatLabel(e.target.value)}
                className={`${FIELD} mt-1.5`}
                placeholder="Days detained"
              />
            </div>
          </div>
          <div>
            <span className={LABEL}>Style</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["dark", "cream"] as Style[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  aria-pressed={style === s}
                  className={[
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-black capitalize transition",
                    style === s
                      ? "border-[var(--color-navy)] bg-[var(--color-blue-soft)] text-[var(--color-navy)]"
                      : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)]",
                  ].join(" ")}
                >
                  {s === "dark" ? "Dark board" : "Cream paper"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="btn-accent rounded-lg px-5 py-2.5 text-sm font-black disabled:opacity-60"
          >
            {busy ? "Rendering…" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border-2 border-[var(--color-navy)]/40 px-4 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
            aria-live="polite"
          >
            {copied ? "Link copied ✓" : "Copy image link"}
          </button>
        </div>
      </div>

      {/* Live preview — this IS the PNG */}
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
          Live preview · 1200×630 — exactly what downloads
        </p>
        <div className="overflow-hidden rounded-xl border-2 border-[var(--color-navy)]/20 bg-[#071126] shadow-md">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Live share-card preview"
              className="block aspect-[1200/630] w-full"
            />
          ) : (
            <div className="grid aspect-[1200/630] w-full place-items-center text-sm font-bold text-[#7c8aa6]">
              Rendering…
            </div>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
          Post it anywhere — X, Facebook, Instagram, texts. Every card carries
          the site mark, so the receipt travels with its source.
        </p>
      </div>
    </div>
  );
}
