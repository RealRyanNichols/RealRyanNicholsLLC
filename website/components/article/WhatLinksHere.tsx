import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// "What links here" — the inbound half of the internal link graph. Shows the
// published articles that cite THIS one, so a reader (or an engine) can walk
// the web backwards. Renders nothing when the post has no inbound links.
// This is the first public surface of the Evidence Nexus graph.

type InboundRow = {
  from_post_id: string;
  posts: { slug: string; title: string | null; published_at: string | null } | null;
};

export async function WhatLinksHere({ postId }: { postId: string }) {
  let rows: InboundRow[] = [];
  try {
    const supabase = getSupabaseStaticClient();
    const { data } = await supabase
      .from("post_links")
      .select("from_post_id, posts!post_links_from_post_id_fkey(slug, title, published_at)")
      .eq("to_post_id", postId)
      .limit(24);
    rows = (data ?? []) as unknown as InboundRow[];
  } catch {
    return null;
  }

  // Dedup by source post (a post may link here with several anchors) and
  // keep only published sources that resolved.
  const seen = new Set<string>();
  const sources = rows
    .filter((r) => {
      if (!r.posts?.slug || seen.has(r.from_post_id)) return false;
      seen.add(r.from_post_id);
      return true;
    })
    .slice(0, 8);
  if (sources.length === 0) return null;

  return (
    <aside className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-navy)]">
        What links here
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        {sources.length === 1
          ? "1 article on this site cites this one."
          : `${sources.length} articles on this site cite this one.`}
      </p>
      <ul className="mt-3 grid gap-1.5">
        {sources.map((r) => (
          <li key={r.from_post_id}>
            <Link
              href={`/posts/${r.posts!.slug}`}
              className="group flex items-center justify-between gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 transition hover:border-[var(--color-navy)]"
            >
              <span className="min-w-0 truncate text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-navy)]">
                {r.posts!.title ?? r.posts!.slug}
              </span>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">
                {r.posts!.published_at?.slice(0, 10) ?? ""} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
