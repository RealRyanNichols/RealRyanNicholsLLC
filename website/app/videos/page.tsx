import type { Metadata } from "next";
import Link from "next/link";
import { getCommentCount, getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { LiveNowBanner } from "@/components/LiveNowBanner";
import { getActiveLiveStream } from "@/lib/live";
import { VIDEO_CHANNELS, normalizeVideoChannel } from "@/lib/video-channels";
import { BookPromo } from "@/components/BookPromo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch Ryan Nichols videos on the site he owns. No social media gatekeeping, no algorithm between you and the record.",
  alternates: { canonical: "/videos" },
};

const KNOWN_CHANNELS = new Set<string>(VIDEO_CHANNELS);

/** A video's channel for grouping/filtering: a known channel, else "Unsorted". */
function channelOf(category: string | null | undefined): string {
  const c = normalizeVideoChannel(category);
  return KNOWN_CHANNELS.has(c) ? c : "Unsorted";
}

function channelId(channel: string): string {
  return channel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function VideosPage(props: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel: selectedId } = await props.searchParams;
  const [publishedPosts, activeLiveStream] = await Promise.all([
    getPublishedPosts(),
    getActiveLiveStream(),
  ]);
  // getPublishedPosts already returns feed order: pinned first, then newest
  // first. We keep that order untouched so Watch reads exactly like the Feed.
  const allVideos = publishedPosts.filter((p) => p.type === "video");
  const j6Videos = allVideos.filter((p) => channelOf(p.category) === "J6");

  // Channels that actually have videos, in their canonical order, with counts.
  const channels = [...VIDEO_CHANNELS, "Unsorted"]
    .map((channel) => ({
      channel,
      id: channelId(channel),
      count: allVideos.filter((p) => channelOf(p.category) === channel).length,
    }))
    .filter((c) => c.count > 0);

  const active = channels.find((c) => c.id === selectedId) ?? null;
  const videos = active
    ? allVideos.filter((p) => channelOf(p.category) === active.channel)
    : allVideos;
  // On the default view, J6 videos live in the spotlight above, so the main
  // feed shows everything else (no duplication). Filtered views are unchanged.
  const feedVideos = active
    ? videos
    : allVideos.filter((p) => channelOf(p.category) !== "J6");

  const counts = await Promise.all(
    videos.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <LiveNowBanner stream={activeLiveStream} />
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:underline">
          Back to feed
        </Link>
      </nav>
      <header className="border-b border-[var(--color-line)] pb-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          Site-owned video
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          Watch here. Not on social media.
        </h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Videos live on RealRyanNichols.com. Share the link, but the playback
          happens here.
        </p>
        {channels.length > 0 ? (
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filter videos by channel">
            <FilterChip href="/videos" label="All" count={allVideos.length} active={!active} />
            {channels.map((c) => (
              <FilterChip
                key={c.id}
                href={`/videos?channel=${c.id}`}
                label={c.channel}
                count={c.count}
                active={active?.id === c.id}
              />
            ))}
          </nav>
        ) : null}
      </header>

      {!active && j6Videos.length > 0 ? (
        <section className="mt-8 overflow-hidden rounded-xl border-2 border-[var(--color-accent)] shadow-sm">
          <div className="bg-[#071126] p-5 text-[#fdf8ea] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
              J6 Video Drops
            </p>
            <h2 className="mt-2 font-display text-3xl font-black leading-tight text-[#fdf8ea] sm:text-4xl">
              The footage, released one drop at a time.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#cfd9ea]">
              Bodycam, tunnel footage, and the receipts from January 6 — pulled
              from my own evidence and dropped here, on a site I own, where no
              algorithm can bury them. More are coming.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/videos?channel=j6"
                className="inline-flex min-h-11 items-center rounded-md border border-[#e1bd5b]/60 bg-[#e1bd5b]/15 px-4 text-sm font-black text-[#e1bd5b] transition hover:bg-[#e1bd5b]/25"
              >
                See all J6 drops · {j6Videos.length}
              </Link>
              <Link
                href="/support"
                className="inline-flex min-h-11 items-center rounded-md border border-white/15 bg-white/[0.06] px-4 text-sm font-black text-[#fdf8ea] transition hover:bg-white/10"
              >
                Back the work
              </Link>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-4 sm:p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
              Latest drop
            </p>
            <PostCard
              post={j6Videos[0]}
              commentCount={countMap.get(j6Videos[0].id) ?? 0}
            />
          </div>
        </section>
      ) : null}

      {!active ? <BookPromo className="mt-6" /> : null}

      {allVideos.length === 0 ? (
        <section className="py-12">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
            <h2 className="text-xl font-bold tracking-tight">No videos are public yet.</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              When Ryan publishes the first upload, it will land here.
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          {active ? (
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              Showing <strong className="text-[var(--color-ink)]">{active.channel}</strong> —{" "}
              {videos.length} video{videos.length === 1 ? "" : "s"}.{" "}
              <Link href="/videos" className="text-[var(--color-accent)] hover:underline font-semibold">
                Show all
              </Link>
            </p>
          ) : null}
          {feedVideos.map((p) => (
            <PostCard key={p.id} post={p} commentCount={countMap.get(p.id) ?? 0} />
          ))}
        </section>
      )}
    </main>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
      ].join(" ")}
    >
      {label} · {count}
    </Link>
  );
}
