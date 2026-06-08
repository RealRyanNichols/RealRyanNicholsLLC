"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Live keyword search box. Debounced typeahead hits /api/search and shows a
// dropdown of the top matches; Enter (or "See all results") goes to /search.
type Hit = {
  slug: string;
  type: string;
  title: string | null;
  category: string | null;
  tags: string[] | null;
  excerpt: string | null;
};

function typeLabel(type: string): string {
  return type === "video"
    ? "Video"
    : type === "photo"
      ? "Photo"
      : type === "note"
        ? "Note"
        : "Article";
}

export function SearchBox({
  initialQuery = "",
  autoFocus = false,
  placeholder = "Search articles, videos, the case…",
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced live search.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&limit=8`,
          { signal: ctrl.signal },
        );
        const j = (await res.json()) as { results?: Hit[] };
        setHits(j.results ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline — ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length >= 1) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          >
            {/* magnifier */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => hits && setOpen(true)}
            autoFocus={autoFocus}
            placeholder={placeholder}
            aria-label="Search the site"
            className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>
      </form>

      {showDropdown ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-xl">
          {loading && !hits ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted)]">Searching…</p>
          ) : hits && hits.length > 0 ? (
            <ul className="max-h-[60vh] overflow-auto">
              {hits.map((h) => (
                <li key={h.slug}>
                  <Link
                    href={`/posts/${h.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 transition hover:bg-[var(--color-surface-2)]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="shrink-0 rounded-full border border-[var(--color-line)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--color-muted)]">
                        {typeLabel(h.type)}
                      </span>
                      <span className="line-clamp-1 text-sm font-bold text-[var(--color-ink)]">
                        {h.title ?? h.slug}
                      </span>
                    </span>
                    {h.excerpt ? (
                      <span className="mt-0.5 block line-clamp-1 text-xs text-[var(--color-muted)]">
                        {h.excerpt}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/search?q=${encodeURIComponent(q.trim())}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-surface-2)]"
                >
                  See all results →
                </Link>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-[var(--color-muted)]">
              No matches yet. Press Enter to search everything.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
