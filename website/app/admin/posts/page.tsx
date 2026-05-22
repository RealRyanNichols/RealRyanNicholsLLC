import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PostAdminRow } from "@/components/PostAdminRow";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type View = "published" | "draft" | "pinned" | "all";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/posts");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { filter } = await searchParams;
  const view: View =
    filter === "draft" || filter === "pinned" || filter === "all"
      ? (filter as View)
      : "published";

  let query = supabase
    .from("posts")
    .select(
      "id, slug, type, title, body, pinned, status, category, published_at, created_at, views_count, shares_count",
    )
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (view === "pinned") {
    query = query.eq("pinned", true);
  } else if (view === "draft") {
    query = query.eq("status", "draft");
  } else if (view === "published") {
    query = query.eq("status", "published");
  }

  const { data: posts, error } = await query;

  const [
    { count: publishedCount },
    { count: draftCount },
    { count: pinnedCount },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("pinned", true),
  ]);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · posts
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mt-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          All posts
        </h1>
        <Link
          href="/admin/new"
          className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-4 py-2 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
        >
          + New post
        </Link>
      </div>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Pin / unpin, toggle draft/published, or delete. Click the title to view
        the post page. Edit comes next.
      </p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "published"} href="/admin/posts?filter=published">
          Published ({publishedCount ?? 0})
        </TabLink>
        <TabLink active={view === "pinned"} href="/admin/posts?filter=pinned">
          📌 Pinned ({pinnedCount ?? 0})
        </TabLink>
        <TabLink active={view === "draft"} href="/admin/posts?filter=draft">
          Drafts ({draftCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href="/admin/posts?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-[var(--color-accent)]">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {!posts || posts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic py-6">
            No posts in this bucket.
          </p>
        ) : (
          posts.map((p) => {
            const when =
              p.published_at ?? p.created_at;
            return (
              <PostAdminRow
                key={p.id}
                id={p.id}
                slug={p.slug}
                title={p.title}
                bodyExcerpt={
                  p.body ? p.body.slice(0, 140) : null
                }
                type={p.type}
                category={p.category}
                pinned={!!p.pinned}
                status={p.status}
                viewsCount={p.views_count ?? 0}
                sharesCount={p.shares_count ?? 0}
                publishedAtRelative={formatDistanceToNowStrict(new Date(when), {
                  addSuffix: true,
                })}
                publishedAtAbsolute={format(new Date(when), "MMM d, yyyy h:mma")}
              />
            );
          })
        )}
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
