"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Find Your Case — the "am I in here?" search over 1,571 J6 defendants.
// Debounced live search against /api/j6/search; result cards deep-link to
// /case/people/[slug] with a claim CTA for unclaimed profiles and a share
// button per result. `embed` mode drops site-internal navigation styling and
// opens everything in a new tab so the widget works inside an iframe.

type Result = {
  slug: string;
  name: string;
  role: string | null;
  case_number: string | null;
  claim_status: "unclaimed" | "verified" | "pending" | null;
  blurb: string;
  image_url: string;
  image_kind: "portrait" | "archive-card";
};

const STATUS_LABEL: Record<string, string> = {
  verified: "Claimed & verified",
  pending: "Claim pending",
  unclaimed: "Unclaimed — free to claim",
};

export function FindYourCase({ embed = false }: { embed?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setTotal(0);
      setBusy(false);
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(async () => {
      const mySeq = ++seq.current;
      try {
        const res = await fetch(`/api/j6/search?q=${encodeURIComponent(query)}`);
        const json = (await res.json()) as { results?: Result[]; total?: number };
        if (mySeq !== seq.current) return; // a newer keystroke superseded us
        setResults(json.results ?? []);
        setTotal(json.total ?? 0);
        setTouched(true);
        trackEvent("j6_search", { q: query.slice(0, 40), hits: json.total ?? 0 });
      } catch {
        if (mySeq === seq.current) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (mySeq === seq.current) setBusy(false);
      }
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [q]);

  function share(r: Result) {
    const url = `https://realryannichols.com/case/people/${r.slug}`;
    const text = `${r.name} — January 6 case profile. The record, free and public.`;
    if (navigator.share) {
      navigator.share({ title: r.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard
        ?.writeText(url)
        .then(() => {
          setCopiedSlug(r.slug);
          setTimeout(() => setCopiedSlug(null), 2000);
        })
        .catch(() => {});
    }
    trackEvent("j6_result_share", { slug: r.slug });
  }

  const target = embed ? "_blank" : undefined;

  return (
    <div className="rounded-2xl border-2 border-[var(--color-navy)]/25 bg-[var(--color-surface)] p-4 sm:p-5">
      <label
        htmlFor="fyc-q"
        className="block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-navy)]"
      >
        Find your case — 1,571 J6 defendants indexed
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="fyc-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, case number, or role… (e.g. Nichols, 1:21-cr-00117)"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-navy)]"
          autoComplete="off"
        />
      </div>

      {busy ? (
        <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]" aria-live="polite">
          Searching the record…
        </p>
      ) : null}

      {!busy && touched && q.trim().length >= 2 && results.length === 0 ? (
        <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          No match on that spelling. Try last name only — and if you or your
          family member still isn&apos;t here,{" "}
          <a
            href="https://realryannichols.com/j6"
            target={target}
            rel={embed ? "noopener noreferrer" : undefined}
            className="font-bold text-[var(--color-navy)] underline underline-offset-2"
          >
            tell us and we&apos;ll add the profile free
          </a>
          .
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {results.map((r) => (
            <li
              key={r.slug}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5"
            >
              <div className="flex gap-3">
                <a
                  href={`https://realryannichols.com/case/people/${r.slug}`}
                  target={target}
                  rel={embed ? "noopener noreferrer" : undefined}
                  className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[#071123]"
                  aria-label={`Open ${r.name}'s free public profile`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image_url}
                    alt={
                      r.image_kind === "portrait"
                        ? `${r.name} profile photograph`
                        : `Archive identity card for ${r.name}; portrait needed`
                    }
                    className={[
                      "h-full w-full",
                      r.image_kind === "portrait"
                        ? "object-cover object-top"
                        : "object-contain",
                    ].join(" ")}
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a
                        href={`https://realryannichols.com/case/people/${r.slug}`}
                        target={target}
                        rel={embed ? "noopener noreferrer" : undefined}
                        className="text-base font-black text-[var(--color-ink)] underline-offset-2 hover:underline"
                      >
                        {r.name}
                      </a>
                      <p className="mt-0.5 text-xs font-semibold text-[var(--color-muted)]">
                        {r.case_number ? `Case ${r.case_number} · ` : ""}
                        {STATUS_LABEL[r.claim_status ?? ""] ?? "On the record"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {r.claim_status === "unclaimed" ? (
                        <a
                          href={`https://realryannichols.com/case/people/${r.slug}/claim`}
                          target={target}
                          rel={embed ? "noopener noreferrer" : undefined}
                          className="rounded-md bg-[var(--color-navy)] px-3 py-1.5 text-xs font-black text-[#fdf8ea] transition hover:bg-[var(--color-blue-strong)]"
                        >
                          This you? Claim it free
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => share(r)}
                        className="rounded-md border border-[var(--color-navy)]/40 px-3 py-1.5 text-xs font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
                        aria-live="polite"
                      >
                        {copiedSlug === r.slug ? "Link copied ✓" : "Share"}
                      </button>
                    </div>
                  </div>
                  {r.blurb ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-[var(--color-ink-soft)]">
                      {r.blurb}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {total > results.length ? (
        <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">
          Showing {results.length} of {total} matches — keep typing to narrow it.
        </p>
      ) : null}

      {embed ? (
        <p className="mt-3 border-t border-[var(--color-line)] pt-2 text-[11px] font-semibold text-[var(--color-muted)]">
          Powered by{" "}
          <a
            href="https://realryannichols.com/case"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-[var(--color-navy)]"
          >
            The J6 Case Archive · realryannichols.com
          </a>
        </p>
      ) : null}
    </div>
  );
}
