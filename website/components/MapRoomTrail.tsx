import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Trail of the week — the three cases / pages getting the most
// attention right now. Pulls from page_views via the analytics_top_*
// RPCs we already built. Public (no admin gate), only returns slug +
// name + view count so it's safe to expose.

type Hot = {
  kind: "person" | "post" | "grievance" | "event" | "document";
  slug: string;
  title: string;
  views: number;
  sub?: string;
  href: string;
};

export async function MapRoomTrail() {
  const supabase = getSupabaseStaticClient();

  // Fall back to all-time view counts (already on each row as
  // views_count, updated by the existing CaseViewTracker) when we
  // don't yet have enough page_views data for the new analytics
  // pipeline to surface trends.
  const [
    { data: people },
    { data: griev },
    { data: docs },
    { data: posts },
  ] = await Promise.all([
    supabase
      .from("case_people")
      .select("slug, name, views_count, is_j6_defendant, claim_status")
      .eq("visibility", "public")
      .gt("views_count", 0)
      .order("views_count", { ascending: false })
      .limit(8),
    supabase
      .from("case_grievances")
      .select("slug, title, views_count, severity")
      .eq("visibility", "public")
      .gt("views_count", 0)
      .order("views_count", { ascending: false })
      .limit(8),
    supabase
      .from("case_documents")
      .select("slug, title, views_count, doc_type")
      .eq("visibility", "public")
      .eq("archived", false)
      .gt("views_count", 0)
      .order("views_count", { ascending: false })
      .limit(8),
    supabase
      .from("posts")
      .select("slug, title, body, type, views_count, published_at")
      .eq("status", "published")
      .gt("views_count", 0)
      .order("views_count", { ascending: false })
      .limit(8),
  ]);

  const items: Hot[] = [];
  for (const p of people ?? [])
    items.push({
      kind: "person",
      slug: p.slug,
      title: p.name,
      views: p.views_count ?? 0,
      sub: p.is_j6_defendant
        ? p.claim_status === "verified"
          ? "verified J6 defendant"
          : p.claim_status === "pending"
            ? "claim pending"
            : "J6 defendant"
        : "person of record",
      href: `/case/people/${p.slug}`,
    });
  for (const g of griev ?? [])
    items.push({
      kind: "grievance",
      slug: g.slug,
      title: g.title ?? "(untitled)",
      views: g.views_count ?? 0,
      sub: `grievance · severity ${g.severity}/5`,
      href: `/case/grievances/${g.slug}`,
    });
  for (const d of docs ?? [])
    items.push({
      kind: "document",
      slug: d.slug,
      title: d.title ?? "(untitled)",
      views: d.views_count ?? 0,
      sub: `evidence · ${d.doc_type}`,
      href: `/case/documents/${d.slug}`,
    });
  for (const p of posts ?? [])
    items.push({
      kind: "post",
      slug: p.slug,
      title: p.title ?? (typeof p.body === "string" ? p.body.slice(0, 80) : "Untitled"),
      views: p.views_count ?? 0,
      sub: `Ryan posted · ${p.type}`,
      href: `/posts/${p.slug}`,
    });

  items.sort((a, b) => b.views - a.views);
  const top = items.slice(0, 6);

  if (top.length === 0) return null;

  return (
    <section className="mt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Trail of the week
      </p>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
        What people are reading right now.
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-3xl">
        The six pages with the most attention across the case archive.
        Click any one — it&apos;ll be on someone&apos;s screen by the time
        you do.
      </p>

      <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {top.map((it, i) => (
          <li key={`${it.kind}-${it.slug}`}>
            <Link
              href={it.href}
              className="group block h-full rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] p-5 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  #{i + 1}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {it.sub}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight leading-tight group-hover:text-[var(--color-accent)] line-clamp-3">
                {it.title}
              </h3>
              <p className="mt-3 text-xs text-[var(--color-muted)] tabular-nums">
                {it.views.toLocaleString()} views
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
