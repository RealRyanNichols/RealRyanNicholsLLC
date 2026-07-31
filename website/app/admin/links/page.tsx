import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Link graph",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The internal link graph report. Orphan posts are published pages with zero
// inbound internal links: they leak traffic because nothing on the site walks
// a reader to them. This page is the to-do list for weaving the archive
// together, and the beginning of the Evidence Nexus graph.

type PostRow = { id: string; slug: string; title: string | null; published_at: string | null };
type LinkRow = { from_post_id: string; to_post_id: string; anchor_text: string; kind: string };

export default async function AdminLinksPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/links");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const [{ data: posts }, { data: links }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, title, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000),
    supabase.from("post_links").select("from_post_id, to_post_id, anchor_text, kind").limit(5000),
  ]);

  const allPosts = (posts ?? []) as PostRow[];
  const allLinks = (links ?? []) as LinkRow[];

  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const l of allLinks) {
    inbound.set(l.to_post_id, (inbound.get(l.to_post_id) ?? 0) + 1);
    outbound.set(l.from_post_id, (outbound.get(l.from_post_id) ?? 0) + 1);
  }

  const orphans = allPosts.filter((p) => (inbound.get(p.id) ?? 0) === 0);
  const connected = allPosts
    .filter((p) => (inbound.get(p.id) ?? 0) > 0)
    .sort((a, b) => (inbound.get(b.id) ?? 0) - (inbound.get(a.id) ?? 0));

  return (
    <article className="mx-auto max-w-3xl px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · link graph
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Orphans leak traffic
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        A published post nothing links to is a dead end in the archive. Add a{" "}
        <code className="rounded bg-[var(--color-surface-2)] px-1 py-0.5 font-mono text-xs">
          {"{{related: ...}}"}
        </code>{" "}
        block or an inline link from a sibling article to bring each one into
        the web. Edges are recorded automatically on every publish.
      </p>

      <section className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <Pulse n={allPosts.length} label="published posts" />
          <Pulse n={allLinks.length} label="internal edges" />
          <Pulse n={orphans.length} label="orphans" hot={orphans.length > 0} />
          <Pulse n={connected.length} label="connected" />
        </div>
      </section>

      {orphans.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-lg font-bold tracking-tight">
            Orphans · zero inbound links
          </h2>
          <ul className="mt-3 grid gap-1.5">
            {orphans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/posts/${p.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.06] px-3.5 py-2.5 transition hover:border-[var(--color-accent)]"
                >
                  <span className="min-w-0 truncate text-sm font-bold text-[var(--color-ink)]">
                    {p.title ?? p.slug}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">
                    {p.published_at?.slice(0, 10) ?? ""} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6">
          <p className="text-lg font-bold tracking-tight">No orphans.</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Every published post has at least one inbound internal link.
          </p>
        </section>
      )}

      {connected.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Most linked-to</h2>
          <ul className="mt-3 grid gap-1.5">
            {connected.slice(0, 15).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/posts/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 transition hover:border-[var(--color-navy)]"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink)]">
                    {p.title ?? p.slug}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-navy)]">
                    {inbound.get(p.id) ?? 0} in
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function Pulse({ n, label, hot }: { n: number; label: string; hot?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`text-lg font-bold tabular-nums tracking-tight ${hot ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"}`}
      >
        {n.toLocaleString()}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
    </span>
  );
}
