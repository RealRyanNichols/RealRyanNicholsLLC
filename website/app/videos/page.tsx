import type { Metadata } from "next";
import Link from "next/link";
import { getCommentCount, getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { LiveNowBanner } from "@/components/LiveNowBanner";
import { getActiveLiveStream } from "@/lib/live";
import { VIDEO_CHANNELS, normalizeVideoChannel } from "@/lib/video-channels";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch Ryan Nichols videos on the site he owns. No social media gatekeeping, no algorithm between you and the record.",
  alternates: { canonical: "/videos" },
};

export default async function VideosPage() {
  const [publishedPosts, activeLiveStream] = await Promise.all([
    getPublishedPosts(),
    getActiveLiveStream(),
  ]);
  const posts = publishedPosts.filter((p) => p.type === "video");
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);
  const knownChannels = new Set<string>(VIDEO_CHANNELS);
  const channelGroups = [
    ...VIDEO_CHANNELS.map((channel) => ({
      channel,
      posts: posts.filter((p) => normalizeVideoChannel(p.category) === channel),
    })),
    {
      channel: "Unsorted",
      posts: posts.filter((p) => !knownChannels.has(normalizeVideoChannel(p.category))),
    },
  ].filter((group) => group.posts.length > 0);

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
        {channelGroups.length > 0 ? (
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Video channels">
            {channelGroups.map((group) => (
              <a
                key={group.channel}
                href={`#${channelId(group.channel)}`}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {group.channel} · {group.posts.length}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <section className="py-12">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
            <h2 className="text-xl font-bold tracking-tight">No videos are public yet.</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              When Ryan publishes the first upload, it will land here by channel.
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-8 space-y-10">
          {channelGroups.map((group) => (
            <section key={group.channel} id={channelId(group.channel)} className="scroll-mt-24">
              <div className="mb-2 flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
                    Channel
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {group.channel}
                  </h2>
                </div>
                <span className="text-sm text-[var(--color-muted)]">
                  {group.posts.length} video{group.posts.length === 1 ? "" : "s"}
                </span>
              </div>
              {group.posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  commentCount={countMap.get(p.id) ?? 0}
                />
              ))}
            </section>
          ))}
        </section>
      )}
    </main>
  );
}

function channelId(channel: string): string {
  return channel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
