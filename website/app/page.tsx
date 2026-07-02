import { getPublishedPosts, getCommentCount } from "@/lib/posts";
import { getOgImages } from "@/lib/og-images";
import { PostCard } from "@/components/PostCard";
import { ProfileHero } from "@/components/ProfileHero";
import { PathPicker } from "@/components/PathPicker";
import { RyanChat } from "@/components/RyanChat";
import { GetToKnowYou } from "@/components/GetToKnowYou";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { BookPromo } from "@/components/BookPromo";
import { BookCtaBand } from "@/components/BookCtaBand";
import { FeedPoll } from "@/components/FeedPoll";
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
  const [posts, activeLiveStream, ogImages] = await Promise.all([
    getPublishedPosts({ sort: view }),
    getActiveLiveStream(),
    getOgImages(),
  ]);
  // Custom OG thumbnails keyed by post path — used as feed-card art for
  // text-only posts (PostCard ignores it when the body has its own visual).
  const ogMap = new Map(ogImages.map((o) => [o.path, o.image_url]));
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);
  const emailSignupEnabled = SITE.emailCaptureEnabled;

  // Pinned posts float to the top of the feed; everything else follows in
  // chronological order. getPublishedPosts already returns them pinned-first
  // (then newest-first / by views), and PostCard shows a "Pinned" badge.
  const feed = posts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <LiveNowBanner stream={activeLiveStream} />
        <ProfileHero />

        <div className="mt-4">
          <PathPicker variant="band" />
        </div>

        {/* Feed sits directly under the hero — people come to read first.
            The take-action blocks are woven into the feed below at spaced
            breaks (not stacked above it), so each lands where it belongs
            without burying the posts. */}
        <section className="mt-6">
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
              {feed.flatMap((p, i) => [
                <PostCard
                  key={p.id}
                  post={p}
                  commentCount={countMap.get(p.id) ?? 0}
                  fallbackImage={ogMap.get(`/posts/${p.slug}`) ?? null}
                />,
                // Feed poll right after the lead post (renders only when a
                // poll is live); book band a few posts later — spaced, so
                // nothing bunches. (Rally pledges are retired — sell, don't ask.)
                // On phones the sidebar doesn't exist (it stacks below the
                // fold), so its capture surfaces are woven into the feed at
                // spaced breaks too — lg:hidden here, hidden lg:block in the
                // aside, so nothing renders twice on the same screen.
                i === 0 ? (
                  <FeedPoll key="home-poll" className="my-8" />
                ) : null,
                i === 1 ? (
                  <GetToKnowYou
                    key="home-gtky-mobile"
                    className="lg:hidden my-8 rounded-2xl bg-[var(--color-surface)] p-5"
                  />
                ) : null,
                i === 2 ? (
                  // Donations retired — this slot sells the other offer:
                  // paid builds and investigations (/services).
                  <aside
                    key="home-services"
                    className="my-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      Work with Ryan
                    </p>
                    <p className="mt-2 text-lg font-bold tracking-tight text-[var(--color-ink)]">
                      Want a site like this one — feed, evidence wall, store,
                      the works?
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      Ryan builds them on the same stack that runs this page.
                      Sites, dashboards, and sourced investigations.
                    </p>
                    <Link
                      href="/services"
                      className="btn-accent mt-4 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
                    >
                      See the services →
                    </Link>
                  </aside>
                ) : null,
                i === 4 ? (
                  <VerseSidebar
                    key="home-verse-mobile"
                    className="lg:hidden my-8 rounded-2xl bg-[var(--color-surface)] p-5"
                  />
                ) : null,
                i === 5 ? (
                  <SignupForm
                    key="home-signup-mobile"
                    emailEnabled={emailSignupEnabled}
                    className="lg:hidden my-8 rounded-2xl border-2 border-[var(--color-support)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]"
                  />
                ) : null,
                i === 6 ? (
                  <BookCtaBand key="home-book" className="my-8" />
                ) : null,
                i === 8 ? (
                  <TipLineCard key="home-tip-mobile" className="lg:hidden my-8" />
                ) : null,
              ])}
            </div>
          )}
        </section>

        {/* Talk to Ryan — below the feed now. People come to read first; the
            floating launcher and the nav button still open the chat from
            anywhere, and #talk lands here. */}
        <div id="talk" className="mt-10 scroll-mt-24">
          <RyanChat variant="hero" surface="home" />
        </div>
      </div>
      {/* Sidebar hierarchy: the two money surfaces (Signup, BookPromo) carry
          the gold accent treatment; everything else sits quiet — borderless
          on --color-surface — so the cards stop blurring into one another. */}
      <aside className="space-y-5">
        <GetToKnowYou className="hidden lg:block rounded-2xl bg-[var(--color-surface)] p-5" />
        <VerseSidebar className="hidden lg:block rounded-2xl bg-[var(--color-surface)] p-5" />
        <SignupForm
          emailEnabled={emailSignupEnabled}
          className="hidden lg:block rounded-2xl border-2 border-[var(--color-support)] bg-[var(--color-paper)] p-5 shadow-[0_0_26px_var(--color-support-glow)]"
        />

        {/* Book waitlist cross-promo — funnel the feed into /book */}
        <BookPromo className="shadow-[0_0_26px_var(--color-support-glow)]" />

        {/* Send-a-tip CTA — quiet card, blue only as the label cue */}
        <TipLineCard className="hidden lg:block" />

        <div className="rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)]">
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

function TipLineCard({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/submit"
      className={`block rounded-2xl bg-[var(--color-surface)] p-5 transition hover:bg-[var(--color-blue-soft)] ${className}`}
    >
      <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
        The tip line
      </p>
      <p className="mt-1.5 text-base font-bold text-[var(--color-ink)] leading-tight">
        Got a story? Send it.
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Local, national, worldwide — or a J6 case. Anonymous, free. Ryan
        reads every one. →
      </p>
    </Link>
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
