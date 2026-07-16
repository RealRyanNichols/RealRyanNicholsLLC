import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import type { MediaItem, Post } from "@/lib/types";
import { PostBody } from "@/components/PostBody";
import { ShareButton } from "@/components/ShareButton";
import { PostStats } from "@/components/PostStats";
import { SITE } from "@/lib/site";
import { muxThumbnailUrl } from "@/lib/mux";
import { getDirectVideoUrl } from "@/lib/direct-video";

export function PostCard({
  post,
  commentCount,
  truncate = true,
  fallbackImage = null,
}: {
  post: Post;
  commentCount: number;
  truncate?: boolean;
  // Custom OG thumbnail (from page_og_images) used as the card art ONLY when a
  // text post has no visual of its own — never over an embed, image, or video.
  fallbackImage?: string | null;
}) {
  const when = post.published_at
    ? formatDistanceToNowStrict(new Date(post.published_at), { addSuffix: true })
    : "";
  const postUrl = `${SITE.url}/posts/${post.slug}`;
  const shareTitle = post.title ?? (post.body ? post.body.slice(0, 80) : SITE.name);
  const readingMinutes = readingTimeMinutes(post);

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
          {readingMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{readingMinutes} min read</span>
            </>
          ) : null}
        </div>
      </header>

      <PostCardBody post={post} truncate={truncate} fallbackImage={fallbackImage} />

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

// Estimated read time at ~200 wpm. Hidden for short notes and quick reads so the
// label only appears where it actually helps the reader decide to commit.
function readingTimeMinutes(post: Post): number | null {
  if (post.type === "note" || !post.body) return null;
  const words = post.body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 120) return null;
  return Math.max(2, Math.round(words / 200));
}

function feedExcerpt(body: string, maxLength: number): string {
  const cleaned = body
    // Media/interactive blocks belong in the full post, not the feed excerpt.
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/^\s*\{\{[\s\S]*?}}\s*$/gm, " ")
    // Keep linked words, remove Markdown mechanics.
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  return `${lastSpace > 160 ? truncated.slice(0, lastSpace) : truncated}…`;
}

// True when a text post's body renders its own visual in the feed — a tweet or
// Facebook embed, a markdown image, or a media shortcode. When false, the post
// is effectively text-only and can fall back to its custom OG thumbnail.
function bodyHasVisual(body: string): boolean {
  // A tweet/Facebook URL alone on a line (what PostBody turns into an embed).
  if (/^[ \t]*https?:\/\/(?:x\.com|twitter\.com|(?:www\.)?facebook\.com|fb\.watch)\/\S+[ \t]*$/im.test(body)) {
    return true;
  }
  // A markdown image.
  if (/!\[[^\]]*]\([^)\s]+/.test(body)) return true;
  // A visual shortcode (video player, receipt grids/stacks, case banner).
  if (/\{\{\s*(?:video|receiptgrid|receiptstack|casebanner)\b/i.test(body)) return true;
  return false;
}

function PostCardBody({
  post,
  truncate,
  fallbackImage,
}: {
  post: Post;
  truncate: boolean;
  fallbackImage: string | null;
}) {
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
            {truncate ? feedExcerpt(post.body, 280) : post.body}
          </p>
        ) : null}
      </>
    );
  }

  if (post.type === "video") {
    const playbackId = post.mux_playback_id;
    const directVideoUrl = getDirectVideoUrl(post.media);
    const thumb =
      post.thumbnail_url ??
      (playbackId ? muxThumbnailUrl(playbackId, { width: 1200, time: 1 }) : null);
    const isProcessing = !directVideoUrl && post.mux_status && post.mux_status !== "ready";
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
          ) : directVideoUrl ? (
            <video
              src={directVideoUrl}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
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
            {truncate ? feedExcerpt(post.body, 280) : post.body}
          </p>
        ) : null}
      </>
    );
  }

  // text (default).
  // Show the real body so tweet embeds, images, and media shortcodes render
  // inline (that's the in-feed experience we want to keep). Only fall back to
  // the custom OG thumbnail when the body has NO visual of its own — so a
  // text-only post gets card art instead of a bare wall of text.
  const cardImage =
    post.thumbnail_url ?? (bodyHasVisual(post.body) ? null : fallbackImage ?? null);
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
          {post.title ?? "Untitled"}
        </Link>
      </h2>
      {cardImage ? (
        // A card image (own thumbnail, or the OG fallback) means we show a
        // plain-text excerpt — rendering the full body would repaint visuals.
        <>
          <Link
            href={`/posts/${post.slug}`}
            className="mt-3 block relative aspect-video overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </Link>
          <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
            {feedExcerpt(post.body, 280)}
          </p>
        </>
      ) : bodyHasVisual(post.body) ? (
        // The body carries its own visual (tweet embed, image, video shortcode)
        // — render it so the feed keeps its social, media-forward feel.
        <div className="mt-3">
          <PostBody
            body={truncate && post.body.length > 480 ? post.body.slice(0, 480) + "…" : post.body}
          />
        </div>
      ) : (
        // Plain text with no visual: a clean, clamped excerpt instead of raw
        // markdown (headings and blockquotes mid-card made the feed read like
        // one endless article — every card now has an obvious start and end).
        <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
          {feedExcerpt(post.body, 280)}
        </p>
      )}
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
