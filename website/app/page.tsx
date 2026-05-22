import { getPublishedPosts, getCommentCount } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { ProfileHero } from "@/components/ProfileHero";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { J6Banner } from "@/components/J6Banner";
import { LiveActivity } from "@/components/LiveActivity";
import { SITE } from "@/lib/site";
import Link from "next/link";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const view: "latest" | "trending" = sort === "trending" ? "trending" : "latest";
  const posts = await getPublishedPosts({ sort: view });
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);
  const signupDisabled = !SITE.mailingAddress;

  // Split pinned from the rest so we can render them in separate sections.
  // In Trending mode, pinned still floats but the visual grouping makes the
  // chronological order of unpinned posts crystal clear.
  const pinned = posts.filter((p) => p.pinned);
  const rest = posts.filter((p) => !p.pinned);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ProfileHero />

        <div className="mt-6">
          <J6Banner />
        </div>

        <div className="mt-4">
          <LiveActivity />
        </div>

        {/* Pinned section — always shown together at the top */}
        {pinned.length > 0 ? (
          <section className="mt-8">
            <div className="flex items-baseline justify-between gap-3 mb-3 border-b-2 border-[var(--color-accent)] pb-1.5">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold flex items-center gap-1.5">
                📌 Pinned · {pinned.length}
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                Curated by Ryan
              </p>
            </div>
            <div>
              {pinned.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  commentCount={countMap.get(p.id) ?? 0}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Chronological feed */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-[var(--color-line)]">
            <h2 className="sr-only">Feed</h2>
            <nav className="flex gap-0" role="tablist" aria-label="Feed sort">
              <SortTab href="/" active={view === "latest"}>
                {view === "latest" ? "Latest →" : "Latest"}
              </SortTab>
              <SortTab href="/?sort=trending" active={view === "trending"}>
                Trending
              </SortTab>
            </nav>
          </div>
          {rest.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted)]">
              {pinned.length > 0
                ? "Nothing new below the pinned set yet."
                : "No posts yet. Check back soon."}
            </p>
          ) : (
            <div>
              {rest.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  commentCount={countMap.get(p.id) ?? 0}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <aside className="space-y-5">
        <VerseSidebar />
        <SignupForm disabled={signupDisabled} />

        {/* Send-a-tip CTA — prominent invite for the public to participate */}
        <Link
          href="/submit"
          className="block rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)] transition group"
        >
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)] group-hover:text-[var(--color-paper)]">
            J6 tip line
          </p>
          <p className="mt-1.5 text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-paper)] leading-tight">
            Got a tip? Anonymous. Free.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)] group-hover:text-[var(--color-paper)]">
            Photos, documents, names, stories. Ryan reads every one. →
          </p>
        </Link>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)]">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
            About this site
          </p>
          <p>
            This is a domain I own and a feed I write. No algorithm. No throttling.
            Just my words, on my front porch.
          </p>
          <p className="mt-3">
            <Link
              href="/about"
              className="text-[var(--color-accent)] underline underline-offset-4"
            >
              Read the full About
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

function SortTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2.5 -mb-px border-b-2 text-sm font-bold tracking-tight transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
