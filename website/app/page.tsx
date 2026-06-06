import { getPublishedPosts, getCommentCount } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { ProfileHero } from "@/components/ProfileHero";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { BookPromo } from "@/components/BookPromo";
import { BookCtaBand } from "@/components/BookCtaBand";
import { LiveNowBanner } from "@/components/LiveNowBanner";
import { getActiveLiveStream } from "@/lib/live";
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
  const [posts, activeLiveStream] = await Promise.all([
    getPublishedPosts({ sort: view }),
    getActiveLiveStream(),
  ]);
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);
  const emailSignupEnabled = Boolean(
    SITE.mailingAddress &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL,
  );

  // Pinned posts float to the top of the feed; everything else follows in
  // chronological order. getPublishedPosts already returns them pinned-first
  // (then newest-first / by views), and PostCard shows a "Pinned" badge.
  const feed = posts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <LiveNowBanner stream={activeLiveStream} />
        <ProfileHero />

        <BookCtaBand className="mt-8" />

        {/* Chronological feed — strict newest-first, no pinning */}
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
          {feed.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted)]">
              No posts yet. Check back soon.
            </p>
          ) : (
            <div>
              {feed.map((p) => (
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
        <SignupForm emailEnabled={emailSignupEnabled} />

        {/* Book waitlist cross-promo — funnel the feed into /book */}
        <BookPromo />

        {/* Send-a-tip CTA — prominent invite for the public to participate */}
        <Link
          href="/submit"
          className="block rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)] transition group"
        >
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)] group-hover:text-[var(--color-paper)]">
            The tip line
          </p>
          <p className="mt-1.5 text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-paper)] leading-tight">
            Got a story? Send it.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)] group-hover:text-[var(--color-paper)]">
            Local, national, worldwide — or a J6 case. Anonymous, free. Ryan
            reads every one. →
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
