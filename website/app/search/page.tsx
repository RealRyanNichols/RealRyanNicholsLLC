import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { SearchBox } from "@/components/SearchBox";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Hit = {
  slug: string;
  type: string;
  title: string | null;
  category: string | null;
  tags: string[] | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

// Common entry points so the page is useful before you type anything.
const SUGGESTED = [
  "January 6",
  "Censorship",
  "Harassment",
  "Deadly conduct",
  "Bond",
  "FBI",
  "Wall of Shame",
  "Free speech",
];

function typeLabel(type: string): string {
  return type === "video"
    ? "Video"
    : type === "photo"
      ? "Photo"
      : type === "note"
        ? "Note"
        : "Article";
}

function readQuery(sp: Record<string, string | string[] | undefined>): string {
  const raw = sp.q;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (v ?? "").trim().slice(0, 120);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const q = readQuery(await searchParams);
  const title = q ? `Search: ${q}` : "Search the record";
  return {
    title,
    description:
      "Search every article, post, and video on RealRyanNichols.com — by keyword, person, court term, or topic.",
    alternates: { canonical: `${SITE.url}/search` },
    // Internal search-result pages shouldn't be indexed (thin/duplicate); the
    // underlying articles are indexed on their own canonical URLs.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = readQuery(await searchParams);

  let results: Hit[] = [];
  if (q.length >= 2) {
    const supabase = getSupabaseStaticClient();
    const { data } = await supabase.rpc("search_posts", { q, max_results: 50 });
    results = (data ?? []) as Hit[];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Search
      </p>
      <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
        Find anything in the record.
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
        Every article, post, and video — searchable by keyword, person, court
        term, or topic. Type a name, a charge, an agency, a date.
      </p>

      <div className="mt-5">
        <SearchBox initialQuery={q} autoFocus />
      </div>

      {/* Quick topics */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            {t}
          </Link>
        ))}
      </div>

      {q.length >= 2 ? (
        <div className="mt-8">
          <p className="text-sm text-[var(--color-muted)]">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-bold text-[var(--color-ink)]">“{q}”</span>
          </p>

          {results.length > 0 ? (
            <ul className="mt-4 divide-y divide-[var(--color-line)]">
              {results.map((r) => (
                <li key={r.slug} className="py-4">
                  <Link href={`/posts/${r.slug}`} className="group block">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                      <span className="rounded-full border border-[var(--color-line)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide">
                        {typeLabel(r.type)}
                      </span>
                      {r.category ? (
                        <span className="uppercase tracking-wider">{r.category}</span>
                      ) : null}
                      {r.published_at ? (
                        <>
                          <span aria-hidden>·</span>
                          <time dateTime={r.published_at}>
                            {format(new Date(r.published_at), "MMM d, yyyy")}
                          </time>
                        </>
                      ) : null}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-black leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                      {r.title ?? r.slug}
                    </h2>
                    {r.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        {r.excerpt}
                      </p>
                    ) : null}
                  </Link>
                  {r.tags && r.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.tags.slice(0, 6).map((tag) => (
                        <Link
                          key={tag}
                          href={`/search?q=${encodeURIComponent(tag)}`}
                          className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-ink-soft)] transition hover:text-[var(--color-accent)]"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
              <p className="font-bold text-[var(--color-ink)]">No matches for “{q}.”</p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                Try a person&apos;s name, a charge, an agency, or a single
                keyword. Or browse{" "}
                <Link href="/" className="font-bold text-[var(--color-accent)] hover:underline">
                  the feed
                </Link>{" "}
                and{" "}
                <Link href="/case" className="font-bold text-[var(--color-accent)] hover:underline">
                  the case
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Start typing above, or tap a topic to jump in.
        </p>
      )}
    </div>
  );
}
