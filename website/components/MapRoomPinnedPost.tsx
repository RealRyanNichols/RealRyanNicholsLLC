import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// The most-recent published post from Ryan, embedded inline so the
// Map Room visitor reads his voice without leaving the page. Acts as
// the "from the desk" anchor under all the analytics — reminds the
// reader the case archive belongs to a human writing in his own
// words, not an algorithm.
export async function MapRoomPinnedPost() {
  const supabase = getSupabaseStaticClient();
  const { data: post } = await supabase
    .from("posts")
    .select("slug, type, title, body, media, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!post) return null;

  type MediaItem = { url?: string; alt?: string };
  const media = Array.isArray(post.media) ? (post.media as MediaItem[]) : [];
  const firstImage = media[0]?.url;

  const bodyText = typeof post.body === "string" ? post.body : "";
  const teaser = bodyText.slice(0, 360);
  const isTruncated = bodyText.length > 360;

  return (
    <section className="mt-10 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="eyebrow">From Ryan&apos;s desk</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
          {post.published_at
            ? formatDistanceToNowStrict(new Date(post.published_at), {
                addSuffix: true,
              })
            : "just now"}
        </p>
      </div>

      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display leading-tight">
        <Link
          href={`/posts/${post.slug}`}
          className="hover:text-[var(--color-gold)]"
        >
          {post.title ?? (bodyText ? `${bodyText.slice(0, 80)}…` : "Untitled")}
        </Link>
      </h2>

      {firstImage ? (
        <div className="mt-4 rounded-xl overflow-hidden border border-[var(--color-line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={media[0]?.alt ?? ""}
            className="w-full h-auto block"
          />
        </div>
      ) : null}

      {teaser ? (
        <p className="mt-4 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap line-clamp-6">
          {teaser}
          {isTruncated ? "…" : ""}
        </p>
      ) : null}

      <Link
        href={`/posts/${post.slug}`}
        className="btn-accent mt-5 inline-flex items-center rounded-full px-5 py-2.5 text-sm"
      >
        Read the full post →
      </Link>
    </section>
  );
}
