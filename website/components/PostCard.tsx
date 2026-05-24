import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import type { MediaItem, Post } from "@/lib/types";
import { PostBody } from "@/components/PostBody";
import { ShareButton } from "@/components/ShareButton";
import { PostStats } from "@/components/PostStats";
import { SITE } from "@/lib/site";
import { muxThumbnailUrl } from "@/lib/mux";

export function PostCard({
  post,
  commentCount,
  truncate = true,
}: {
  post: Post;
  commentCount: number;
  truncate?: boolean;
}) {
  const when = post.published_at
    ? formatDistanceToNowStrict(new Date(post.published_at), { addSuffix: true })
    : "";
  const postUrl = `${SITE.url}/posts/${post.slug}`;
  const shareTitle = post.title ?? (post.body ? post.body.slice(0, 80) : SITE.name);

  return (
    <article className="group/card border-b border-[var(--color-line)] py-7 first:pt-2 transition">
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 font-semibold uppercase tracking-wider text-[10px]">
              Pinned
            </span>
          )}
          <TypeBadge type={post.type} />
          {post.category && (
            <span className="uppercase tracking-wider">{post.category}</span>
          )}
          <span aria-hidden>·</span>
          <time dateTime={post.published_at ?? undefined}>{when}</time>
        </div>
      </header>

      <PostCardBody post={post} truncate={truncate} />

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <PostStats
          views={post.views_count ?? 0}
          comments={commentCount}
          shares={post.shares_count ?? 0}
          size="sm"
        />
        <div className="flex items-center gap-2">
          <Link
            href={`/posts/${post.slug}`}
            className="text-[var(--color-accent)] hover:underline underline-offset-4 font-semibold whitespace-nowrap"
          >
            {post.type === "video" ? "Watch →" : "Read →"}
          </Link>
          <ShareButton url={postUrl} title={shareTitle} slug={post.slug} compact />
        </div>
      </div>
    </article>
  );
}

function PostCardBody({ post, truncate }: { post: Post; truncate: boolean }) {
  if (post.type === "note") {
    return (
      <Link href={`/posts/${post.slug}`} className="block group">
        <p className="text-lg leading-relaxed whitespace-pre-wrap group-hover:text-[var(--color-accent)] transition">
          {post.body}
        </p>
      </Link>
    );
  }

  if (post.type === "photo") {
    return (
      <>
        {post.title ? (
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
              {post.title}
            </Link>
          </h2>
        ) : null}
        <Link href={`/posts/${post.slug}`} className="block">
          <PhotoGrid media={post.media ?? []} />
        </Link>
        {post.body ? (
          <p className="mt-3 text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
            {truncate && post.body.length > 280 ? post.body.slice(0, 280) + "…" : post.body}
          </p>
        ) : null}
      </>
    );
  }

  if (post.type === "video") {
    const playbackId = post.mux_playback_id;
    const thumb = playbackId
      ? muxThumbnailUrl(playbackId, { width: 1200, time: 1 })
      : post.thumbnail_url ?? null;
    const isProcessing = post.mux_status && post.mux_status !== "ready";
    return (
      <>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
          <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
            {post.title ?? "Untitled video"}
          </Link>
        </h2>
        <Link href={`/posts/${post.slug}`} className="block relative aspect-video rounded-lg overflow-hidden bg-black border border-[var(--color-line)] group">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            {isProcessing ? (
              <span className="rounded-full bg-black/70 text-white text-sm px-4 py-2">
                Processing video…
              </span>
            ) : (
              <span className="rounded-full bg-white/95 text-[var(--color-ink)] w-16 h-16 flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <svg viewBox="0 0 24 24" className="w-7 h-7 ml-1" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            )}
          </div>
          {post.duration_seconds ? (
            <span className="absolute bottom-2 right-2 rounded bg-black/70 text-white text-xs px-1.5 py-0.5">
              {formatDuration(post.duration_seconds)}
            </span>
          ) : null}
        </Link>
        {post.body ? (
          <p className="mt-3 text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
            {truncate && post.body.length > 280 ? post.body.slice(0, 280) + "…" : post.body}
          </p>
        ) : null}
      </>
    );
  }

  // text (default)
  const body = truncate && post.body.length > 480 ? post.body.slice(0, 480) + "…" : post.body;
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
          {post.title ?? "Untitled"}
        </Link>
      </h2>
      <div className="mt-3">
        <PostBody body={body} />
      </div>
    </>
  );
}

function TypeBadge({ type }: { type: Post["type"] }) {
  if (type === "text") return null;
  const label = type === "note" ? "Note" : type === "photo" ? "Photo" : "Video";
  return (
    <span className="rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
      {label}
    </span>
  );
}

function PhotoGrid({ media }: { media: MediaItem[] }) {
  if (media.length === 0) return null;
  if (media.length === 1) {
    const m = media[0];
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.url}
        alt={m.alt ?? ""}
        className="w-full rounded-lg max-h-[600px] object-cover border border-[var(--color-line)]"
      />
    );
  }
  const count = Math.min(media.length, 4);
  return (
    <div
      className={
        count === 2
          ? "grid grid-cols-2 gap-1"
          : count === 3
            ? "grid grid-cols-3 gap-1"
            : "grid grid-cols-2 gap-1"
      }
    >
      {media.slice(0, 4).map((m, i) => (
        <div key={m.url} className="relative aspect-square overflow-hidden rounded-md border border-[var(--color-line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={m.alt ?? ""} className="absolute inset-0 w-full h-full object-cover" />
          {i === 3 && media.length > 4 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-semibold">
              +{media.length - 4}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
