import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { getCommentCounts, getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { LiveNowBanner } from "@/components/LiveNowBanner";
import { getActiveLiveStream } from "@/lib/live";
import { VIDEO_CHANNELS, normalizeVideoChannel } from "@/lib/video-channels";
import { BookPromo } from "@/components/BookPromo";
import { JsonLd } from "@/components/JsonLd";
import { muxThumbnailUrl } from "@/lib/mux";
import { SITE } from "@/lib/site";
import { HandlersSeriesShelf } from "@/components/HandlersSeriesShelf";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "Videos",
  description:
    "Watch Ryan Nichols videos on the site he owns. No social media gatekeeping, no algorithm between you and the record.",
  path: "/videos",
});

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

  const countMap = await getCommentCounts(videos.map((p) => p.id));

  // Machine-readable index of the site-owned videos (top 24) so engines see
  // real VideoObjects with thumbnails and durations, not just links.
  const videoListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allVideos
      .filter((p) => p.mux_playback_id)
      .slice(0, 24)
      .map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "VideoObject",
          name: p.title ?? "Video",
          description: p.seo_description ?? p.title ?? "Video from Ryan Nichols",
          url: `${SITE.url}/posts/${p.slug}`,
          thumbnailUrl:
            p.thumbnail_url ??
            muxThumbnailUrl(p.mux_playback_id ?? "", { width: 1200, time: 1 }),
          ...(p.published_at ? { uploadDate: p.published_at } : {}),
          ...(p.duration_seconds
            ? { duration: `PT${Math.round(p.duration_seconds)}S` }
            : {}),
        },
      })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={videoListLd} />
      <LiveNowBanner stream={activeLiveStream} />
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/" className="inline-flex min-h-11 items-center hover:underline sm:min-h-0">
          Back to feed
        </Link>
      </nav>
      <header className="border-b border-[var(--color-line)] pb-5">
        <p className="eyebrow" data-reveal>
          Site-owned video
        </p>
        <h1
          className="display mt-3 text-4xl sm:text-6xl"
          data-reveal
          style={{ "--d": 1 } as React.CSSProperties}
        >
          Watch here. Not on social media.
        </h1>
        <div
          className="mt-5 h-[3px] w-[4.5rem] bg-[var(--color-gold)]"
          aria-hidden
          data-reveal
          style={{ "--d": 2 } as React.CSSProperties}
        />
        <p className="mt-4 text-[var(--color-ink-soft)]">
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

      {!active ? <HandlersSeriesShelf /> : null}

      {!active && j6Videos.length > 0 ? (
        <section
          className="mt-8 overflow-hidden rounded-xl border border-[var(--color-line)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          data-reveal
        >
          <div className="bg-[var(--color-surface-2)] p-5 text-[var(--color-ink)] sm:p-7">
            <p className="eyebrow">
              J6 Video Drops
            </p>
            <h2 className="mt-2 font-display text-3xl font-black leading-tight text-[var(--color-ink)] sm:text-4xl">
              The footage, released one drop at a time.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
              Bodycam, tunnel footage, and the receipts from January 6 — pulled
              from my own evidence and dropped here, on a site I own, where no
              algorithm can bury them. More are coming.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/videos?channel=j6"
                className="btn-accent inline-flex min-h-11 items-center rounded-md px-4 text-sm"
              >
                See all J6 drops · {j6Videos.length}
              </Link>
              <Link
                href="/book/preorder"
                className="btn-ghost inline-flex min-h-11 items-center rounded-md px-4 text-sm font-black"
              >
                Get the Book
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
            <p className="eyebrow mb-3">
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
          <div className="panel p-6 text-center" data-reveal>
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
              <Link href="/videos" className="text-[var(--color-gold)] hover:underline font-semibold">
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
        "inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 text-xs font-bold transition sm:min-h-0",
        active
          ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-navy)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]",
      ].join(" ")}
    >
      {label} · {count}
    </Link>
  );
}
