import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Auto-curated digest of everything that landed in the public record
// in the last 24 hours — case documents, events, grievances, posts.
// One unified ticker the visitor reads every time they come back.
// Falls back to a 7-day window if 24h is empty so the panel never
// feels dead on light-traffic days.
export async function MapRoomDocket() {
  const supabase = getSupabaseStaticClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  async function fetchSince(since: string) {
    const [
      { data: docs },
      { data: events },
      { data: griev },
      { data: posts },
    ] = await Promise.all([
      supabase
        .from("case_documents")
        .select("slug, title, doc_type, document_date, created_at")
        .eq("visibility", "public")
        .eq("archived", false)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("case_events")
        .select("slug, title, event_date, created_at")
        .eq("visibility", "public")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("case_grievances")
        .select("slug, title, severity, created_at")
        .eq("visibility", "public")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("posts")
        .select("slug, title, type, published_at, created_at")
        .eq("status", "published")
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .limit(40),
    ]);

    type Item = {
      kind: "document" | "event" | "grievance" | "post";
      slug: string;
      title: string;
      sub: string;
      href: string;
      when: string;
    };
    const items: Item[] = [];
    for (const d of docs ?? [])
      items.push({
        kind: "document",
        slug: d.slug,
        title: d.title ?? "(untitled)",
        sub: `${d.doc_type} · evidence on file`,
        href: `/case/documents/${d.slug}`,
        when: d.created_at,
      });
    for (const e of events ?? [])
      items.push({
        kind: "event",
        slug: e.slug,
        title: e.title ?? "(untitled)",
        sub: e.event_date
          ? `event · ${format(new Date(e.event_date), "MMM d, yyyy")}`
          : "event",
        href: `/case/events/${e.slug}`,
        when: e.created_at,
      });
    for (const g of griev ?? [])
      items.push({
        kind: "grievance",
        slug: g.slug,
        title: g.title ?? "(untitled)",
        sub: `grievance · severity ${g.severity}/5`,
        href: `/case/grievances/${g.slug}`,
        when: g.created_at,
      });
    for (const p of posts ?? [])
      items.push({
        kind: "post",
        slug: p.slug,
        title: p.title ?? "(no title)",
        sub: `${p.type} · Ryan posted`,
        href: `/posts/${p.slug}`,
        when: p.published_at ?? p.created_at,
      });

    items.sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
    );
    return items;
  }

  let items = await fetchSince(since24h);
  let windowLabel: "24h" | "7d" = "24h";
  if (items.length === 0) {
    items = await fetchSince(since7d);
    windowLabel = "7d";
  }
  const top = items.slice(0, 12);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            Today&apos;s docket
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
            What hit the record{" "}
            {windowLabel === "24h" ? "in the last 24 hours" : "this week"}.
          </h2>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
          Auto-curated · {windowLabel}
        </p>
      </div>

      {top.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-ink-soft)] italic">
          Nothing new in the last 7 days. When new evidence drops — your
          post, a scraped document, a defendant who claimed their profile
          — it lands here.
        </div>
      ) : (
        <ol className="mt-5 space-y-2">
          {top.map((it) => (
            <li key={`${it.kind}-${it.slug}`}>
              <Link
                href={it.href}
                className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] px-4 py-3 transition group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <KindBadge kind={it.kind} />
                  <span className="flex-1 text-sm sm:text-base font-bold tracking-tight group-hover:text-[var(--color-accent)]">
                    {it.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold tabular-nums whitespace-nowrap">
                    {formatDistanceToNowStrict(new Date(it.when), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  {it.sub}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function KindBadge({
  kind,
}: {
  kind: "document" | "event" | "grievance" | "post";
}) {
  const styles: Record<typeof kind, { label: string; cls: string }> = {
    document: {
      label: "Evidence",
      cls: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    },
    event: {
      label: "Timeline",
      cls: "bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
    },
    grievance: {
      label: "Grievance",
      cls: "bg-[var(--color-accent)] text-[var(--color-paper)]",
    },
    post: {
      label: "From Ryan",
      cls: "bg-[var(--color-success)] text-[var(--color-paper)]",
    },
  };
  const s = styles[kind];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
